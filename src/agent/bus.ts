import { CHARACTERS, getCharacter } from "../data/characters";
import { GUILDS } from "../data/guilds";
import type { CharacterId, MessageKind, Recipient } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// THE RAVENRY — routing rules for inter-agent messages.
//
// The org chart in characters.ts (`reportsTo`) is not decoration: it is a HARD
// routing constraint. Unconstrained peer-to-peer agent chatter is the classic
// multi-agent failure mode — agents ping-pong politely, burn budget and produce
// nothing. The hierarchy is both the rate limiter and the thing that makes
// "why did the realm do that?" answerable.
//
// Rules:
//   • up      — you may always write to whoever you report to.
//   • down    — you may always write to your direct reports.
//   • sideways— peers in the SAME guild may write to each other directly.
//   • across  — cross-guild is REFUSED. Route it via the Elder.
//   • crown   — only the Elder reports to the Chairman… except `permission`,
//               which anyone may petition with (it's the authority escape hatch).
// ─────────────────────────────────────────────────────────────────────────────

export const CHAIRMAN: Recipient = "chairman";

/** The Elder is the only character with no one above them. */
export const ELDER_ID: CharacterId = "elder";

export interface RouteVerdict {
  ok: boolean;
  /** Why it was refused — surfaced as a Bounce so routing bugs stay visible. */
  reason?: string;
  /** Where it should have gone instead. The orchestrator can auto-redirect. */
  redirectTo?: Recipient;
}

const directReportsOf = (id: CharacterId): CharacterId[] =>
  Object.values(CHARACTERS)
    .filter((c) => c.reportsTo === id)
    .map((c) => c.id);

/** Is this character the leader of their guild? */
export const isGuildLeader = (id: CharacterId): boolean =>
  Object.values(GUILDS).some((g) => g.leaderId === id);

export const isElder = (id: CharacterId): boolean => id === ELDER_ID;

/** Everyone who is neither the Elder nor a guild leader — the rank and file. */
export const isWorker = (id: CharacterId): boolean => !isElder(id) && !isGuildLeader(id);

/**
 * Can `fromId` send this kind of message to `to`? Pure function, no state —
 * so it is trivially testable and the same rules apply to the mock engine and
 * the real Claude engine.
 */
export function canSend(fromId: CharacterId, to: Recipient, kind: MessageKind): RouteVerdict {
  const from = getCharacter(fromId);
  if (!from) return { ok: false, reason: `Unknown sender "${fromId}".` };

  // ── to the Chairman ──
  if (to === CHAIRMAN) {
    if (kind === "permission") return { ok: true }; // anyone may petition
    if (isElder(fromId)) return { ok: true }; // the Elder is your one voice
    return {
      ok: false,
      reason: "Only the Elder addresses the Chairman directly. Escalate through your chain.",
      redirectTo: from.reportsTo ?? ELDER_ID,
    };
  }

  if (fromId === to) return { ok: false, reason: "A character may not write to themselves." };

  const target = getCharacter(to);
  if (!target) return { ok: false, reason: `Unknown recipient "${to}".` };

  // ── up the chain ──
  if (from.reportsTo === to) return { ok: true };

  // ── down the chain ──
  if (target.reportsTo === fromId) return { ok: true };

  // ── sideways within a guild ──
  if (from.guildId && from.guildId === target.guildId) return { ok: true };

  // ── the Elder may speak to anyone (they are the cross-guild switchboard) ──
  if (isElder(fromId)) return { ok: true };

  // ── everything else is cross-guild: refuse, and say where it should go ──
  return {
    ok: false,
    reason: `Cross-guild word must pass through the Elder (${from.guildId ?? "—"} → ${target.guildId ?? "—"}).`,
    redirectTo: ELDER_ID,
  };
}

/** Who a character escalates to. The Elder escalates to the Chairman. */
export function escalationTarget(fromId: CharacterId): Recipient {
  const from = getCharacter(fromId);
  if (!from) return CHAIRMAN;
  return from.reportsTo ?? CHAIRMAN;
}

/** Guild members, leader first. Used by leaders deciding who to delegate to. */
export function guildRoster(guildId: string): CharacterId[] {
  const guild = GUILDS[guildId];
  const members = Object.values(CHARACTERS)
    .filter((c) => c.guildId === guildId)
    .map((c) => c.id);
  if (!guild) return members;
  return [guild.leaderId, ...members.filter((id) => id !== guild.leaderId)];
}

/** A leader's delegable subordinates (their direct reports inside the guild). */
export function subordinatesOf(id: CharacterId): CharacterId[] {
  return directReportsOf(id);
}
