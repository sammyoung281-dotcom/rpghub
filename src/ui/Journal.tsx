import { useMemo, useState } from "react";
import { useRealmStore } from "../store/useRealmStore";
import { GUILDS } from "../data/guilds";
import { getCharacter } from "../data/characters";
import { summonCharacter } from "../scene/interactions";
import { URGENCY_COLOR, URGENCY_DOT, type Quest, type Urgency } from "../types";
import "./Journal.css";

type Filter = "all" | "needs_me" | "in_progress" | "done";

/** Map a quest's status to its urgency colour-band for the Journal. */
function bandOf(q: Quest): Urgency {
  if (q.status === "not_started") return "needs_me"; // awaiting your word
  if (q.status === "blocked") return "needs_me";
  if (q.status === "in_progress") return "in_progress";
  if (q.status === "done") return "done";
  return "not_started";
}

const ORDER: Record<Urgency, number> = { needs_me: 0, in_progress: 1, not_started: 2, done: 3 };

export default function Journal() {
  const open = useRealmStore((s) => s.journalOpen);
  const setOpen = useRealmStore((s) => s.setJournalOpen);
  const proposals = useRealmStore((s) => s.proposals);
  const quests = useRealmStore((s) => s.quests);
  const completeQuest = useRealmStore((s) => s.completeQuest);
  const [filter, setFilter] = useState<Filter>("all");

  // proposals (awaiting decision) + accepted quests = every open loop
  const all = useMemo(() => [...proposals, ...quests], [proposals, quests]);

  const counts = useMemo(() => {
    const c = { needs_me: 0, in_progress: 0, done: 0 };
    for (const q of all) {
      const b = bandOf(q);
      if (b === "needs_me") c.needs_me++;
      else if (b === "in_progress") c.in_progress++;
      else if (b === "done") c.done++;
    }
    return c;
  }, [all]);

  const visible = useMemo(() => {
    const filtered = all.filter((q) => filter === "all" || bandOf(q) === filter);
    return filtered.sort((a, b) => ORDER[bandOf(a)] - ORDER[bandOf(b)] || b.createdAt - a.createdAt);
  }, [all, filter]);

  if (!open) return null;

  return (
    <div className="jrn-backdrop" onClick={() => setOpen(false)}>
      <div className="jrn-book" onClick={(e) => e.stopPropagation()}>
        <div className="jrn-spine" />
        <header className="jrn-head">
          <h2>The Journal</h2>
          <button className="jrn-close" onClick={() => setOpen(false)} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="jrn-filters">
          {(
            [
              ["all", `All (${all.length})`],
              ["needs_me", `🟥 Needs me (${counts.needs_me})`],
              ["in_progress", `🟨 In progress (${counts.in_progress})`],
              ["done", `🟩 Sealed (${counts.done})`],
            ] as [Filter, string][]
          ).map(([f, label]) => (
            <button
              key={f}
              className={"jrn-chip" + (filter === f ? " on" : "")}
              onClick={() => setFilter(f)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="jrn-list">
          {visible.length === 0 && (
            <p className="jrn-empty">No quests here. The realm rests. 🟩</p>
          )}
          {visible.map((q) => {
            const band = bandOf(q);
            const owner = getCharacter(q.ownerId);
            const guild = GUILDS[q.guildId];
            const awaiting = q.status === "not_started";
            return (
              <div key={q.id} className={"jrn-entry band-" + band} style={{ borderLeftColor: URGENCY_COLOR[band] }}>
                {q.status === "done" && <span className="jrn-seal">SEALED</span>}
                <div className="jrn-entry-top">
                  <span className="jrn-pip">{URGENCY_DOT[band]}</span>
                  <span className="jrn-title">{q.title}</span>
                </div>
                <div className="jrn-meta">
                  {guild?.emoji} {guild?.name} · {owner?.portrait} {owner?.name}
                  {awaiting && <em> · awaiting your word</em>}
                </div>
                <div className="jrn-actions">
                  {awaiting && (
                    <button
                      className="jrn-btn attend"
                      onClick={() => {
                        setOpen(false);
                        summonCharacter(q.ownerId);
                      }}
                    >
                      Attend ▸
                    </button>
                  )}
                  {q.status === "in_progress" && (
                    <button className="jrn-btn seal" onClick={() => completeQuest(q.id)}>
                      Seal as done ✓
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
