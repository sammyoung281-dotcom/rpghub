import type { CharacterId, GuildId, Risk } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// Scripted content for the mock brains. Everything characterful lives here so
// MockAgentEngine.ts stays pure logic. A Claude-backed engine will generate this
// material instead — but the SHAPE stays the same, which is the point.
// ─────────────────────────────────────────────────────────────────────────────

/** A body of work a guild leader can commission when the guild is idle. */
export interface Initiative {
  id: string;
  guildId: GuildId;
  title: string;
  /** Brief handed to the doer, ≤ 2 sentences per chunk. */
  chunks: string[];
  /** One note per tick of work. Length defines how long the task takes. */
  steps: string[];
  /** Step index at which the doer must petition the Chairman. */
  permissionAt?: number;
  permission?: { action: string; rationale: string; risk: Risk };
  /** Step index at which the work stalls on something only you can unblock. */
  blockAt?: number;
  blockReason?: string;
  /** Step index at which the doer needs another guild's help (routes via Elder). */
  needsHelpAt?: number;
  helpFrom?: CharacterId;
  helpAsk?: string;
  /** Offer it to the Chairman as an accept/decline quest rather than just doing it. */
  offerFirst?: boolean;
}

export const INITIATIVES: Initiative[] = [
  // ── 🪙 Merchant's Guild — side hustles ────────────────────────────────────
  {
    id: "ship-puzzler",
    guildId: "merchants",
    title: "Ship the little puzzle game to the store",
    chunks: [
      "My liege — a window has opened. A small game of mine could launch this very fortnight.",
      "The testing is unfinished and coin must be spent. I'll not gamble the treasury without your nod.",
    ],
    steps: [
      "Build cut taken and the store listing drafted.",
      "Screenshots and the icon set are prepared.",
      "Artificer's test pass is underway.",
      "Submitted for review — now we wait on the gatekeepers.",
    ],
    permissionAt: 1,
    permission: {
      action: "Spend £79 on the developer account and store assets",
      rationale: "Nothing ships without the account; it pays for itself on the first sale.",
      risk: "medium",
    },
    needsHelpAt: 2,
    helpFrom: "lyra",
    helpAsk: "I need the Scholars' read on store-listing keywords before we submit.",
    offerFirst: true,
  },
  {
    id: "ad-placements",
    guildId: "merchants",
    title: "Test three ad placements in the runner",
    chunks: [
      "Coin sits idle in the runner, Sovereign — the players are there, the takings are not.",
      "Let me trial three placements and keep whichever fills the coffers.",
    ],
    steps: [
      "Three placement variants wired behind a flag.",
      "Rollout at one part in ten; watching the takings.",
      "Placement the second is clearly ahead. Rolling it wide.",
    ],
  },
  {
    id: "qa-sweep",
    guildId: "merchants",
    title: "Break the build before the players do",
    chunks: [
      "I've a list of ways this thing might shatter, and I intend to try every one.",
      "Better it breaks in my workshop than in their hands.",
    ],
    steps: [
      "Crash sweep across the older devices done.",
      "Two faults found in the save system; both mended.",
      "Second pass clean. I'd sign this one off.",
    ],
  },

  // ── ⚙️ Order of the Ledger — the day job ──────────────────────────────────
  {
    id: "change-window",
    guildId: "ledger",
    title: "Approve the change-window for the ledger migration",
    chunks: [
      "Sovereign. The great migration is ready, but it must run in a quiet window — weekend hours.",
      "Procedure forbids me to proceed without your seal. Grant it, and the Order moves like clockwork.",
    ],
    steps: [
      "Change record raised and the rollback plan written.",
      "Peer review passed; approvers notified.",
      "Window booked. The Order stands ready.",
    ],
    blockAt: 1,
    blockReason: "The weekend window needs your seal before I can book it.",
    offerFirst: true,
  },
  {
    id: "incident-backlog",
    guildId: "ledger",
    title: "Clear the incident backlog to a clean ledger",
    chunks: [
      "Eleven items sit unclosed, some three weeks cold. It offends me.",
      "Give me a fortnight and the ledger will be spotless.",
    ],
    steps: [
      "Backlog triaged: four are duplicates, struck out.",
      "Five closed with proper write-ups.",
      "Two remain, both awaiting other houses. Chased.",
    ],
  },

  // ── 🛡️ Hearthkeepers — personal admin ─────────────────────────────────────
  {
    id: "overdue-tributes",
    guildId: "hearth",
    title: "Settle the quarter's overdue tributes",
    chunks: [
      "A gentle word, my liege: three household tributes have slipped past their day.",
      "Nothing dire yet — but say the word and I'll see them all settled before dusk.",
    ],
    steps: [
      "All three located and their sums confirmed.",
      "Two settled. The third wants a signature.",
      "All square. The hearth is warm again.",
    ],
    offerFirst: true,
  },
  {
    id: "renewals",
    guildId: "hearth",
    title: "Sweep the renewals before they auto-charge",
    chunks: [
      "Four contracts renew within the month and two of them you no longer use.",
      "I'll cancel what's dead and re-price the rest.",
    ],
    steps: [
      "Every renewal listed with its date and its cost.",
      "Two cancelled outright — that's coin back in your purse.",
      "The rest re-priced. Saved you a fair sum this quarter.",
    ],
  },

  // ── 📜 Scholars' Tower — self-improvement ─────────────────────────────────
  {
    id: "aso-study",
    guildId: "scholars",
    title: "Study what actually makes a listing sell",
    chunks: [
      "There's a whole craft to how a thing is found, and I've barely scratched it.",
      "Let me study it properly — the Merchants will thank us for it.",
    ],
    steps: [
      "Six sources read; the patterns are already repeating.",
      "Notes distilled into a one-page rule set.",
      "Ready to hand to the Merchant's Guild whenever they call.",
    ],
  },
  {
    id: "retention-course",
    guildId: "scholars",
    title: "Finish the course on retention analytics",
    chunks: [
      "I began this months ago and wandered off, as I do.",
      "Hold me to it and I'll have it finished — it's the most useful thing on my shelf.",
    ],
    steps: [
      "Three modules cleared in one sitting.",
      "The maths section fought back, but it's beaten.",
      "Finished. And I've a notion of how to apply it.",
    ],
  },
];

/** Voice fragments so each character's routine chatter sounds like themselves. */
export const VOICE: Record<
  CharacterId,
  { ack: string[]; report: string[]; idle: string[]; delegate: string[] }
> = {
  elder: {
    ack: ["Noted.", "The council hears you."],
    report: [
      "The realm turns. I've folded the guilds into one page for you.",
      "Little demands you today. I'd leave it be.",
    ],
    idle: ["All is quiet. I am watching."],
    delegate: [
      "Take this up. Report when it stands or when it falls.",
      "This falls to your guild. Move on it.",
    ],
  },
  brannock: {
    ack: ["Consider it in hand.", "Ha! Now we're moving."],
    report: [
      "Coin is nearly in motion — one more push and it lands.",
      "Progress, and the smell of profit on it.",
    ],
    idle: ["Idle coin is a wound, Sovereign. Give me something to chase."],
    delegate: ["Tasha — your hands, my idea. Go.", "Artificer, this one's yours."],
  },
  tasha: {
    ack: ["On it. I'll test it twice.", "Understood. Nothing ships untested."],
    report: [
      "Two faults found and mended. It's stronger than it was.",
      "Holding up under everything I throw at it so far.",
    ],
    idle: ["Bench is clear. Send me something to break."],
    delegate: [],
  },
  edmund: {
    ack: ["Logged, with an audit trail.", "Acknowledged. Procedure will be followed."],
    report: [
      "On schedule and within process. No surprises.",
      "The ledger is cleaner than it was this morning.",
    ],
    idle: ["Nothing outstanding. The Order is in good order."],
    delegate: ["This goes on the register. Handle it properly."],
  },
  wren: {
    ack: ["Already halfway done, dear.", "Leave it with me."],
    report: [
      "Quietly handled. You needn't have known.",
      "All square at the hearth. One small thing wants your name.",
    ],
    idle: ["The house is in order. Go and rest."],
    delegate: ["I'll see to it myself, it's quicker."],
  },
  lyra: {
    ack: ["Oh — yes! I'll begin at once.", "Fascinating. Starting now."],
    report: [
      "I found three things I wasn't looking for, and one I was.",
      "Nearly there. I did wander, but I've come back to it.",
    ],
    idle: ["My shelves are full and my hands are empty. Set me a question."],
    delegate: [],
  },
};

/** Deterministic pick so a tick replays identically. */
export function pick<T>(arr: T[], seed: number): T | undefined {
  if (!arr.length) return undefined;
  return arr[Math.abs(Math.floor(seed)) % arr.length];
}
