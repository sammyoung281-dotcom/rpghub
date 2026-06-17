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
  /** Legacy single-big-map region layout (unused by the per-scene pixel model). */
  regions?: SceneRegion[];
  hotspots: SceneHotspot[];
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
