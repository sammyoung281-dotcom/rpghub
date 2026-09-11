import type { CharacterId, GuildId, RiskFactors } from "../types";

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
  /**
   * Step index at which this action must be authorised. The agent states the
   * FACTS (`factors`); the risk matrix decides whether that means a peer
   * signs off, the council settles it, or the Chairman rules personally.
   */
  permissionAt?: number;
  permission?: { action: string; rationale: string; factors: RiskFactors };
  /** Step index at which the work stalls on something only you can unblock. */
  blockAt?: number;
  blockReason?: string;
  /** Step index at which the doer needs another guild's help (routes via Elder). */
  needsHelpAt?: number;
  helpFrom?: CharacterId;
  helpAsk?: string;
  /** Offer it to the Chairman as an accept/decline quest rather than just doing it. */
  offerFirst?: boolean;
  /**
   * Title of an earlier initiative in the same guild that must finish first.
   * Makes the task graph real: the leader links `dependsOn` when commissioning,
   * and the orchestrator won't let the doer touch it until the dependency seals.
   * The referenced initiative must appear EARLIER in this array.
   */
  dependsOnTitle?: string;
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
    // £79 out of the treasury → over the sovereign threshold → Sam rules on it.
    permissionAt: 1,
    permission: {
      action: "Spend £79 on the developer account and store assets",
      rationale: "Nothing ships without the account; it pays for itself on the first sale.",
      factors: { impact: 3, reversibility: 2, cost: 79, external: true },
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
    // Reversible and cheap → a peer signs off, Sam never sees it.
    permissionAt: 1,
    permission: {
      action: "Widen the rollout from a tenth of players to all of them",
      rationale: "The takings are clearly up and I can roll it back in a moment.",
      factors: { impact: 2, reversibility: 2 },
    },
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
    // Significant but undoable → peer sign-off, not a Chairman interruption.
    permissionAt: 2,
    permission: {
      action: "Declare the build fit to ship",
      rationale: "It survived everything I threw at it, but I'd rather not be the only one who says so.",
      factors: { impact: 3, reversibility: 2 },
    },
  },

  {
    id: "review-replies",
    guildId: "merchants",
    title: "Answer every review left this fortnight",
    chunks: [
      "Nineteen reviews sit unanswered, and four of them are furious.",
      "A reply costs nothing and turns a one-star into a three.",
    ],
    steps: [
      "All nineteen read and sorted by heat.",
      "The four angry ones answered first, and gently.",
      "The rest cleared. Two have already softened their verdict.",
    ],
  },
  {
    id: "loading-time",
    guildId: "merchants",
    title: "Halve the time before a player sees the game",
    chunks: [
      "They wait eleven seconds at the door. A good third never come in.",
      "Give me leave to strip it back and I'll have them playing in five.",
    ],
    steps: [
      "Measured properly — eleven seconds, and most of it is art loading.",
      "Textures compressed and the opening scene trimmed.",
      "Down to four. The door no longer turns people away.",
    ],
    dependsOnTitle: "Break the build before the players do",
  },
  {
    id: "price-test",
    guildId: "merchants",
    title: "Raise the price and see what breaks",
    chunks: [
      "We are the cheapest thing on the shelf and it makes us look worthless.",
      "Let me try a higher price on a slice of new players and count the difference.",
    ],
    steps: [
      "Price test wired to a tenth of new arrivals.",
      "Takings per player are up a fifth; installs barely moved.",
      "The higher price holds. That's found money.",
    ],
    permissionAt: 1,
    permission: {
      action: "Set the higher price for everyone, not just the test slice",
      rationale: "The numbers hold up and I can put it back in an hour if they don't.",
      factors: { impact: 3, reversibility: 2 },
    },
  },
  {
    id: "mailing-list",
    guildId: "merchants",
    title: "Gather a hundred souls to the mailing list",
    chunks: [
      "Every launch so far has begun by shouting into an empty room.",
      "Build the list now and the next one begins with an audience.",
    ],
    steps: [
      "Sign-up placed where players finish a level, not where they arrive.",
      "Forty in the first week, all of them genuine.",
      "Past a hundred. The next launch starts with a crowd.",
    ],
    needsHelpAt: 1,
    helpFrom: "lyra",
    helpAsk: "The Scholars know what makes people hand over an address — I'd borrow that.",
  },
  {
    id: "chase-payout",
    guildId: "merchants",
    title: "Chase the takings that never arrived",
    chunks: [
      "The store's ledger and ours disagree by a fair sum, and the store is winning.",
      "I'd rather find the fault than shrug at it.",
    ],
    steps: [
      "Both ledgers laid side by side. The gap is real.",
      "Found it — a currency conversion counted twice.",
      "Raised with the store. They've conceded and will settle.",
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
    // A live migration cannot be un-run → irreversible → always the Chairman.
    permissionAt: 1,
    permission: {
      action: "Run the ledger migration in the weekend window",
      rationale: "Once it starts there is no un-running it, and it takes your weekend hours.",
      factors: { impact: 4, reversibility: 3 },
    },
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
    // Weighty but undoable → the council settles it in session.
    permissionAt: 1,
    permission: {
      action: "Close five incidents with formal write-ups against your name",
      rationale: "Procedure says the record carries your authority, not mine.",
      factors: { impact: 4, reversibility: 2 },
    },
  },

  {
    id: "runbook",
    guildId: "ledger",
    title: "Rewrite the runbook nobody can follow",
    chunks: [
      "The runbook assumes you already know the answer, which rather defeats it.",
      "At three in the morning that is not a document, it is a riddle.",
    ],
    steps: [
      "Walked it start to finish as though I knew nothing. It failed at step four.",
      "Rewritten so a stranger could follow it, with the decision points called out.",
      "Two colleagues tested it cold. Both got through without asking me.",
    ],
  },
  {
    id: "failed-payments",
    guildId: "ledger",
    title: "Trace where the failed payments go",
    chunks: [
      "A small number fail every day and nobody can say what becomes of them.",
      "Small numbers compound. I intend to know.",
    ],
    steps: [
      "Followed thirty of them end to end.",
      "Most retry cleanly. A handful sit in a queue nobody watches.",
      "Queue now has an owner and an alarm. It will not rot again.",
    ],
  },
  {
    id: "control-review",
    guildId: "ledger",
    title: "Sit the quarterly control review",
    chunks: [
      "The review comes whether we are ready or not. I prefer ready.",
      "Give me a week and there will be nothing for them to find.",
    ],
    steps: [
      "Evidence gathered for every control in scope.",
      "Two gaps found by my own hand, and closed before anyone asked.",
      "Reviewed clean. No findings.",
    ],
    dependsOnTitle: "Rewrite the runbook nobody can follow",
  },
  {
    id: "retire-manual-recon",
    guildId: "ledger",
    title: "Retire the reconciliation done by hand",
    chunks: [
      "Someone spends two hours every morning doing what a machine should.",
      "Those hours are worth more than the machine costs.",
    ],
    steps: [
      "Mapped exactly what the hands do, including the undocumented bits.",
      "Automated the matching; exceptions still come to a human.",
      "Two hours a day returned to the team.",
    ],
    permissionAt: 2,
    permission: {
      action: "Switch off the manual process for good",
      rationale: "It has run clean in parallel for a fortnight, but once the habit dies it won't come back.",
      factors: { impact: 3, reversibility: 3 },
    },
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
    // Small coin, but coin is coin → the council settles it, not you.
    permissionAt: 1,
    permission: {
      action: "Pay £12 in early-exit fees to kill two dead contracts",
      rationale: "Twelve now saves ninety over the year.",
      factors: { impact: 2, reversibility: 2, cost: 12 },
    },
  },

  {
    id: "postponed-appointments",
    guildId: "hearth",
    title: "Book the appointments you keep postponing",
    chunks: [
      "Three of these have been 'next week' since the spring, dear.",
      "I'll book them. You need only turn up.",
    ],
    steps: [
      "All three chased down and their diaries opened.",
      "Two booked. The third wants you to pick a day.",
      "All three in the calendar, with warnings the week before.",
    ],
  },
  {
    id: "where-coin-goes",
    guildId: "hearth",
    title: "Find where the monthly coin actually goes",
    chunks: [
      "You earn well and you keep less than you should. Both can be true.",
      "Let me lay a full month out where you can see it.",
    ],
    steps: [
      "A full month sorted and categorised, nothing rounded away.",
      "Three habits account for most of the leak. None of them are the ones you'd guess.",
      "Laid out on one page. Yours to do with as you like — I'll not lecture.",
    ],
  },
  {
    id: "year-paperwork",
    guildId: "hearth",
    title: "Put the paperwork in order before the year turns",
    chunks: [
      "The side hustles have made this a real matter now, not a formality.",
      "Better done in the quiet than in a panic come the deadline.",
    ],
    steps: [
      "Every receipt and statement gathered into one place.",
      "Income from the guild's ventures separated and totted up.",
      "Filed and folded. Nothing left to dread.",
    ],
    dependsOnTitle: "Find where the monthly coin actually goes",
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
  {
    id: "day-seven",
    guildId: "scholars",
    title: "Learn what brings a player back on day seven",
    chunks: [
      "Everyone measures the first day. Almost nobody understands the seventh.",
      "That is where the money hides, and I mean to go and look.",
    ],
    steps: [
      "Read every study I could find on early retention.",
      "The pattern is boringly consistent: it's the second session that decides it.",
      "Written up as five rules the Merchants can actually apply.",
    ],
    dependsOnTitle: "Finish the course on retention analytics",
  },
  {
    id: "screenshot-craft",
    guildId: "scholars",
    title: "Study the craft of the store screenshot",
    chunks: [
      "The first screenshot does more work than the whole description beneath it.",
      "There are rules to it, and I don't know them yet.",
    ],
    steps: [
      "Pulled apart the top forty listings in our category.",
      "The good ones all do the same three things in the first image.",
      "Rules written down and ready to hand over.",
    ],
    needsHelpAt: 2,
    helpFrom: "brannock",
    helpAsk: "The Merchants should have these rules before their next listing goes up.",
  },
  {
    id: "three-books",
    guildId: "scholars",
    title: "Read three books and keep only what matters",
    chunks: [
      "I begin far more books than I finish, which you already know.",
      "Three, properly read, with one page of notes each. Hold me to it.",
    ],
    steps: [
      "First one finished. One page of notes, no more.",
      "Second done — half of it was padding and I said so.",
      "Third finished. Three pages that were worth the whole shelf.",
    ],
  },
  {
    id: "ship-something-weekly",
    guildId: "scholars",
    title: "Learn to ship something small every week",
    chunks: [
      "The habit matters more than any single thing you make.",
      "Small and finished beats grand and abandoned, every time.",
    ],
    steps: [
      "Picked four small things, each finishable in an evening.",
      "Two shipped. Neither was perfect and both were fine.",
      "Four for four. The habit is taking.",
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
