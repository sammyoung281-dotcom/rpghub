import type {
  Authority,
  Character,
  CharacterId,
  GuildId,
  Message,
  MessageKind,
  Permission,
  Quest,
  QuestId,
  Recipient,
  Risk,
} from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// THE AGENT SEAM.
//
// The single boundary between the game and the "brain" of each character.
//
// Phase 2 shape: an agent does not mutate anything. It is handed a context
// (who it is, what's in its inbox, what work it owns) and returns a list of
// INTENTS. The orchestrator validates them against the routing rules and the
// authority model, then applies them to the store.
//
// Actions-as-data is the whole trick:
//   • the mock engine and a Claude-backed engine stay perfectly interchangeable
//   • every tick is replayable and diffable
//   • guardrails (budgets, dedupe, depth caps) live in ONE place, not in each brain
//   • a misbehaving agent can be refused rather than having already done damage
//
// Phase 3 swaps in ClaudeAgentEngine implementing this same interface, where
// step() is a real API call with tool use. Nothing else in the app changes.
// ─────────────────────────────────────────────────────────────────────────────

/** Everything an agent is allowed to know when deciding what to do this tick. */
export interface AgentContext {
  character: Character;
  tick: number;
  /** Unread messages addressed to this character. */
  inbox: Message[];
  /** Tasks this character owns. */
  tasks: Quest[];
  /** If they lead a guild: every task in it. Empty for workers. */
  guildTasks: Quest[];
  /**
   * Offers already sitting with the Chairman for this guild. A leader MUST see
   * these or they re-offer the same quest every tick forever (they can't see
   * their own outbox otherwise).
   */
  guildProposals: Quest[];
  /** Who they may delegate to (their direct reports). */
  subordinates: CharacterId[];
  /** Live authority level (the Council dial overrides the data-file default). */
  authority: Authority;
  /**
   * Every permission this character has raised, decided or not. It must include
   * DECIDED ones: an agent that only sees its pending asks will re-ask the
   * instant you grant something, forever.
   */
  permissions: Permission[];
  now: number;
}

// ── Actions ──────────────────────────────────────────────────────────────────

export interface SendAction {
  t: "send";
  to: Recipient;
  kind: MessageKind;
  subject: string;
  /** ≤ 2 sentences. */
  body: string;
  taskId?: QuestId;
  threadId?: string;
}

export interface TaskCreateAction {
  t: "task.create";
  title: string;
  /** Chunked brief, ≤ 2 sentences each. */
  chunks: string[];
  guildId: GuildId;
  assignTo: CharacterId;
  dependsOn?: QuestId[];
  /** "internal" keeps it off the Journal; "surfaced" puts it in front of you. */
  visibility?: "surfaced" | "internal";
  threadId?: string;
}

export interface TaskProgressAction {
  t: "task.progress";
  taskId: QuestId;
  note: string;
  /** 0–100. */
  progress?: number;
}

export interface TaskBlockAction {
  t: "task.block";
  taskId: QuestId;
  reason: string;
}

export interface TaskCompleteAction {
  t: "task.complete";
  taskId: QuestId;
  note: string;
}

/** Put a task in front of the Chairman as an accept/decline proposal. */
export interface TaskOfferAction {
  t: "task.offer";
  title: string;
  chunks: string[];
  guildId: GuildId;
  ownerId: CharacterId;
  threadId?: string;
}

export interface PermissionAction {
  t: "permission";
  action: string;
  rationale: string;
  risk: Risk;
  taskId?: QuestId;
}

/** Walk somewhere in the scene. Purely cosmetic; the world layer consumes it. */
export interface MoveAction {
  t: "move";
  to: { x: number; y: number };
}

export type AgentAction =
  | SendAction
  | TaskCreateAction
  | TaskProgressAction
  | TaskBlockAction
  | TaskCompleteAction
  | TaskOfferAction
  | PermissionAction
  | MoveAction;

// ── Reporting ────────────────────────────────────────────────────────────────

export type ReportScope = "realm" | GuildId;

/** A chunked, skimmable report (Elder = realm scope, leaders = their guild). */
export interface Report {
  scope: ReportScope;
  title: string;
  tally: { needsMe: number; inProgress: number; done: number };
  chunks: string[];
}

/** The slice of world state a reporter is allowed to summarise. */
export interface RealmSnapshot {
  tick: number;
  quests: Quest[];
  proposals: Quest[];
  permissions: Permission[];
  messages: Message[];
}

export interface AgentEngine {
  /**
   * One unit of thought for one character. Returns intents, never side effects.
   * Async because Phase 3 makes this a network call.
   */
  step(ctx: AgentContext): Promise<AgentAction[]>;

  /** A roll-up for the given scope, computed from real state. */
  report(scope: ReportScope, snapshot: RealmSnapshot): Report;
}
