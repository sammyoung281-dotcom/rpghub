import type { Character, Dialogue, GuildId, Quest, QuestStatus } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// THE AGENT SEAM.
//
// This is the single boundary between the game and the "brain" of each agent.
// Phase 1 ships MockAgentEngine (scripted data). Phase 2 will ship a
// ClaudeAgentEngine that implements this SAME interface with real API calls and
// tool use — nothing else in the app should need to change. Keep this contract
// stable and obvious.
// ─────────────────────────────────────────────────────────────────────────────

/** Result of a character doing a tick of work on a quest. */
export interface WorkTick {
  status: QuestStatus;
  /** A short, chunked note on what happened (≤ 2 sentences each). */
  notes: string[];
}

export type ReportScope = "realm" | GuildId;

/** A chunked, skimmable report (Elder = realm scope, leaders = their guild). */
export interface Report {
  scope: ReportScope;
  title: string;
  /** Roll-up counts for the colour-coded summary. */
  tally: { needsMe: number; inProgress: number; done: number };
  chunks: string[];
}

export interface AgentEngine {
  /** A quest this character wants to undertake right now (or null if idle). */
  proposeQuest(character: Character): Quest | null;
  /** A clarifying question framed as a dialogue, or null if none. */
  askQuestion(character: Character, quest: Quest): Dialogue | null;
  /** Advance a quest by one unit of work; returns the new status + notes. */
  doWork(character: Character, quest: Quest): WorkTick;
  /** A roll-up report for the given scope. */
  report(scope: ReportScope): Report;
}
