import { useMemo } from "react";
import { useRealmStore } from "../store/useRealmStore";
import { getCharacter } from "../data/characters";
import { summonCharacter } from "../scene/interactions";
import "./NeedsYouNow.css";

interface Need {
  ownerId: string;
  title: string;
  detail: string;
}

/**
 * The royal proclamation scroll. ALWAYS visible (ADHD rule #1).
 * Shows the single most urgent thing waiting on the Chairman — one action, big.
 * Needs are DERIVED from quest state: pending proposals + blocked quests. No
 * separate stored list to keep in sync (and nothing unserialisable to persist).
 */
export default function NeedsYouNow() {
  const proposals = useRealmStore((s) => s.proposals);
  const quests = useRealmStore((s) => s.quests);

  const needs = useMemo<Need[]>(() => {
    const fromProposals = proposals.map((p) => {
      const c = getCharacter(p.ownerId);
      return { ownerId: p.ownerId, title: p.title, detail: `${c?.portrait ?? ""} ${c?.name ?? p.ownerId} awaits your decision` };
    });
    const fromBlocked = quests
      .filter((q) => q.status === "blocked")
      .map((q) => {
        const c = getCharacter(q.ownerId);
        return { ownerId: q.ownerId, title: q.title, detail: `${c?.portrait ?? ""} ${c?.name ?? q.ownerId} is blocked, awaiting you` };
      });
    return [...fromProposals, ...fromBlocked];
  }, [proposals, quests]);

  const top = needs[0] ?? null;
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
          <button className="nyn-act" onClick={() => summonCharacter(top.ownerId)}>
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

      {extra > 0 && <div className="nyn-more">+{extra} more await your word</div>}
    </div>
  );
}
