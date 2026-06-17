import { useEffect, useRef, useState } from "react";

export interface Camera {
  x: number; // world point at the centre of the viewport
  y: number;
  zoom: number;
}

const MAX_ZOOM = 3.5;
const PAN_SPEED = 220; // px/sec at zoom 1 (keyboard) — scenes are small (480×270)
const OVERSCAN = 14; // px you can nudge the view past the scene edges

interface Opts {
  sceneW: number;
  sceneH: number;
  viewportRef: React.RefObject<HTMLElement>;
  /** A point to glide to (world coords); cleared by caller once consumed. */
  focusTarget: { x: number; y: number; zoom?: number } | null;
  onFocusConsumed: () => void;
}

/**
 * God-camera over a painted scene: pan (WASD/drag), zoom (wheel), glide-to-focus.
 *
 * Bounded so the illusion never breaks: zoom can't go below the "cover" zoom
 * (the scene always fills the viewport), and panning can't push the viewport
 * past the scene edges. When an axis is fully covered, the camera locks to the
 * centre on that axis (you can only pan along the axis that has slack).
 */
export function useCamera({ sceneW, sceneH, viewportRef, focusTarget, onFocusConsumed }: Opts) {
  const [cam, setCam] = useState<Camera>({ x: sceneW / 2, y: sceneH / 2, zoom: 1 });
  const camRef = useRef(cam);
  camRef.current = cam;

  const keys = useRef<Record<string, boolean>>({});
  const glideTo = useRef<{ x: number; y: number; zoom: number } | null>(null);
  const drag = useRef({ active: false, lastX: 0, lastY: 0 });

  const vp = () => {
    const el = viewportRef.current;
    return { w: el ? el.clientWidth : window.innerWidth, h: el ? el.clientHeight : window.innerHeight };
  };

  // smallest zoom at which the scene still fully COVERS the viewport (framed
  // interior — no zoom-out-to-void). You can zoom in from here.
  const coverZoom = () => {
    const { w, h } = vp();
    return Math.max(w / sceneW, h / sceneH);
  };
  const clampZoom = (z: number) => Math.min(Math.max(z, coverZoom()), MAX_ZOOM);

  // keep the camera centre near the scene (a little overscan into atmosphere).
  // when an axis is fully covered, lock to its centre.
  const clamp = (c: Camera): Camera => {
    const zoom = clampZoom(c.zoom);
    const { w, h } = vp();
    const halfW = w / 2 / zoom;
    const halfH = h / 2 / zoom;
    const axis = (v: number, half: number, size: number) => {
      const lo = half - OVERSCAN;
      const hi = size - half + OVERSCAN;
      return lo >= hi ? size / 2 : Math.min(Math.max(v, lo), hi);
    };
    return { zoom, x: axis(c.x, halfW, sceneW), y: axis(c.y, halfH, sceneH) };
  };

  // input listeners
  useEffect(() => {
    const el = viewportRef.current;
    const down = (e: KeyboardEvent) => (keys.current[e.code] = true);
    const up = (e: KeyboardEvent) => (keys.current[e.code] = false);

    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      glideTo.current = null;
      setCam((c) => clamp({ ...c, zoom: c.zoom * (e.deltaY < 0 ? 1.12 : 0.89) }));
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
    const onResize = () => setCam((c) => clamp(c));

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    el?.addEventListener("wheel", wheel, { passive: false });
    el?.addEventListener("mousedown", mdown);
    window.addEventListener("mousemove", mmove);
    window.addEventListener("mouseup", mup);
    window.addEventListener("resize", onResize);

    // open framed to fill the viewport
    setCam((c) => clamp({ ...c, zoom: coverZoom() }));

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      el?.removeEventListener("wheel", wheel);
      el?.removeEventListener("mousedown", mdown);
      window.removeEventListener("mousemove", mmove);
      window.removeEventListener("mouseup", mup);
      window.removeEventListener("resize", onResize);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        const t = 1 - Math.pow(0.0025, dt);
        nx += (g.x - nx) * t;
        ny += (g.y - ny) * t;
        nz += (g.zoom - nz) * t;
        if (Math.hypot(g.x - nx, g.y - ny) < 2 && Math.abs(g.zoom - nz) < 0.01) {
          ({ x: nx, y: ny, zoom: nz } = g);
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
