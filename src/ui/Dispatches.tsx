import { useMemo, useState } from "react";
import { useRealmStore } from "../store/useRealmStore";
import { getCharacter } from "../data/characters";
import type { Message, MessageKind } from "../types";
import "./Dispatches.css";

const KIND_ICON: Record<MessageKind, string> = {
  request: "📨",
  response: "↩",
  escalation: "⚠",
  report: "📜",
  permission: "🔑",
  verify: "🔍",
  broadcast: "📢",
};

const nameOf = (id: string) => (id === "chairman" ? "The Chairman" : getCharacter(id)?.name ?? id);
const faceOf = (id: string) => (id === "chairman" ? "👑" : getCharacter(id)?.portrait ?? "❓");

type Filter = "all" | "mine" | "between";

/**
 * The Ravenry log — every word that passed between agents. This is the debug
 * view AND the flavour: you can read exactly why the realm did what it did,
 * which is the whole reason messages go through a bus instead of direct calls.
 */
export default function Dispatches() {
  const open = useRealmStore((s) => s.dispatchesOpen);
  const setOpen = useRealmStore((s) => s.setDispatchesOpen);
  const messages = useRealmStore((s) => s.messages);
  const bounces = useRealmStore((s) => s.bounces);
  const tickLog = useRealmStore((s) => s.tickLog);
  const [filter, setFilter] = useState<Filter>("all");

  const shown = useMemo(() => {
    const list = [...messages].reverse();
    if (filter === "mine") return list.filter((m) => m.to === "chairman");
    if (filter === "between") return list.filter((m) => m.to !== "chairman");
    return list;
  }, [messages, filter]);

  if (!open) return null;

  const last = tickLog[0];

  return (
    <div className="dsp-backdrop" onClick={() => setOpen(false)}>
      <div className="dsp-panel" onClick={(e) => e.stopPropagation()}>
        <header className="dsp-head">
          <h2>🕊 Dispatches</h2>
          <button className="dsp-close" onClick={() => setOpen(false)} aria-label="Close">
            ✕
          </button>
        </header>

        {last && (
          <div className="dsp-lasttick">
            <strong>Turn {last.tick}</strong> — {last.messagesSent} sent · {last.tasksCreated} begun ·{" "}
            {last.tasksCompleted} sealed · {last.permissionsRaised} awaiting you
            {last.bounced > 0 && ` · ${last.bounced} rerouted`}
            {last.haltedBy && <span className="dsp-halt"> · halted: {last.haltedBy}</span>}
          </div>
        )}

        <div className="dsp-filters">
          {(["all", "mine", "between"] as Filter[]).map((f) => (
            <button
              key={f}
              className={"dsp-filter" + (filter === f ? " on" : "")}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Everything" : f === "mine" ? "To me" : "Between them"}
            </button>
          ))}
        </div>

        <div className="dsp-list">
          {shown.length === 0 && (
            <p className="dsp-empty">
              No word has passed yet. Press <strong>Advance the Realm</strong> and they'll start
              talking.
            </p>
          )}
          {shown.map((m) => (
            <Line key={m.id} m={m} />
          ))}
        </div>

        {bounces.length > 0 && (
          <details className="dsp-bounces">
            <summary>↩ {bounces.length} rerouted by the chain of command</summary>
            {[...bounces].reverse().map((b) => (
              <div key={b.id} className="dsp-bounce">
                <span className="dsp-bounce-route">
                  {nameOf(b.from)} → {nameOf(b.to)}
                </span>
                <span className="dsp-bounce-why">{b.reason}</span>
              </div>
            ))}
          </details>
        )}
      </div>
    </div>
  );
}

function Line({ m }: { m: Message }) {
  return (
    <div className={"dsp-msg k-" + m.kind + (m.to === "chairman" ? " to-crown" : "")}>
      <span className="dsp-kind" title={m.kind}>
        {KIND_ICON[m.kind]}
      </span>
      <div className="dsp-body">
        <div className="dsp-route">
          <span className="dsp-face">{faceOf(m.from)}</span>
          {nameOf(m.from)} <span className="dsp-arrow">→</span>
          <span className="dsp-face">{faceOf(m.to)}</span>
          {nameOf(m.to)}
          <span className="dsp-tick">turn {m.tick}</span>
        </div>
        <div className="dsp-subject">{m.subject}</div>
        <div className="dsp-text">{m.body}</div>
      </div>
    </div>
  );
}
