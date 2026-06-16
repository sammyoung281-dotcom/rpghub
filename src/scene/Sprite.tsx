import { useEffect, useRef } from "react";
import type { Facing, SceneHotspot, Urgency } from "../types";
import { URGENCY_COLOR } from "../types";

/**
 * An animated pixel-sprite character. Renders from a real sprite sheet
 * (`spot.sprite`) when supplied, else a procedural blocky SVG placeholder (SVG
 * paints declaratively — no canvas timing issues). Walks an ambient waypoint
 * loop (Phase-1 mock), picks a 4-direction facing from velocity, and frame-steps
 * the walk at a retro fps while position tweens smoothly. The `!` marker, status
 * ring and click-to-dialogue stay intact above the head; the name plate +
 * marker honour an optional per-character `labelOffset`.
 *
 * Depth-sorting / elevation / occluders / light tint arrive in Milestone C.
 */

const DRAW = 4; // up-scale of the 48px sheet frame → 192px tall in world space
const SPEED = 95; // world px/sec wander
const PAUSE = 0.7; // sec dwell at each waypoint

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
  const figRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current!;
    const sheet = spot.sprite;
    const fps = sheet?.fps ?? 8;
    const path = spot.waypoints && spot.waypoints.length > 1 ? spot.waypoints : null;

    let x = spot.x;
    let y = spot.y;
    let target = 1;
    let dwell = 0;
    let facing: Facing = spot.initialFacing ?? "down";
    let moving = false;
    let t = 0;
    let lastClass = "";

    const apply = () => {
      const frame = moving ? Math.floor(t * fps) % 4 : -1;
      if (sheet && imgRef.current) {
        let row = sheet.rows[facing];
        let flip = false;
        if (row === undefined && facing === "right" && sheet.rows.left !== undefined) {
          row = sheet.rows.left;
          flip = true;
        }
        row = row ?? 0;
        const col = moving ? sheet.walkFrames[frame % sheet.walkFrames.length] : sheet.idleFrame;
        const el = imgRef.current;
        el.style.backgroundPosition = `-${col * sheet.frameW * DRAW}px -${row * sheet.frameH * DRAW}px`;
        el.style.transform = `translate(-50%, -100%) scaleX(${flip ? -1 : 1})`;
      } else if (figRef.current) {
        const cls = `sprite-fig ph face-${facing}${moving ? " walking" : ""}`;
        if (cls !== lastClass) {
          figRef.current.className = cls;
          lastClass = cls;
        }
      }
    };

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;
      if (path) {
        const dx = path[target].x - x;
        const dy = path[target].y - y;
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
      apply();
      raf = requestAnimationFrame(tick);
    };
    apply();
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [spot]);

  const needs = marker === "needs_me";
  const figW = 48 * DRAW;
  const off = spot.labelOffset ?? { x: 0, y: 0 };
  const a = spot.accent;

  return (
    <div ref={rootRef} className="sprite-root" style={{ transform: `translate(${spot.x}px, ${spot.y}px)` }}>
      <div className="sprite-shadow" style={{ width: figW * 0.4, height: figW * 0.15 }} />

      {spot.sprite ? (
        <div
          ref={imgRef}
          className="sprite-fig pixel-img"
          style={{
            width: 48 * DRAW,
            height: 48 * DRAW,
            backgroundImage: `url(${spot.sprite.src})`,
            backgroundSize: `${spot.sprite.cols * spot.sprite.frameW * DRAW}px ${4 * spot.sprite.frameH * DRAW}px`,
          }}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        />
      ) : (
        <div
          ref={figRef}
          className="sprite-fig ph face-down"
          style={{ width: 96, height: 168 }}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
          <div className="ph-flip">
            <svg className="ph-svg" viewBox="0 0 16 28" preserveAspectRatio="xMidYMax meet">
              <rect className="ph-leg" x="5" y="23" width="2" height="5" fill="#2c2b46" />
              <rect className="ph-leg ph-leg-r" x="9" y="23" width="2" height="5" fill="#2c2b46" />
              <rect x="3" y="21" width="10" height="3" fill={a} />
              <rect x="4" y="13" width="8" height="11" fill={a} />
              <rect x="4" y="13" width="8" height="3" fill="rgba(0,0,0,0.2)" />
              <rect x="5" y="5" width="6" height="8" fill="#e8c79a" />
              <rect x="4" y="3" width="2" height="3" fill="#d6b187" />
              <rect x="10" y="3" width="2" height="3" fill="#d6b187" />
              <g className="ph-eyes">
                <rect x="6" y="8" width="1" height="2" fill="#1b1a2e" />
                <rect x="9" y="8" width="1" height="2" fill="#1b1a2e" />
              </g>
            </svg>
          </div>
        </div>
      )}

      {marker && <span className="sprite-ring" style={{ borderColor: URGENCY_COLOR[marker] }} />}
      <span className="sprite-name" style={{ top: -224 + off.y, marginLeft: off.x }}>
        {spot.name}
      </span>
      {marker && (
        <span
          className={"sprite-marker" + (needs ? " urgent" : "")}
          style={{ background: URGENCY_COLOR[marker], top: -256 + off.y, marginLeft: off.x }}
        >
          {needs ? "!" : ""}
        </span>
      )}
    </div>
  );
}
