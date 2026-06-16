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
