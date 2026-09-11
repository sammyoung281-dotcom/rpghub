import { useMemo } from "react";
import { useRealmStore } from "../store/useRealmStore";
import { getCharacter } from "../data/characters";
import { summonCharacter } from "../scene/interactions";
import "./NeedsYouNow.css";

interface Need {
  ownerId: string | null;
  title: string;
  detail: string;
  /** Higher wins the big slot. */
  priority: number;
  /** Inline decision buttons — one click, no travel. */
  yes?: { label: string; run: () => void };
  no?: { label: string; run: () => void };
  /** Replaces the yes/no pair when the action is "go and look". */
  go?: { label: string; run: () => void };
}

/**
 * The royal proclamation scroll. ALWAYS visible (ADHD rule #1).
 *
 * Only shows what the RISK MATRIX says is genuinely yours: money, irreversible
 * things, and quests you've been offered. Mid-risk actions are settled between
 * agents, and council-band decisions wait quietly on the docket as ONE line
 * rather than four separate nags.
 *
 * Decisions are made in place (ADHD rule #7: ≤ 2 clicks). "Attend" still exists
 * for when you want to go and hear them out.
 */
export default function NeedsYouNow() {
  const proposals = useRealmStore((s) => s.proposals);
  const quests = useRealmStore((s) => s.quests);
  const permissions = useRealmStore((s) => s.permissions);

  const needs = useMemo<Need[]>(() => {
    const s = useRealmStore.getState();
    const out: Need[] = [];

    // ── the Chairman's own calls: money and things that can't be undone ──
    for (const p of s.sovereignDecisions()) {
      const c = getCharacter(p.characterId);
      out.push({
        ownerId: p.characterId,
        title: p.action,
        detail: `${c?.portrait ?? ""} ${c?.name ?? p.characterId} — ${p.because ?? p.rationale}`,
        priority: p.factors?.reversibility === 3 ? 40 : 30,
        yes: { label: "Grant", run: () => s.decidePermission(p.id, true) },
        no: { label: "Refuse", run: () => s.decidePermission(p.id, false) },
      });
    }

    // ── you are the blocker ──
    for (const q of quests.filter((q) => q.status === "blocked")) {
      const c = getCharacter(q.ownerId);
      out.push({
        ownerId: q.ownerId,
        title: q.title,
        detail: q.blockedReason ?? `${c?.portrait ?? ""} ${c?.name ?? q.ownerId} is blocked, awaiting you`,
        priority: 20,
        yes: {
          label: "Cleared",
          run: () => s.noteProgress(q.id, q.ownerId, "The Chairman cleared the way."),
        },
        go: { label: "Attend ▸", run: () => summonCharacter(q.ownerId) },
      });
    }

    // ── a quest you've been offered ──
    for (const p of proposals) {
      const c = getCharacter(p.ownerId);
      out.push({
        ownerId: p.ownerId,
        title: p.title,
        detail: `${c?.portrait ?? ""} ${c?.name ?? p.ownerId} awaits your decision`,
        priority: 10,
        yes: { label: "Accept", run: () => s.acceptProposal(p.id) },
        no: { label: "Decline", run: () => s.declineProposal(p.id) },
      });
    }

    // ── the council's backlog: ONE line, never a queue of nags ──
    const docket = s.councilDocket();
    if (docket.length) {
      out.push({
        ownerId: null,
        title: `${docket.length} matter${docket.length === 1 ? "" : "s"} for the council`,
        detail: "Nothing urgent — settle them together whenever it suits.",
        priority: 5,
        go: { label: "Hold council ▸", run: () => s.setCouncilOpen(true) },
      });
    }

    return out.sort((a, b) => b.priority - a.priority);
  }, [proposals, quests, permissions]);

  const setDecreeOpen = useRealmStore((s) => s.setDecreeOpen);

  const top = needs[0] ?? null;
  const extra = needs.length - 1;
  const calm = !top || top.priority <= 5;
  /** Nothing waiting AND nothing being worked on — the realm has run dry. */
  const idle = !top && !quests.some((q) => q.status === "in_progress");

  return (
    <div className={"nyn-scroll" + (top ? " active" : "") + (calm ? " quiet" : "")}>
      <div className="nyn-ribbon">⚑ Needs You Now</div>

      {top ? (
        <div className="nyn-content">
          <div className="nyn-text">
            <div className="nyn-title">
              {top.priority >= 30 ? "🟥" : top.priority >= 10 ? "🟨" : "⬜"} {top.title}
            </div>
            <div className="nyn-detail">{top.detail}</div>
          </div>
          <div className="nyn-actions">
            {top.yes && (
              <button className="nyn-act" onClick={top.yes.run}>
                {top.yes.label}
              </button>
            )}
            {top.no && (
              <button className="nyn-act nyn-no" onClick={top.no.run}>
                {top.no.label}
              </button>
            )}
            {top.go && (
              <button className={"nyn-act" + (top.yes ? " nyn-secondary" : "")} onClick={top.go.run}>
                {top.go.label}
              </button>
            )}
            {top.yes && top.ownerId && (
              <button
                className="nyn-attend"
                onClick={() => summonCharacter(top.ownerId as string)}
                title="Go and hear them out first"
              >
                Attend ▸
              </button>
            )}
          </div>
        </div>
      ) : idle ? (
        // Out of work entirely. Say so and hand over the quill — a silent idle
        // realm reads as broken, which is exactly how it felt the first time.
        <div className="nyn-content">
          <div className="nyn-text">
            <div className="nyn-title">⬜ The realm awaits your word</div>
            <div className="nyn-detail">Every labour is sealed. Set them something and they'll move.</div>
          </div>
          <div className="nyn-actions">
            <button className="nyn-act nyn-secondary" onClick={() => setDecreeOpen(true)}>
              🪶 Decree a task
            </button>
          </div>
        </div>
      ) : (
        <div className="nyn-content nyn-calm">
          <div className="nyn-text">
            <div className="nyn-title">🟩 The realm is calm</div>
            <div className="nyn-detail">The guilds are at work. Nothing needs you.</div>
          </div>
        </div>
      )}

      {extra > 0 && <div className="nyn-more">+{extra} more await your word</div>}
    </div>
  );
}
