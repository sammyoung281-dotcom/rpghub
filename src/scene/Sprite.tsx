import { useEffect, useRef } from "react";
import type { ElevationZone, Facing, LightSource, SceneHotspot, Urgency } from "../types";
import { URGENCY_COLOR } from "../types";
import { depthScaleAt, elevationAt, lightTint } from "./depth";

/**
 * An animated pixel-sprite character with depth (Milestone C). Renders from a
 * real sprite sheet (`spot.sprite`) when supplied, else a procedural SVG
 * placeholder. Walks an ambient waypoint loop, faces its velocity, frame-steps
 * the walk. Each frame it also computes its depth:
 *  - z-index = effective baseline Y (feet − elevation) → y-sorts against other
 *    sprites and the occluder layers, so it passes behind/in front of props.
 *  - elevation lift raises the figure + shadow onto raised ground (e.g. plaza).
 *  - depth-scale shrinks it slightly toward the top, grows toward the bottom.
 *  - nearby lights (crystals/torches) add a coloured rim glow.
 */

// Scenes are authored in local 480×270 px and scaled up by the camera, so the
// 48px sheet frame is drawn 1:1 in scene space (DRAW=1) and wander speed is in
// that small space too.
const DRAW = 1;
const SPEED = 24; // local px/sec
const PAUSE = 0.9;

export default function Sprite({
  spot,
  marker,
  onClick,
  zones,
  lights,
  depthScale,
  sceneH,
}: {
  spot: SceneHotspot;
  marker?: Urgency;
  onClick: () => void;
  zones?: ElevationZone[];
  lights?: LightSource[];
  depthScale?: { min: number; max: number };
  sceneH: number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const figRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);

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
    let scale = 1;
    let glow = "";

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
        el.style.transform = `translate(-50%, -100%) scale(${flip ? -scale : scale}, ${scale})`;
        el.style.filter = glow;
      } else if (figRef.current) {
        const cls = `sprite-fig ph face-${facing}${moving ? " walking" : ""}`;
        if (cls !== lastClass) {
          figRef.current.className = cls;
          lastClass = cls;
        }
        figRef.current.style.transform = `translate(-50%, -100%) scale(${scale})`;
        figRef.current.style.filter = glow;
      }
      if (shadowRef.current) shadowRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`;
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

      // depth
      const lift = elevationAt(x, y, zones);
      scale = depthScaleAt(y, sceneH, depthScale);
      const tint = lightTint(x, y, lights);
      glow = tint.intensity > 0 ? `drop-shadow(0 0 ${Math.round(tint.intensity * 16)}px ${tint.color})` : "";

      root.style.transform = `translate(${x}px, ${y - lift}px)`;
      root.style.zIndex = String(Math.round(y - lift)); // effective baseline → y-sort
      apply();
      raf = requestAnimationFrame(tick);
    };
    apply();
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [spot, zones, lights, depthScale, sceneH]);

  const needs = marker === "needs_me";
  const figW = 48 * DRAW;
  const off = spot.labelOffset ?? { x: 0, y: 0 };
  const a = spot.accent;

  return (
    <div ref={rootRef} className="sprite-root" style={{ transform: `translate(${spot.x}px, ${spot.y}px)` }}>
      <div ref={shadowRef} className="sprite-shadow" style={{ width: figW * 0.4, height: figW * 0.15 }} />

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
      {/* labels counter-scale (1/zoom) so they stay screen-readable at any zoom */}
      <div className="sprite-label" style={{ top: -42 + off.y, marginLeft: off.x }}>
        {marker && (
          <span className={"sprite-marker" + (needs ? " urgent" : "")} style={{ background: URGENCY_COLOR[marker] }}>
            {needs ? "!" : ""}
          </span>
        )}
        <span className="sprite-name">{spot.name}</span>
      </div>
    </div>
  );
}
