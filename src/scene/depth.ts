import type { ElevationZone, LightSource } from "../types";

/** Ray-cast point-in-polygon on the XZ ground plane (world coords). */
export function pointInPolygon(px: number, py: number, poly: { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const hit = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (hit) inside = !inside;
  }
  return inside;
}

/** Pixels to lift a sprite standing at (x,y) — max of any elevation zone it's in. */
export function elevationAt(x: number, y: number, zones?: ElevationZone[]): number {
  if (!zones) return 0;
  let lift = 0;
  for (const z of zones) if (pointInPolygon(x, y, z.polygon)) lift = Math.max(lift, z.heightOffset);
  return lift;
}

/** Subtle depth-scale: smaller toward the top (far), larger toward the bottom (near). */
export function depthScaleAt(y: number, sceneH: number, clamp?: { min: number; max: number }): number {
  if (!clamp) return 1;
  const t = Math.min(1, Math.max(0, y / sceneH));
  return clamp.min + (clamp.max - clamp.min) * t;
}

/** Strongest nearby light's colour + 0..1 intensity for a rim glow. */
export function lightTint(
  x: number,
  y: number,
  lights?: LightSource[]
): { color: string; intensity: number } {
  let best = { color: "#ffffff", intensity: 0 };
  if (!lights) return best;
  for (const l of lights) {
    const d = Math.hypot(l.x - x, l.y - y);
    if (d < l.radius) {
      const intensity = 1 - d / l.radius;
      if (intensity > best.intensity) best = { color: l.color, intensity };
    }
  }
  return best;
}
