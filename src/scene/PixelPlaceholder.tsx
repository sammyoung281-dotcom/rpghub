import { useEffect, useRef } from "react";
import type { RealmScene } from "../types";

/**
 * Milestone-A placeholder: draws the realm at a LOW virtual resolution onto a
 * canvas, then lets CSS scale it up with `image-rendering: pixelated` → big,
 * crisp pixels. Deliberately blocky, NOT faux hand-pixelled. Swapped out the
 * moment a scene supplies real `layers` (owner-supplied pixel PNGs).
 *
 * Virtual base resolution: scene scaled down by PX (10×) → e.g. 4800×3000 → 480×300.
 */
const PX = 10;

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

    // deterministic noise
    let seed = 7;
    const rng = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    const w2 = (x: number) => x / PX;

    // grass base + blocky tufts + dark-forest edge vignette
    const cx = W / 2;
    const cy = H / 2;
    const maxD = Math.hypot(cx, cy);
    for (let y = 0; y < H; y += 4) {
      for (let x = 0; x < W; x += 4) {
        const d = Math.hypot(x - cx, y - cy) / maxD; // 0 center → 1 edge
        const base = d < 0.55 ? "#3f8a5c" : d < 0.8 ? "#245c3f" : "#16382c";
        ctx.fillStyle = rng() < 0.12 ? "#2f6f47" : base;
        ctx.fillRect(x, y, 4, 4);
      }
    }

    const keep = scene.regions.find((r) => r.id === "keep") ?? scene.regions[0];

    // paths (tan) from keep to each region
    ctx.strokeStyle = "#9c6a3c";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    for (const r of scene.regions) {
      if (r.id === "keep") continue;
      ctx.beginPath();
      ctx.moveTo(w2(keep.cx), w2(keep.cy));
      ctx.lineTo(w2(r.cx), w2(r.cy));
      ctx.stroke();
    }

    // blocky buildings (back-to-front by cy)
    const drawBuilding = (sx: number, sy: number, ww: number, wh: number, wall: string, roof: string) => {
      ctx.fillStyle = "rgba(0,0,0,0.28)"; // ground shadow
      ctx.fillRect(sx - ww / 2 - 1, sy - 2, ww + 2, 5);
      ctx.fillStyle = wall;
      ctx.fillRect(sx - ww / 2, sy - wh, ww, wh);
      ctx.fillStyle = roof;
      for (let i = 0; i < ww / 2 + 2; i++) {
        const h = Math.min(i, ww / 2 + 2 - i);
        ctx.fillRect(sx - ww / 2 + i, sy - wh - h, 1, h + 1);
      }
      ctx.fillStyle = "#23160f"; // door
      ctx.fillRect(sx - 2, sy - Math.min(6, wh), 4, Math.min(6, wh));
    };

    [...scene.regions]
      .sort((a, b) => a.cy - b.cy)
      .forEach((r) => {
        const col = REGION_COLOR[r.id] ?? REGION_COLOR.keep;
        const big = r.id === "keep";
        drawBuilding(w2(r.cx), w2(r.cy), big ? 34 : 24, big ? 26 : 18, col.wall, col.roof);
      });
  }, [scene]);

  return <canvas ref={ref} className="pixel-canvas" />;
}
