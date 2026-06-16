import { useRealmStore } from "../store/useRealmStore";
import "./NeedsYouNow.css";

/**
 * The royal proclamation scroll. ALWAYS visible (ADHD rule #1).
 * Shows the single most urgent thing waiting on the Chairman — one action, big.
 * If more are queued, a small tally hints at the backlog without cluttering.
 */
export default function NeedsYouNow() {
  const needs = useRealmStore((s) => s.needs);
  const top = useRealmStore((s) => s.topNeed)();

  const extra = needs.length - 1;

  return (
    <div className={"nyn-scroll" + (top ? " active" : "")}>
      <div className="nyn-ribbon">⚑ Needs You Now</div>

      {top ? (
        <div className="nyn-content">
          <div className="nyn-text">
            <div className="nyn-title">🟥 {top.title}</div>
            <div className="nyn-detail">{top.detail}</div>
          </div>
          <button className="nyn-act" onClick={top.onAct}>
            Attend ▸
          </button>
        </div>
      ) : (
        <div className="nyn-content nyn-calm">
          <div className="nyn-text">
            <div className="nyn-title">🟩 The realm is calm</div>
            <div className="nyn-detail">Nothing demands the Sovereign right now.</div>
          </div>
        </div>
      )}

      {extra > 0 && (
        <div className="nyn-more">+{extra} more await your word</div>
      )}
    </div>
  );
}
