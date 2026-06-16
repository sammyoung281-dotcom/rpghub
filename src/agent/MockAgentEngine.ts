import type { AgentEngine, Report, ReportScope, WorkTick } from "./AgentEngine";
import type { Character, Dialogue, Quest } from "../types";

/**
 * Phase 1 brain: hand-scripted, deterministic. No AI, no network. Swapped wholesale
 * for a ClaudeAgentEngine in Phase 2 behind the identical AgentEngine interface.
 */

let questSeq = 0;
const newQuestId = () => `q-${Date.now().toString(36)}-${questSeq++}`;

/** Scripted opening quests, keyed by characterId. */
const SCRIPTED_QUESTS: Record<string, Omit<Quest, "id" | "createdAt" | "status">> = {
  brannock: {
    title: "Launch the little game this fortnight",
    guildId: "merchants",
    ownerId: "brannock",
    chunks: [
      "My liege — a window has opened. A small game of mine could launch this very fortnight.",
      "But the testing is unfinished, and coin must be spent on it. I'll not gamble the treasury without your nod.",
    ],
  },
};

export class MockAgentEngine implements AgentEngine {
  proposeQuest(character: Character): Quest | null {
    const tmpl = SCRIPTED_QUESTS[character.id];
    if (!tmpl) return null;
    return { ...tmpl, id: newQuestId(), status: "not_started", createdAt: Date.now() };
  }

  askQuestion(_character: Character, _quest: Quest): Dialogue | null {
    // Seam stub — Phase 2 returns real clarifying questions here.
    return null;
  }

  doWork(_character: Character, quest: Quest): WorkTick {
    // Seam stub — Phase 2 actually advances the work. For now, "doing work"
    // simply nudges a not-started quest into progress.
    if (quest.status === "not_started") {
      return { status: "in_progress", notes: ["The work is underway."] };
    }
    return { status: quest.status, notes: [] };
  }

  report(scope: ReportScope): Report {
    if (scope === "realm") {
      return {
        scope,
        title: "State of the Realm",
        tally: { needsMe: 1, inProgress: 2, done: 0 },
        chunks: [
          "Sovereign. The realm turns steadily — two labours advance, one awaits your word.",
          "The Merchant's Guild is blocked on you: a launch hangs on your decision.",
        ],
      };
    }
    // a generic guild report
    return {
      scope,
      title: "Guild Report",
      tally: { needsMe: 0, inProgress: 1, done: 0 },
      chunks: ["Work proceeds. Nothing yet demands your attention here."],
    };
  }
}
