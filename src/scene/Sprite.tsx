import { useEffect, useRef } from "react";
import type { Facing, SceneHotspot, Urgency } from "../types";
import { URGENCY_COLOR } from "../types";

/**
 * An animated pixel-sprite character. Renders from a real sprite sheet
 * (`spot.sprite`) when supplied, else a procedural blocky placeholder. Walks an
 * ambient waypoint loop (Phase-1 mock — the "doing their job" wander), picking a
 * 4-direction facing from its velocity and frame-stepping the walk at a retro
 * fps while the position tweens smoothly. Keeps the `!` marker, status ring and
 * click-to-dialogue intact, anchored above its head.
 *
 * Depth-sorting / elevation / occluders / light tint arrive in Milestone C.
 */

const DRAW = 4; // integer up-scale of the 48px frame → 192px tall in world space
const SPEED = 95; // world px/sec wander
const PAUSE = 0.7; // sec to dwell at each waypoint

export default function Sprite({
  spot,
  marker,
  onClick,
}: {
  spot: SceneHotspot;
  marker?: Urgency;
  onClick: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current!;
    const sheet = spot.sprite;
    const fps = sheet?.fps ?? 8;
    const path = spot.waypoints && spot.waypoints.length > 1 ? spot.waypoints : null;

    // state
    let x = spot.x;
    let y = spot.y;
    let target = 1;
    let dwell = 0;
    let facing: Facing = spot.initialFacing ?? "down";
    let moving = false;
    let t = 0;
    let lastDrawn = "";

    // preload real sheet
    let sheetImg: HTMLImageElement | null = null;
    if (sheet) {
      sheetImg = new Image();
      sheetImg.src = sheet.src;
    }

    const draw = () => {
      const frameInWalk = moving ? Math.floor(t * fps) % 4 : -1;
      const key = `${facing}|${frameInWalk}`;
      if (key === lastDrawn) return;
      lastDrawn = key;

      if (sheet && imgRef.current && sheetImg) {
        // real sheet: pick row by facing, column by frame
        let row = sheet.rows[facing];
        let flip = false;
        if (row === undefined && facing === "right" && sheet.rows.left !== undefined) {
          row = sheet.rows.left;
          flip = true;
        }
        row = row ?? 0;
        const col = moving ? sheet.walkFrames[frameInWalk % sheet.walkFrames.length] : sheet.idleFrame;
        const el = imgRef.current;
        el.style.backgroundImage = `url(${sheet.src})`;
        el.style.backgroundSize = `${sheet.cols * sheet.frameW * DRAW}px ${4 * sheet.frameH * DRAW}px`;
        el.style.backgroundPosition = `-${col * sheet.frameW * DRAW}px -${row * sheet.frameH * DRAW}px`;
        el.style.transform = `translate(-50%, -100%) scaleX(${flip ? -1 : 1})`;
      } else if (canvasRef.current) {
        drawPlaceholder(canvasRef.current, facing, frameInWalk, spot.accent);
      }
    };

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;

      if (path) {
        const tx = path[target].x;
        const ty = path[target].y;
        const dx = tx - x;
        const dy = ty - y;
        const dist = Math.hypot(dx, dy);
        if (dist < 4) {
          moving = false;
          dwell += dt;
          if (dwell >= PAUSE) {
            dwell = 0;
            target = (target + 1) % path.length;
          }
        } else {
          moving = true;
          const step = Math.min(SPEED * dt, dist);
          x += (dx / dist) * step;
          y += (dy / dist) * step;
          facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
        }
      }

      root.style.transform = `translate(${x}px, ${y}px)`;
      draw();
      raf = requestAnimationFrame(tick);
    };
    draw();
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [spot]);

  const needs = marker === "needs_me";
  const figW = 48 * DRAW;

  return (
    <div ref={rootRef} className="sprite-root" style={{ transform: `translate(${spot.x}px, ${spot.y}px)` }}>
      {/* contact shadow */}
      <div className="sprite-shadow" style={{ width: figW * 0.42, height: figW * 0.16 }} />

      {/* the figure (clickable) */}
      {spot.sprite ? (
        <div
          ref={imgRef}
          className="sprite-fig pixel-img"
          style={{ width: 48 * DRAW, height: 48 * DRAW }}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        />
      ) : (
        <canvas
          ref={canvasRef}
          className="sprite-fig pixel-canvas"
          width={48}
          height={48}
          style={{ width: 48 * DRAW, height: 48 * DRAW }}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        />
      )}

      {/* status ring + name + quest marker, floating above the head */}
      {marker && (
        <span className="sprite-ring" style={{ borderColor: URGENCY_COLOR[marker] }} />
      )}
      <span className="sprite-name">{spot.name}</span>
      {marker && (
        <span className={"sprite-marker" + (needs ? " urgent" : "")} style={{ background: URGENCY_COLOR[marker] }}>
          {needs ? "!" : ""}
        </span>
      )}
    </div>
  );
}

/** Draw a crude blocky stand-in person into a 48×48 canvas (placeholder only). */
function drawPlaceholder(canvas: HTMLCanvasElement, facing: Facing, walkFrame: number, accent: string) {
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, 48, 48);
  ctx.save();
  if (facing === "left") {
    ctx.translate(48, 0);
    ctx.scale(-1, 1);
  }
  const step = walkFrame >= 0 ? walkFrame % 2 : -1;
  const bob = step === 1 ? -1 : 0;

  // legs (alternate when walking)
  ctx.fillStyle = "#2c2b46";
  if (step < 0) {
    ctx.fillRect(19, 40, 4, 6);
    ctx.fillRect(25, 40, 4, 6);
  } else if (step === 0) {
    ctx.fillRect(17, 40, 4, 6);
    ctx.fillRect(27, 40, 4, 5);
  } else {
    ctx.fillRect(21, 40, 4, 5);
    ctx.fillRect(25, 40, 4, 6);
  }

  // cloak/body (accent), wider at the base
  ctx.fillStyle = accent;
  ctx.fillRect(16, 24 + bob, 16, 18);
  ctx.fillRect(14, 36 + bob, 20, 6);
  // shoulder shade
  ctx.fillStyle = shade(accent, -0.18);
  ctx.fillRect(16, 24 + bob, 16, 4);

  // head
  ctx.fillStyle = "#e8c79a";
  ctx.fillRect(18, 12 + bob, 12, 12);
  // ears nub
  ctx.fillStyle = shade("#e8c79a", -0.12);
  ctx.fillRect(17, 10 + bob, 4, 4);
  ctx.fillRect(27, 10 + bob, 4, 4);

  // face (only when facing camera-ish)
  if (facing === "down") {
    ctx.fillStyle = "#1b1a2e";
    ctx.fillRect(21, 17 + bob, 2, 2);
    ctx.fillRect(26, 17 + bob, 2, 2);
  } else if (facing !== "up") {
    ctx.fillStyle = "#1b1a2e";
    ctx.fillRect(26, 17 + bob, 2, 2);
  }
  ctx.restore();
}

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.round(Math.min(255, Math.max(0, v + amt * 255)));
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
}
