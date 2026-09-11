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

/**
 * A unit of work in the realm. Phase 2 turned this into a proper task-graph node:
 * it has an assigner, dependencies and a work log, so agents can hand work to each
 * other. `visibility` decides whether the Chairman ever sees it — "internal" work
 * (an agent's own sub-steps) stays off the Journal so it doesn't become noise.
 */
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

  // ── task-graph fields (Phase 2) ──
  /** Who handed this over. "chairman" = decreed by you. */
  assignedBy?: CharacterId | "chairman";
  /** Cannot start until these are done — this is what makes handoffs possible. */
  dependsOn?: QuestId[];
  /** Ties the whole conversation about this task together in the Dispatches log. */
  threadId?: string;
  /** "surfaced" appears in the Journal / on the scroll; "internal" is agent-only. */
  visibility?: "surfaced" | "internal";
  /** 0–100. Mock agents step it; a real agent sets it from its own judgement. */
  progress?: number;
  /** Why it's blocked (shown on the scroll when it needs you). */
  blockedReason?: string;
  /** Append-only work log — one short note per tick. */
  log?: { tick: number; by: CharacterId; note: string }[];
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

// ── Scenes: the pixel-art 2.5D world ─────────────────────────────────────────

export type Facing = "down" | "left" | "right" | "up";
export type AnimState = "idle" | "walk" | "work" | "talk" | "blocked";

/** An animated pixel sprite sheet (grid per SPRITE_SPEC.md). */
export interface SpriteSheet {
  src: string; // "/sprites/elder.png"
  frameW: number; // 48
  frameH: number; // 48
  /** Row index per facing. If `right` omitted, engine mirrors `left`. */
  rows: Partial<Record<Facing, number>>;
  cols: number;
  idleFrame: number;
  walkFrames: number[]; // looped at `fps`
  workFrames?: number[];
  fps: number; // retro frame-step feel (NOT smooth tween)
  mirrorRightFromLeft?: boolean;
}

/** A polygon zone that lifts sprites standing inside it (e.g. raised plaza). */
export interface ElevationZone {
  id: string;
  polygon: { x: number; y: number }[]; // world coords, closed
  heightOffset: number; // px to lift sprite + shadow when inside
}

/** A glow the engine can rim-tint nearby sprites with (crystal, torch). */
export interface LightSource {
  id: string;
  x: number;
  y: number;
  color: string;
  radius: number;
  flicker?: boolean;
}

/** One layer of a scene's art. Back-to-front; `ground` holds the sprites. */
export interface SceneLayer {
  src: string; // "/scenes/keep_bg.png"
  z: "background" | "ground" | "occluder" | "light";
  /** Occluders only: feet-Y above this render behind; below, in front. */
  baseline?: number;
  parallax?: number; // 1 = locked to ground; <1 = far drift
}

/** A clickable door on the overworld that enters an interior scene. */
export interface SceneDoor {
  id: string;
  to: string; // target scene id
  label: string;
  x: number; // scene-local rect (top-left)
  y: number;
  w: number;
  h: number;
}

/**
 * A clickable character standing in a scene. Lives in scene (world) coordinates;
 * the camera/parallax maths place it on screen. `marker` drives the floating
 * quest indicator + colour. `sprite` + `waypoints` drive the animated pixel
 * character (Milestone B+); without them it falls back to the emoji disc.
 */
export interface SceneHotspot {
  id: string;
  characterId: CharacterId;
  name: string;
  emoji: string; // placeholder portrait until sprite art arrives
  accent: string;
  x: number; // world coords within the scene
  y: number;
  marker?: Urgency; // shows a floating ! / status pip when set
  sprite?: SpriteSheet;
  waypoints?: { x: number; y: number }[]; // ambient wander loop (Phase-1 mock)
  baseScale?: number; // base scale before depth-scale clamp (default 1)
  initialFacing?: Facing;
  /** Nudge the name plate + quest marker (world px) to taste. Default sits above the head. */
  labelOffset?: { x: number; y: number };
}

/**
 * A named place within the one big continuous map (the Keep, a guild hall…).
 * Used for fast-travel and to lay out the placeholder buildings. `cx,cy` is the
 * region's centre on the map; `focusZoom` is how tight to frame it on travel.
 */
export interface SceneRegion {
  id: string; // "keep" or a GuildId
  guildId: GuildId | null; // null = High Keep
  name: string;
  emoji: string;
  cx: number;
  cy: number;
  focusZoom: number;
}

/**
 * The realm map. One large continuous scene the camera pans across; all spaces
 * live inside it as `regions`. `backdrop` points at painted art once supplied;
 * until then the engine renders a procedural placeholder of the same dimensions.
 */
export interface RealmScene {
  id: string;
  name: string;
  width: number; // scene is larger than the viewport → you pan around it
  height: number;
  backdrop?: string; // /scenes/xyz.png when painted (legacy single-image) art is dropped in
  /** Pixel-art layers (back-to-front, same dims, aligned). Preferred over `backdrop`. */
  layers?: SceneLayer[];
  elevationZones?: ElevationZone[];
  lights?: LightSource[];
  /** Depth-scale clamp: sprites shrink toward `min` (far/up), grow to `max` (near/down). */
  depthScale?: { min: number; max: number };
  /** Emoji shown in the Travel menu. */
  emoji?: string;
  /** Target on-screen height (scene-local px) for sprites in this scene — small on
   *  the overworld, large in interiors. Sprite scale = spriteHeight / frameH. */
  spriteHeight?: number;
  /** Clickable building doors (overworld) that enter interior scenes. */
  doors?: SceneDoor[];
  /** Legacy single-big-map region layout (unused by the per-scene pixel model). */
  regions?: SceneRegion[];
  hotspots: SceneHotspot[];
}

// ── The Ravenry: inter-agent messaging ───────────────────────────────────────
// Agents NEVER call each other directly. They post messages and the bus routes
// them along the reporting chain. That indirection buys three things: a durable,
// replayable history; no infinite mutual recursion; and a natural visual (a
// message in flight is a courier crossing the map).

export type MessageKind =
  | "request" // asking someone to take work on
  | "response" // answering a request
  | "escalation" // pushing a blocker up the chain
  | "report" // status roll-up, always upward
  | "permission" // petitioning the Chairman to authorise an action
  | "verify" // asking another agent to sign off on an action
  | "broadcast"; // guild-wide notice

/** Anyone a message can be addressed to. "chairman" is you. */
export type Recipient = CharacterId | "chairman";

export interface Message {
  id: string;
  /** Groups every message about one task/decision into a single thread. */
  threadId: string;
  tick: number;
  at: number; // wall clock, for display
  from: CharacterId;
  to: Recipient;
  kind: MessageKind;
  subject: string;
  /** ≤ 2 sentences. ADHD rule #2 applies to agent chatter too. */
  body: string;
  taskId?: QuestId;
  /** Set once the recipient has consumed it in a tick. */
  read: boolean;
  /** How many hops up the chain this has already taken (depth guard). */
  hops?: number;
}

/** A message the bus refused to deliver, kept so routing bugs are visible. */
export interface Bounce {
  id: string;
  tick: number;
  from: CharacterId;
  to: Recipient;
  subject: string;
  reason: string;
}

export type Risk = "low" | "medium" | "high";

// ── The risk matrix: who decides what ────────────────────────────────────────

/**
 * The two axes an ops risk matrix normally uses, plus the modifiers that matter
 * in this realm. Scored and routed in `src/agent/risk.ts`.
 */
export interface RiskFactors {
  /** How much it matters if this goes wrong. 1 trivial → 4 severe. */
  impact: 1 | 2 | 3 | 4;
  /** How hard it is to undo. 1 easily → 3 not at all. */
  reversibility: 1 | 2 | 3;
  /** Money committed, in £. */
  cost?: number;
  /** Visible outside — published, sent, posted. */
  external?: boolean;
}

/** Who gets to decide, once the matrix has spoken. */
export type RiskBand =
  | "routine" // the agent just does it
  | "verified" // another agent must sign off first
  | "council" // batched into a council session
  | "sovereign"; // the Chairman, personally, on its own

/**
 * An agent asking for authorisation. `route` comes from the risk matrix and
 * decides where it surfaces: "sovereign" interrupts you on the scroll,
 * "council" waits quietly on the docket until you hold a session.
 */
export interface Permission {
  id: string;
  tick: number;
  characterId: CharacterId;
  taskId?: QuestId;
  /** The concrete thing they want to do. One line. */
  action: string;
  /** Why they want to. One line. */
  rationale: string;
  risk: Risk;
  factors?: RiskFactors;
  route?: RiskBand;
  /** Plain-English reason this landed where it did — never leave routing opaque. */
  because?: string;
  status: "pending" | "approved" | "denied";
  decidedAt?: number;
}

/**
 * One agent checking another's work before it proceeds. This is what keeps
 * mid-risk actions off the Chairman's scroll entirely — the realm polices
 * itself for anything that isn't costly or irreversible.
 */
export interface Verification {
  id: string;
  tick: number;
  taskId: QuestId;
  requesterId: CharacterId;
  verifierId: CharacterId;
  /** What is being signed off. */
  action: string;
  status: "pending" | "endorsed" | "objected";
  /** The verifier's one-line verdict. */
  note?: string;
}

/** What one turn of the world clock actually did — shown after "Advance the Realm". */
export interface TickSummary {
  tick: number;
  at: number;
  messagesSent: number;
  tasksCreated: number;
  tasksCompleted: number;
  permissionsRaised: number;
  bounced: number;
  /** Short human lines describing the tick, for the log. */
  headlines: string[];
  /** Set when a guardrail stopped the tick early. */
  haltedBy?: string;
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
