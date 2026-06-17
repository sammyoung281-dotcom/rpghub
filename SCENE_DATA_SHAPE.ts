// ─────────────────────────────────────────────────────────────────────────────
// SCENE_DATA_SHAPE.ts — PROPOSAL / REFERENCE, not a live file.
//
// Target data model for the pixel-art depth upgrade. It EXTENDS the existing
// types in src/types.ts (SceneHotspot, SceneRegion, RealmScene) — do not fork a
// parallel model. Fold these fields into types.ts, then populate scenes.ts.
// Everything stays data-driven: a new sprite or scene = drop a PNG + edit data.
//
// Heed the build-journal warning: multi-layer parallax with mismatched layer
// sizes causes edge artifacts at zoom-out. Keep all layers of one scene the
// SAME pixel dimensions and aligned; let them bleed past the map and fade dark.
// ─────────────────────────────────────────────────────────────────────────────

import type { CharacterId, Urgency } from "./src/types";

// ── Sprite sheets ────────────────────────────────────────────────────────────
// Drives the animated pixel character. Grid + frame order defined in SPRITE_SPEC.md.

export type Facing = "down" | "left" | "right" | "up";
export type AnimState = "idle" | "walk" | "work" | "talk" | "blocked";

export interface SpriteSheet {
  src: string;            // "/sprites/elder.png"
  frameW: number;         // 48
  frameH: number;         // 48
  /** Row index per facing. If `right` omitted, engine mirrors `left`. */
  rows: Partial<Record<Facing, number>>; // { down:0, left:1, right:2, up:3 }
  cols: number;           // 6
  idleFrame: number;      // 0
  walkFrames: number[];   // [1,2,3,4]  → looped at `fps`
  workFrames?: number[];  // [5] ambient "working" accent (optional)
  fps: number;            // 8  → retro frame-step feel (NOT smooth)
  mirrorRightFromLeft?: boolean; // true if sheet has no dedicated right row
}

// ── Depth & elevation (the "3D" illusion) ────────────────────────────────────

/** A polygon zone that raises sprites standing inside it (e.g. the stone plaza). */
export interface ElevationZone {
  id: string;
  /** World-coord polygon (closed). Point-in-polygon test on the sprite's feet. */
  polygon: { x: number; y: number }[];
  /** Pixels to lift the sprite's draw position (and its shadow) when inside. */
  heightOffset: number;   // e.g. 24 for the raised plaza
}

/** A glowing light the engine can tint nearby sprites with (crystals, torches). */
export interface LightSource {
  id: string;
  x: number; y: number;   // world coords
  color: string;          // "#56f0e6" crystal / "#ffd27a" torch
  radius: number;         // px falloff for the rim-tint
  flicker?: boolean;      // subtle animated intensity (torches)
}

/** Layered art for a scene. z-order from back to front; ground holds the sprites. */
export interface SceneLayer {
  src: string;            // "/scenes/keep_bg.png"
  z: "background" | "ground" | "occluder" | "light";
  /**
   * For occluders only: the world-Y baseline. Sprites whose feet-Y is ABOVE
   * (smaller than) this render behind the occluder; below it, in front.
   */
  baseline?: number;
  parallax?: number;      // 1 = locked to ground; <1 = drifts slower (far bg)
}

// ── Extensions to the existing interfaces ────────────────────────────────────

/** ADD these optional fields to SceneHotspot in src/types.ts. */
export interface SceneHotspotPixelExt {
  sprite?: SpriteSheet;
  /** Ambient wander loop (Phase-1 mock). Engine tweens position; sheet animates. */
  waypoints?: { x: number; y: number }[];
  /** Base scale before depth-scaling clamp (default 1). */
  baseScale?: number;
  initialFacing?: Facing;
  marker?: Urgency;       // already exists — kept here for completeness
  characterId: CharacterId;
}

/** ADD these optional fields to RealmScene / per-region scenes in src/types.ts. */
export interface ScenePixelExt {
  /** Replaces single `backdrop`. Back-to-front; all SAME dimensions + aligned. */
  layers?: SceneLayer[];
  elevationZones?: ElevationZone[];
  lights?: LightSource[];
  /** Depth-scale clamp: sprites shrink toward `min` at the top, grow to `max`. */
  depthScale?: { min: number; max: number }; // e.g. { min: 0.85, max: 1.1 }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONCRETE EXAMPLE — the High Keep region, fully populated as a build target.
// Coordinates reuse the existing realm map space (see src/data/scenes.ts:
// keep is centred ~2400,850). Tune all numbers via the screenshot feedback loop.
// ─────────────────────────────────────────────────────────────────────────────

export const KEEP_SCENE_EXAMPLE = {
  id: "keep",
  name: "The High Keep",

  layers: [
    { src: "/scenes/keep_bg.png",        z: "background", parallax: 0.9 },
    { src: "/scenes/keep_ground.png",    z: "ground",     parallax: 1.0 },
    { src: "/scenes/keep_occ_canopy.png", z: "occluder",  baseline: 700 },  // tree tops — sprites pass behind above y=700
    { src: "/scenes/keep_occ_plaza.png",  z: "occluder",  baseline: 1180 }, // plaza front edge
    { src: "/scenes/keep_light.png",     z: "light" },                      // additive light shafts
  ] satisfies SceneLayer[],

  elevationZones: [
    {
      id: "throne-plaza",
      // the raised stone platform the Elder stands on
      polygon: [
        { x: 2250, y: 980 }, { x: 2560, y: 980 },
        { x: 2600, y: 1140 }, { x: 2210, y: 1140 },
      ],
      heightOffset: 24,
    },
  ] satisfies ElevationZone[],

  lights: [
    { id: "rune-staff", x: 2400, y: 1040, color: "#56f0e6", radius: 90, flicker: true },
    { id: "sconce-l",   x: 2230, y: 1010, color: "#ffd27a", radius: 70, flicker: true },
    { id: "sconce-r",   x: 2575, y: 1010, color: "#ffd27a", radius: 70, flicker: true },
  ] satisfies LightSource[],

  depthScale: { min: 0.88, max: 1.08 },

  hotspots: [
    {
      characterId: "elder",
      name: "Maeve the Elder",
      emoji: "🦉",
      accent: "#7b5fa0",
      x: 2400, y: 1080,
      marker: "needs_me" as Urgency,
      initialFacing: "down" as Facing,
      baseScale: 1,
      sprite: {
        src: "/sprites/elder.png",
        frameW: 48, frameH: 48,
        rows: { down: 0, left: 1, right: 2, up: 3 },
        cols: 6,
        idleFrame: 0,
        walkFrames: [1, 2, 3, 4],
        workFrames: [5],
        fps: 8,
      } satisfies SpriteSheet,
      // paces the throne plaza while "overseeing the realm"
      waypoints: [
        { x: 2400, y: 1080 }, { x: 2330, y: 1060 },
        { x: 2470, y: 1060 }, { x: 2400, y: 1080 },
      ],
    },
  ],
};

// ── Depth-sort rule (implement in the scene engine) ──────────────────────────
// 1. Collect all drawables: sprites + tagged occluder layers.
// 2. Each has an effective baseline Y = (sprite feet-Y - elevation heightOffset)
//    or the occluder's `baseline`.
// 3. Render ascending by baseline Y → lower-on-screen draws on top (in front).
// 4. Draw each sprite's contact shadow FIRST (just below its feet), then the
//    sprite, applying depth-scale (clamp) and any light-source rim tint.

// ─────────────────────────────────────────────────────────────────────────────
// COORDINATE SPACE — read this before populating scenes.ts
// ─────────────────────────────────────────────────────────────────────────────
// When a scene has `layers[]` (real pixel art), treat it as its OWN local space
// matching the art = 480 x 270. ALL of that scene's coords — hotspot x/y,
// occluder baseline, light x/y, elevation polygons, waypoints — are in this
// 0..480 / 0..270 space. The engine scales the art up to the viewport and maps
// local coords the same way; sprites are NOT in the old 4800x3000 realm-map
// space here. (The KEEP_SCENE_EXAMPLE above predates this and uses legacy
// realm-map numbers — convert it to local 480x270 like the guilds below.)
//
// Layer convention actually shipped in /public/scenes:
//   keep   → _bg, _ground, _occ_canopy (baseline ~118), _occ_plaza (~210), _light
//   guilds → _bg, _ground, _occ (single front-furniture occluder, baseline ~210), _light
// Front furniture occludes anyone standing behind it: a leader at feet-y ~190 is
// ABOVE the occluder baseline ~210, so they render BEHIND the counter/desk — i.e.
// visible above it, body hidden behind it. Tune every number by screenshot.

// ─────────────────────────────────────────────────────────────────────────────
// CONCRETE EXAMPLES — the four guild halls, in LOCAL 480x270 coords.
// Light positions below mirror the glows baked into each *_light.png so the
// sprite rim-tint lines up with the painted glow.
// ─────────────────────────────────────────────────────────────────────────────

const SHEET = (src: string): SpriteSheet => ({
  src, frameW: 48, frameH: 48,
  rows: { down: 0, left: 1, right: 2, up: 3 },
  cols: 6, idleFrame: 0, walkFrames: [1, 2, 3, 4], workFrames: [5], fps: 8,
});

export const GUILD_SCENES_EXAMPLE = {
  // 🪙 Merchant's Guild — warm market hall. Leader: Brannock (fox).
  merchants: {
    id: "merchants", name: "The Merchant's Guild",
    layers: [
      { src: "/scenes/merchants_bg.png",     z: "background", parallax: 1.0 },
      { src: "/scenes/merchants_ground.png",  z: "ground",     parallax: 1.0 },
      { src: "/scenes/merchants_occ.png",     z: "occluder",   baseline: 210 },
      { src: "/scenes/merchants_light.png",   z: "light" },
    ] satisfies SceneLayer[],
    lights: [
      { id: "lantern-l", x: 160, y: 36,  color: "#ffd27a", radius: 26, flicker: true },
      { id: "lantern-c", x: 250, y: 36,  color: "#ffd27a", radius: 26, flicker: true },
      { id: "lantern-r", x: 340, y: 36,  color: "#ffd27a", radius: 26, flicker: true },
      { id: "window-l",  x: 110, y: 70,  color: "#405a92", radius: 40 },
      { id: "window-r",  x: 370, y: 70,  color: "#405a92", radius: 40 },
    ] satisfies LightSource[],
    depthScale: { min: 0.9, max: 1.08 },
    hotspots: [{
      characterId: "brannock", name: "Brannock Quillfeather", emoji: "🦊",
      accent: "#b8860b", x: 240, y: 188, marker: "needs_me" as Urgency,
      sprite: SHEET("/sprites/brannock.png"),
      waypoints: [{ x: 240, y: 188 }, { x: 190, y: 196 }, { x: 290, y: 192 }],
    }],
  },

  // ⚙️ Order of the Ledger — cold records hall. Leader: Edmund (badger).
  ledger: {
    id: "ledger", name: "The Order of the Ledger",
    layers: [
      { src: "/scenes/ledger_bg.png",     z: "background", parallax: 1.0 },
      { src: "/scenes/ledger_ground.png",  z: "ground",     parallax: 1.0 },
      { src: "/scenes/ledger_occ.png",     z: "occluder",   baseline: 208 },
      { src: "/scenes/ledger_light.png",   z: "light" },
    ] satisfies SceneLayer[],
    lights: [
      { id: "window",  x: 240, y: 70,  color: "#405a92", radius: 46 },
      { id: "candle",  x: 260, y: 200, color: "#ffd27a", radius: 16, flicker: true },
    ] satisfies LightSource[],
    depthScale: { min: 0.9, max: 1.06 },
    hotspots: [{
      characterId: "edmund", name: "Magister Edmund Vell", emoji: "🦡",
      accent: "#4a6d8c", x: 240, y: 190, marker: "in_progress" as Urgency,
      sprite: SHEET("/sprites/edmund.png"),
      waypoints: [{ x: 240, y: 190 }, { x: 200, y: 196 }, { x: 285, y: 194 }],
    }],
  },

  // 🛡️ Hearthkeepers — cosy cottage. Leader: Wren (hedgehog).
  hearth: {
    id: "hearth", name: "The Hearthkeepers",
    layers: [
      { src: "/scenes/hearth_bg.png",     z: "background", parallax: 1.0 },
      { src: "/scenes/hearth_ground.png",  z: "ground",     parallax: 1.0 },
      { src: "/scenes/hearth_occ.png",     z: "occluder",   baseline: 212 },
      { src: "/scenes/hearth_light.png",   z: "light" },
    ] satisfies SceneLayer[],
    lights: [
      { id: "hearth-fire", x: 396, y: 128, color: "#ff9d4d", radius: 60, flicker: true },
      { id: "window",      x: 242, y: 60,  color: "#405a92", radius: 30 },
    ] satisfies LightSource[],
    depthScale: { min: 0.9, max: 1.08 },
    hotspots: [{
      characterId: "wren", name: "Wren Hollowmoor", emoji: "🦔",
      accent: "#a85b3a", x: 210, y: 190, marker: "done" as Urgency,
      sprite: SHEET("/sprites/wren.png"),
      waypoints: [{ x: 210, y: 190 }, { x: 160, y: 196 }, { x: 360, y: 196 }], // wanders to the stew pot
    }],
  },

  // 📜 Scholars' Tower — arcane study. Leader: Lyra (deer).
  scholars: {
    id: "scholars", name: "The Scholars' Tower",
    layers: [
      { src: "/scenes/scholars_bg.png",     z: "background", parallax: 1.0 },
      { src: "/scenes/scholars_ground.png",  z: "ground",     parallax: 1.0 },
      { src: "/scenes/scholars_occ.png",     z: "occluder",   baseline: 214 },
      { src: "/scenes/scholars_light.png",   z: "light" },
    ] satisfies SceneLayer[],
    lights: [
      { id: "glyph",  x: 240, y: 190, color: "#56f0e6", radius: 60, flicker: true },
      { id: "candle", x: 300, y: 200, color: "#ffd27a", radius: 16, flicker: true },
      { id: "tome",   x: 388, y: 188, color: "#56f0e6", radius: 14, flicker: true },
    ] satisfies LightSource[],
    depthScale: { min: 0.9, max: 1.06 },
    hotspots: [{
      characterId: "lyra", name: "Lyra Pageturner", emoji: "🦌",
      accent: "#6b8e4e", x: 240, y: 192, marker: "not_started" as Urgency,
      sprite: SHEET("/sprites/lyra.png"),
      waypoints: [{ x: 240, y: 192 }, { x: 200, y: 198 }, { x: 280, y: 196 }],
    }],
  },
};
