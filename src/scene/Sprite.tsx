import { useEffect, useRef } from "react";
import type { ElevationZone, Facing, LightSource, SceneHotspot, Urgency } from "../types";
import { URGENCY_COLOR } from "../types";
import { depthScaleAt, elevationAt, lightTint } from "./depth";
import { asset } from "../asset";

/**
 * An animated character sprite. Renders a painterly sheet (`spot.sprite`) —
 * SMOOTH (bilinear) scaling, NOT pixelated — sized to the scene's target
 * `spriteHeight` (small on the overworld, large in rooms), anchored by its feet
 * (bottom-centre of the cell). Walks an ambient waypoint loop, faces velocity,
 * frame-steps the walk. Marker / status ring / name float above the head and
 * counter-scale with zoom so they stay readable. Click → dialogue.
 */

const SPEED = 52; // scene px/sec wander
const PAUSE = 0.9;

export default function Sprite({
  spot,
  marker,
  onClick,
  spriteHeight,
  zones,
  lights,
  depthScale,
  sceneH,
}: {
  spot: SceneHotspot;
  marker?: Urgency;
  onClick: () => void;
  spriteHeight: number;
  zones?: ElevationZone[];
  lights?: LightSource[];
  depthScale?: { min: number; max: number };
  sceneH: number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const figRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);

  const sheet = spot.sprite;
  const drawScale = sheet ? spriteHeight / sheet.frameH : spriteHeight / 48; // px-per-frame → target height

  useEffect(() => {
    const root = rootRef.current!;
    const path = spot.waypoints && spot.waypoints.length > 1 ? spot.waypoints : null;

    let x = spot.x;
    let y = spot.y;
    let target = 1;
    let dwell = 0;
    let facing: Facing = spot.initialFacing ?? "down";
    let moving = false;
    let t = 0;
    let scale = 1;
    let glow = "";

    const apply = () => {
      if (!figRef.current) return;
      if (sheet) {
        let row = sheet.rows[facing];
        let flip = false;
        if (row === undefined && facing === "right" && sheet.rows.left !== undefined) {
          row = sheet.rows.left;
          flip = true;
        }
        row = row ?? 0;
        // The generated sheets have a correct idle/standing frame per direction,
        // but the *walk* frames are mirror-flipped copies (the held item swaps
        // hands each step, and the whole figure flips). Rather than play those,
        // we hold the direction's idle frame and add a small vertical bob while
        // moving — so the character faces the right way and reads as walking,
        // with nothing ever flipping. (A true leg-walk needs de-mirrored art.)
        const col = sheet.idleFrame;
        const bob = moving ? Math.abs(Math.sin(t * 9)) * sheet.frameH * drawScale * 0.06 : 0;
        const el = figRef.current;
        el.style.backgroundPosition = `-${col * sheet.frameW * drawScale}px -${row * sheet.frameH * drawScale}px`;
        el.style.transform = `translate(-50%, calc(-100% - ${bob}px)) scale(${flip ? -scale : scale}, ${scale})`;
        el.style.filter = glow;
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
        if (dist < 3) {
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
          // Facing is derived from the WHOLE leg (previous waypoint → current
          // target), not the per-frame delta. The per-frame dx/dy jitters when a
          // path is near-diagonal (|dx| ≈ |dy|), which made the sprite snap
          // between left/right (and front/back) every step. The leg vector is
          // constant for the leg, so facing holds steady while walking.
          const prev = (target - 1 + path.length) % path.length;
          const lx = path[target].x - path[prev].x;
          const ly = path[target].y - path[prev].y;
          facing = Math.abs(lx) > Math.abs(ly) ? (lx > 0 ? "right" : "left") : ly > 0 ? "down" : "up";
        }
      }
      const lift = elevationAt(x, y, zones);
      scale = depthScaleAt(y, sceneH, depthScale);
      const tint = lightTint(x, y, lights);
      glow = tint.intensity > 0 ? `drop-shadow(0 0 ${Math.round(tint.intensity * 14)}px ${tint.color})` : "";
      root.style.transform = `translate(${x}px, ${y - lift}px)`;
      root.style.zIndex = String(Math.round(y - lift));
      apply();
      raf = requestAnimationFrame(tick);
    };
    apply();
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [spot, zones, lights, depthScale, sceneH, drawScale, sheet]);

  const needs = marker === "needs_me";
  const off = spot.labelOffset ?? { x: 0, y: 0 };

  return (
    <div ref={rootRef} className="sprite-root" style={{ transform: `translate(${spot.x}px, ${spot.y}px)` }}>
      <div ref={shadowRef} className="sprite-shadow" style={{ width: spriteHeight * 0.5, height: spriteHeight * 0.16 }} />

      {sheet && (
        <div
          ref={figRef}
          className="sprite-fig sprite-sheet"
          style={{
            width: sheet.frameW * drawScale,
            height: sheet.frameH * drawScale,
            backgroundImage: `url(${asset(sheet.src)})`,
            backgroundSize: `${sheet.cols * sheet.frameW * drawScale}px ${4 * sheet.frameH * drawScale}px`,
          }}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        />
      )}

      {marker && <span className="sprite-ring" style={{ borderColor: URGENCY_COLOR[marker] }} />}
      <div className="sprite-label" style={{ top: -spriteHeight * 0.95 + off.y, marginLeft: off.x }}>
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
