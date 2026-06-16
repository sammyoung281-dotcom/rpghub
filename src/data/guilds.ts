import type { Guild, GuildId } from "../types";

/**
 * The lower councils — one per area of the Chairman's life. Data-driven: add a
 * guild here (+ its leader in characters.ts, + a scene in scenes.ts) and it
 * joins the realm with no engine changes.
 */
export const GUILDS: Record<GuildId, Guild> = {
  merchants: {
    id: "merchants",
    name: "The Merchant's Guild",
    emoji: "🪙",
    domain: "Side hustles — building, launching & refining apps and games",
    leaderId: "brannock",
    accent: "#b8860b",
  },
  ledger: {
    id: "ledger",
    name: "The Order of the Ledger",
    emoji: "⚙️",
    domain: "The day job — change & ops at the fintech",
    leaderId: "edmund",
    accent: "#4a6d8c",
  },
  hearth: {
    id: "hearth",
    name: "The Hearthkeepers",
    emoji: "🛡️",
    domain: "Personal admin & life tasks",
    leaderId: "wren",
    accent: "#a85b3a",
  },
  scholars: {
    id: "scholars",
    name: "The Scholars' Tower",
    emoji: "📜",
    domain: "Self-improvement & learning",
    leaderId: "lyra",
    accent: "#6b8e4e",
  },
};

export const GUILD_LIST = Object.values(GUILDS);
