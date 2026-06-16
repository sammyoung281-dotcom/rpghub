import { useEffect, useRef } from "react";

/**
 * Drifting glowing motes — a cheap, pretty atmosphere layer drawn on a canvas
 * sized to the viewport (not the scene), so it's independent of pan/zoom.
 */
export default function Motes() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;

    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const N = 46;
    const motes = Array.from({ length: N }).map(() => ({
      x: Math.random(),
      y: Math.random(),
      r: 1 + Math.random() * 2.4,
      sp: 0.2 + Math.random() * 0.5,
      drift: (Math.random() - 0.5) * 0.3,
      ph: Math.random() * Math.PI * 2,
    }));

    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      for (const m of motes) {
        m.y -= (m.sp * dt) / 8;
        m.x += (m.drift * dt) / 8;
        m.ph += dt;
        if (m.y < -0.05) {
          m.y = 1.05;
          m.x = Math.random();
        }
        const alpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(m.ph * 2));
        const px = m.x * W;
        const py = m.y * H;
        const g = ctx.createRadialGradient(px, py, 0, px, py, m.r * 6);
        g.addColorStop(0, `rgba(255, 244, 200, ${alpha})`);
        g.addColorStop(1, "rgba(255, 244, 200, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, m.r * 6, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="scene-motes" />;
}
