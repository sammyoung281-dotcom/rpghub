import { useEffect, useState } from "react";
import { useRealmStore } from "../store/useRealmStore";
import { runTick, syncAutoTick } from "../agent/orchestrator";
import "./TickControl.css";

/**
 * The world clock, in your hands. Nothing in the realm moves unless you press
 * this or explicitly switch on the timer — ADHD rule #8 (forgiving) and the
 * cost guardrail rolled into one control. The pause is a real kill switch.
 */
export default function TickControl() {
  const tick = useRealmStore((s) => s.tick);
  const advancing = useRealmStore((s) => s.advancing);
  const autoTick = useRealmStore((s) => s.autoTick);
  const setAutoTick = useRealmStore((s) => s.setAutoTick);
  const minutes = useRealmStore((s) => s.autoTickMinutes);
  const setMinutes = useRealmStore((s) => s.setAutoTickMinutes);
  const paused = useRealmStore((s) => s.paused);
  const setPaused = useRealmStore((s) => s.setPaused);
  const tickLog = useRealmStore((s) => s.tickLog);
  const setDispatchesOpen = useRealmStore((s) => s.setDispatchesOpen);

  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    syncAutoTick();
  }, [autoTick, paused, minutes]);

  const last = tickLog[0];

  const go = async () => {
    const summary = await runTick();
    if (!summary) return;
    setFlash(
      summary.headlines[0] ??
        `Turn ${summary.tick}: ${summary.messagesSent} ravens, ${summary.tasksCompleted} sealed.`
    );
    window.setTimeout(() => setFlash(null), 4000);
  };

  return (
    <div className={"tick-bar" + (paused ? " paused" : "")}>
      <button className="tick-go" onClick={go} disabled={advancing || paused} title="Advance the realm one turn">
        {advancing ? "⏳ The realm stirs…" : "⏵ Advance the Realm"}
      </button>

      <div className="tick-meta">
        <span className="tick-count">Turn {tick}</span>
        {last && (
          <button className="tick-last" onClick={() => setDispatchesOpen(true)} title="Open Dispatches">
            ✉ {last.messagesSent} · 🟩 {last.tasksCompleted} · 🔑 {last.permissionsRaised}
          </button>
        )}
      </div>

      <label className="tick-auto" title="Let the realm advance on its own">
        <input type="checkbox" checked={autoTick} onChange={(e) => setAutoTick(e.target.checked)} />
        <span>Auto</span>
        <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} disabled={!autoTick}>
          <option value={5}>5m</option>
          <option value={15}>15m</option>
          <option value={60}>1h</option>
        </select>
      </label>

      <button
        className={"tick-pause" + (paused ? " on" : "")}
        onClick={() => setPaused(!paused)}
        title={paused ? "The realm is frozen" : "Freeze everything"}
      >
        {paused ? "⏸ Frozen" : "⏸"}
      </button>

      {flash && <div className="tick-flash">{flash}</div>}
    </div>
  );
}
