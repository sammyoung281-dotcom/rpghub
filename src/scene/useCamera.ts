import { useEffect, useRef, useState } from "react";

export interface Camera {
  x: number; // world point at the centre of the viewport
  y: number;
  zoom: number;
}

const MIN_ZOOM = 0.45;
const MAX_ZOOM = 1.6;
const PAN_SPEED = 900; // px/sec at zoom 1 (keyboard)

interface Opts {
  sceneW: number;
  sceneH: number;
  viewportRef: React.RefObject<HTMLElement>;
  /** A point to glide to (world coords); cleared by caller once consumed. */
  focusTarget: { x: number; y: number; zoom?: number } | null;
  onFocusConsumed: () => void;
}

/**
 * God-camera over a painted scene: pan with WASD/arrows or drag, zoom on wheel,
 * and glide smoothly to a focus target. Returns the live camera + a setter the
 * stage reads each frame. Clamps so you can't fly off into the void.
 */
export function useCamera({ sceneW, sceneH, viewportRef, focusTarget, onFocusConsumed }: Opts) {
  const [cam, setCam] = useState<Camera>({ x: sceneW / 2, y: sceneH / 2, zoom: 0.7 });
  const camRef = useRef(cam);
  camRef.current = cam;

  const keys = useRef<Record<string, boolean>>({});
  const glideTo = useRef<{ x: number; y: number; zoom: number } | null>(null);
  const drag = useRef<{ active: boolean; lastX: number; lastY: number }>({
    active: false,
    lastX: 0,
    lastY: 0,
  });

  // clamp the camera centre so the viewport edges stay near the scene
  const clamp = (c: Camera): Camera => {
    const el = viewportRef.current;
    const halfW = (el ? el.clientWidth : 800) / 2 / c.zoom;
    const halfH = (el ? el.clientHeight : 600) / 2 / c.zoom;
    const margin = 220; // allow a little overscan into the atmosphere
    return {
      zoom: c.zoom,
      x: Math.min(Math.max(c.x, halfW - margin), sceneW - halfW + margin),
      y: Math.min(Math.max(c.y, halfH - margin), sceneH - halfH + margin),
    };
  };

  // keyboard + wheel + drag listeners
  useEffect(() => {
    const el = viewportRef.current;
    const down = (e: KeyboardEvent) => (keys.current[e.code] = true);
    const up = (e: KeyboardEvent) => (keys.current[e.code] = false);

    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      glideTo.current = null;
      setCam((c) => clamp({ ...c, zoom: clampZoom(c.zoom * (e.deltaY < 0 ? 1.12 : 0.89)) }));
    };
    const mdown = (e: MouseEvent) => {
      drag.current = { active: true, lastX: e.clientX, lastY: e.clientY };
      glideTo.current = null;
    };
    const mmove = (e: MouseEvent) => {
      if (!drag.current.active) return;
      const dx = e.clientX - drag.current.lastX;
      const dy = e.clientY - drag.current.lastY;
      drag.current.lastX = e.clientX;
      drag.current.lastY = e.clientY;
      setCam((c) => clamp({ ...c, x: c.x - dx / c.zoom, y: c.y - dy / c.zoom }));
    };
    const mup = () => (drag.current.active = false);

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    el?.addEventListener("wheel", wheel, { passive: false });
    el?.addEventListener("mousedown", mdown);
    window.addEventListener("mousemove", mmove);
    window.addEventListener("mouseup", mup);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      el?.removeEventListener("wheel", wheel);
      el?.removeEventListener("mousedown", mdown);
      window.removeEventListener("mousemove", mmove);
      window.removeEventListener("mouseup", mup);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // receive a focus request
  useEffect(() => {
    if (focusTarget) {
      glideTo.current = {
        x: focusTarget.x,
        y: focusTarget.y,
        zoom: clampZoom(focusTarget.zoom ?? 1.05),
      };
      onFocusConsumed();
    }
  }, [focusTarget, onFocusConsumed]);

  // animation loop: keyboard pan + glide easing
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const k = keys.current;
      let nx = camRef.current.x;
      let ny = camRef.current.y;
      let nz = camRef.current.zoom;

      const g = glideTo.current;
      if (g) {
        const t = 1 - Math.pow(0.0025, dt); // smooth ease
        nx += (g.x - nx) * t;
        ny += (g.y - ny) * t;
        nz += (g.zoom - nz) * t;
        if (Math.hypot(g.x - nx, g.y - ny) < 2 && Math.abs(g.zoom - nz) < 0.01) {
          nx = g.x;
          ny = g.y;
          nz = g.zoom;
          glideTo.current = null;
        }
      } else {
        const step = (PAN_SPEED * dt) / nz;
        if (k["KeyA"] || k["ArrowLeft"]) nx -= step;
        if (k["KeyD"] || k["ArrowRight"]) nx += step;
        if (k["KeyW"] || k["ArrowUp"]) ny -= step;
        if (k["KeyS"] || k["ArrowDown"]) ny += step;
      }

      if (nx !== camRef.current.x || ny !== camRef.current.y || nz !== camRef.current.zoom) {
        setCam(clamp({ x: nx, y: ny, zoom: nz }));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return cam;
}

function clampZoom(z: number) {
  return Math.min(Math.max(z, MIN_ZOOM), MAX_ZOOM);
}
