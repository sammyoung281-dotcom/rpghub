// ─────────────────────────────────────────────────────────────────────────────
// Core domain types for The Realm of Endeavour.
// Everything content-related (guilds, characters, quests) is data-driven off
// these types so adding a guild/character means editing data, not code.
// ─────────────────────────────────────────────────────────────────────────────

export type GuildId = string;
export type CharacterId = string;
export type QuestId = string;

/** Colour-coded urgency — the ADHD traffic-light system used everywhere. */
export type Urgency =
  | "needs_me" // 🟥 needs me now
  | "in_progress" // 🟨 working
  | "done" // 🟩 done / idle
  | "not_started"; // ⬜ not started

export const URGENCY_COLOR: Record<Urgency, string> = {
  needs_me: "#c0392b", // 🟥
  in_progress: "#d6a52b", // 🟨
  done: "#4f8a3d", // 🟩
  not_started: "#9a9a9a", // ⬜
};

export const URGENCY_DOT: Record<Urgency, string> = {
  needs_me: "🟥",
  in_progress: "🟨",
  done: "🟩",
  not_started: "⬜",
};

/** Authority a character is trusted with. Real data now; enforced in Phase 2. */
export enum Authority {
  Petitioner = 1, // asks before every action
  Trusted = 2, // acts on routine, asks on big/risky
  Steward = 3, // acts freely in domain, reports after
}

export type CharacterStatus = "idle" | "working" | "blocked" | "reporting";

export interface Guild {
  id: GuildId;
  name: string;
  emoji: string;
  /** Real-world domain this guild owns. */
  domain: string;
  leaderId: CharacterId;
  /** Accent colour for this guild's chrome. */
  accent: string;
}

export interface Character {
  id: CharacterId;
  name: string;
  title: string;
  /** Emoji portrait for now; swap for a portrait texture later. */
  portrait: string;
  guildId: GuildId | null; // null = High Council (the Elder)
  /** null = reports to the Chairman directly (the Elder). */
  reportsTo: CharacterId | null;
  role: string; // real-life domain they own
  personality: string;
  authority: Authority;
  status: CharacterStatus;
}

export type QuestStatus = "not_started" | "in_progress" | "blocked" | "done";

export interface Quest {
  id: QuestId;
  title: string;
  /** Short chunks, each ≤ 2 sentences. Never a wall of text. */
  chunks: string[];
  guildId: GuildId;
  ownerId: CharacterId;
  status: QuestStatus;
  createdAt: number;
  sealedAt?: number; // when completed (drives the wax SEAL)
}

// ── Dialogue: the reusable parchment box backbone ────────────────────────────

export type ChoiceTone = "accept" | "decline" | "neutral";

export interface DialogueChoice {
  id: string;
  label: string;
  tone?: ChoiceTone;
}

export interface Dialogue {
  id: string;
  speakerName: string;
  speakerTitle?: string;
  portrait: string; // emoji for now
  accent?: string; // guild accent colour
  /** Chunked body — shown one chunk at a time with "Continue ▸". */
  chunks: string[];
  /** Big choice buttons shown after the final chunk. */
  choices: DialogueChoice[];
  /** Called with the chosen choice id when the user decides. */
  onResolve?: (choiceId: string) => void;
}

// ── Needs You Now: the persistent proclamation scroll ────────────────────────

export interface NeedItem {
  id: string;
  title: string;
  /** One short line of context. */
  detail: string;
  ownerId: CharacterId;
  guildId: GuildId | null;
  /** Higher = more urgent; the top one is what the scroll shows big. */
  priority: number;
  /** What happens when the Chairman acts on it. */
  onAct: () => void;
}
