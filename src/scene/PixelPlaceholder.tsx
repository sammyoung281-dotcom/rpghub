import { useEffect, useRef } from "react";
import type { RealmScene } from "../types";

/**
 * Milestone-A placeholder, refined: draws the realm at a virtual resolution of
 * scene ÷ PX onto a canvas, scaled up crisp via `image-rendering: pixelated`.
 * PX matches the sprite pixel size (4 world-px per source pixel) so ground and
 * characters share one consistent pixel grid. Grass fills edge-to-edge and the
 * viewport background is the same green, so there's no rectangle-on-void seam at
 * full zoom-out. Deliberately blocky — swapped out when real `layers` arrive.
 */
const PX = 4; // world px per source pixel (matches Sprite DRAW)

const GRASS = [
  [0x35, 0x7a, 0x4d],
  [0x3f, 0x8a, 0x5c],
  [0x2f, 0x6f, 0x47],
  [0x46, 0x91, 0x5f],
];

const REGION_COLOR: Record<string, { wall: string; roof: string }> = {
  keep: { wall: "#b9b7d0", roof: "#7a2f3a" },
  merchants: { wall: "#c9a36a", roof: "#6b3f22" },
  ledger: { wall: "#7a7896", roof: "#2c2b46" },
  hearth: { wall: "#c98f6a", roof: "#6b3f22" },
  scholars: { wall: "#6fbf86", roof: "#245c3f" },
};

export default function PixelPlaceholder({ scene }: { scene: RealmScene }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const W = Math.round(scene.width / PX);
    const H = Math.round(scene.height / PX);
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;

    // grass base + per-pixel tuft noise via ImageData (fast)
    const img = ctx.createImageData(W, H);
    const d = img.data;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        // cheap stable hash → shade index
        let h = (x * 374761393 + y * 668265263) & 0x7fffffff;
        h = (h ^ (h >> 13)) >>> 0;
        const shade = h % 17 === 0 ? 2 : h % 5 === 0 ? 3 : h % 2; // mostly base, occasional darker/lighter
        const [r, g, b] = GRASS[shade];
        const i = (y * W + x) * 4;
        d[i] = r;
        d[i + 1] = g;
        d[i + 2] = b;
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    const c = (v: number) => v / PX; // world → canvas
    const keep = scene.regions.find((r) => r.id === "keep") ?? scene.regions[0];

    // paths
    ctx.strokeStyle = "#9c6a3c";
    ctx.lineWidth = 16;
    ctx.lineCap = "round";
    for (const r of scene.regions) {
      if (r.id === "keep") continue;
      ctx.beginPath();
      ctx.moveTo(c(keep.cx), c(keep.cy));
      ctx.lineTo(c(r.cx), c(r.cy));
      ctx.stroke();
    }

    // blocky buildings, back-to-front
    const drawBuilding = (sx: number, sy: number, ww: number, wh: number, wall: string, roof: string) => {
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fillRect(sx - ww / 2 - 2, sy - 3, ww + 4, 6);
      ctx.fillStyle = wall;
      ctx.fillRect(sx - ww / 2, sy - wh, ww, wh);
      ctx.fillStyle = roof;
      for (let i = 0; i < ww / 2 + 3; i++) {
        const hh = Math.min(i, ww / 2 + 3 - i);
        ctx.fillRect(sx - ww / 2 + i, sy - wh - hh, 1, hh + 1);
      }
      ctx.fillStyle = "#1b1a2e";
      ctx.fillRect(sx - 4, sy - Math.min(12, wh), 8, Math.min(12, wh));
    };

    [...scene.regions]
      .sort((a, b) => a.cy - b.cy)
      .forEach((r) => {
        const col = REGION_COLOR[r.id] ?? REGION_COLOR.keep;
        const big = r.id === "keep";
        drawBuilding(c(r.cx), c(r.cy), big ? 64 : 46, big ? 50 : 36, col.wall, col.roof);
      });
  }, [scene]);

  return <canvas ref={ref} className="pixel-canvas" />;
}
