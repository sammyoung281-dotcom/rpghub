import { useEffect, useRef, useState } from "react";
import { useRealmStore } from "../store/useRealmStore";
import "./QuestJuice.css";

/**
 * Instant dopamine (ADHD rule #5). Watches for a quest flipping to "done" and
 * fires a coin/spark burst on a canvas, a little WebAudio fanfare, and a
 * "Quest Sealed!" banner. Auto-dismisses; nothing to click.
 */
export default function QuestJuice() {
  const quests = useRealmStore((s) => s.quests);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const seen = useRef<Set<string> | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const [banner, setBanner] = useState(false);

  useEffect(() => {
    const doneIds = quests.filter((q) => q.status === "done").map((q) => q.id);
    // first run (incl. after rehydration): remember existing without celebrating
    if (seen.current === null) {
      seen.current = new Set(doneIds);
      return;
    }
    const fresh = doneIds.filter((id) => !seen.current!.has(id));
    if (fresh.length === 0) return;
    fresh.forEach((id) => seen.current!.add(id));
    celebrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quests]);

  const playFanfare = () => {
    try {
      audioCtx.current ??= new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioCtx.current;
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        const t = now + i * 0.09;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.34);
      });
    } catch {
      /* audio not available — silently skip */
    }
  };

  const celebrate = () => {
    setBanner(true);
    window.setTimeout(() => setBanner(false), 1800);
    playFanfare();
    burst();
  };

  const burst = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.42;
    const colors = ["#f5cf4b", "#ffe08a", "#c9a24b", "#fff4c0", "#e8b84b"];
    const parts = Array.from({ length: 60 }).map(() => {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
      const sp = 4 + Math.random() * 9;
      return {
        x: cx,
        y: cy,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        r: 3 + Math.random() * 4,
        c: colors[(Math.random() * colors.length) | 0],
        life: 1,
        rot: Math.random() * Math.PI,
      };
    });

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 16.67, 2);
      last = now;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of parts) {
        p.vy += 0.32 * dt; // gravity
        p.vx *= 0.99;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= 0.012 * dt;
        p.rot += 0.2 * dt;
        if (p.life > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.c;
          ctx.fillRect(-p.r, -p.r * 0.6, p.r * 2, p.r * 1.2); // little coin/confetti
          ctx.restore();
        }
      }
      if (alive) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  };

  return (
    <>
      <canvas ref={canvasRef} className="juice-canvas" />
      {banner && (
        <div className="juice-banner">
          <span className="juice-seal">🪙</span>
          <span>Quest Sealed!</span>
          <span className="juice-xp">+XP</span>
        </div>
      )}
    </>
  );
}
