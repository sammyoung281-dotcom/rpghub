import type { RealmScene, SpriteSheet } from "../types";

/**
 * THE REALM — now a set of per-place pixel scenes you travel between (Travel
 * button / fast-travel). Each scene is its OWN local 480×270 pixel-art space
 * (matching the PNGs in /public/scenes); all coords here — hotspot x/y, occluder
 * baseline, light x/y, elevation polygons, waypoints — are in 0..480 / 0..270.
 * Data-driven: a new place = add a scene here + drop its layer PNGs.
 */

const SHEET = (src: string): SpriteSheet => ({
  src,
  frameW: 48,
  frameH: 48,
  rows: { down: 0, left: 1, right: 2, up: 3 },
  cols: 6,
  idleFrame: 0,
  walkFrames: [1, 2, 3, 4],
  workFrames: [5],
  fps: 8,
});

export const SCENES: Record<string, RealmScene> = {
  // 🏰 The High Keep — throne hub. Leader: Maeve the Elder (owl).
  keep: {
    id: "keep",
    name: "The High Keep",
    emoji: "🏰",
    width: 480,
    height: 270,
    layers: [
      { src: "/scenes/keep_bg.png", z: "background", parallax: 0.95 },
      { src: "/scenes/keep_ground.png", z: "ground", parallax: 1 },
      { src: "/scenes/keep_occ_canopy.png", z: "occluder", baseline: 118 },
      { src: "/scenes/keep_occ_plaza.png", z: "occluder", baseline: 210 },
      { src: "/scenes/keep_light.png", z: "light" },
    ],
    elevationZones: [
      { id: "throne-plaza", polygon: [{ x: 160, y: 150 }, { x: 320, y: 150 }, { x: 330, y: 214 }, { x: 150, y: 214 }], heightOffset: 8 },
    ],
    lights: [
      { id: "rune-staff", x: 240, y: 182, color: "#56f0e6", radius: 55, flicker: true },
      { id: "sconce-l", x: 180, y: 150, color: "#ffd27a", radius: 40, flicker: true },
      { id: "sconce-r", x: 300, y: 150, color: "#ffd27a", radius: 40, flicker: true },
    ],
    depthScale: { min: 0.9, max: 1.08 },
    hotspots: [
      {
        id: "hs-elder",
        characterId: "elder",
        name: "Maeve the Elder",
        emoji: "🦉",
        accent: "#7b5fa0",
        x: 240,
        y: 200,
        sprite: SHEET("/sprites/elder.png"),
        waypoints: [{ x: 240, y: 200 }, { x: 205, y: 194 }, { x: 275, y: 194 }],
      },
    ],
  },

  // 🪙 The Merchant's Guild — warm market hall. Brannock (fox) + Tasha (raccoon).
  merchants: {
    id: "merchants",
    name: "The Merchant's Guild",
    emoji: "🪙",
    width: 480,
    height: 270,
    layers: [
      { src: "/scenes/merchants_bg.png", z: "background", parallax: 1 },
      { src: "/scenes/merchants_ground.png", z: "ground", parallax: 1 },
      { src: "/scenes/merchants_occ.png", z: "occluder", baseline: 210 },
      { src: "/scenes/merchants_light.png", z: "light" },
    ],
    lights: [
      { id: "lantern-l", x: 160, y: 36, color: "#ffd27a", radius: 26, flicker: true },
      { id: "lantern-c", x: 250, y: 36, color: "#ffd27a", radius: 26, flicker: true },
      { id: "lantern-r", x: 340, y: 36, color: "#ffd27a", radius: 26, flicker: true },
    ],
    depthScale: { min: 0.9, max: 1.08 },
    hotspots: [
      {
        id: "hs-brannock",
        characterId: "brannock",
        name: "Brannock Quillfeather",
        emoji: "🦊",
        accent: "#b8860b",
        x: 215,
        y: 190,
        sprite: SHEET("/sprites/brannock.png"),
        waypoints: [{ x: 215, y: 190 }, { x: 175, y: 196 }, { x: 250, y: 192 }],
      },
      {
        id: "hs-tasha",
        characterId: "tasha",
        name: "Tasha Coppernick",
        emoji: "🦝",
        accent: "#9c6a3c",
        x: 320,
        y: 196,
        sprite: SHEET("/sprites/tasha.png"),
        waypoints: [{ x: 320, y: 196 }, { x: 350, y: 190 }, { x: 300, y: 198 }],
      },
    ],
  },

  // ⚙️ Order of the Ledger — cold records hall. Leader: Edmund (badger).
  ledger: {
    id: "ledger",
    name: "The Order of the Ledger",
    emoji: "⚙️",
    width: 480,
    height: 270,
    layers: [
      { src: "/scenes/ledger_bg.png", z: "background", parallax: 1 },
      { src: "/scenes/ledger_ground.png", z: "ground", parallax: 1 },
      { src: "/scenes/ledger_occ.png", z: "occluder", baseline: 208 },
      { src: "/scenes/ledger_light.png", z: "light" },
    ],
    lights: [
      { id: "window", x: 240, y: 70, color: "#405a92", radius: 46 },
      { id: "candle", x: 260, y: 200, color: "#ffd27a", radius: 16, flicker: true },
    ],
    depthScale: { min: 0.9, max: 1.06 },
    hotspots: [
      {
        id: "hs-edmund",
        characterId: "edmund",
        name: "Magister Edmund Vell",
        emoji: "🦡",
        accent: "#4a6d8c",
        x: 240,
        y: 190,
        sprite: SHEET("/sprites/edmund.png"),
        waypoints: [{ x: 240, y: 190 }, { x: 200, y: 196 }, { x: 285, y: 194 }],
      },
    ],
  },

  // 🛡️ The Hearthkeepers — cosy cottage. Leader: Wren (hedgehog).
  hearth: {
    id: "hearth",
    name: "The Hearthkeepers",
    emoji: "🛡️",
    width: 480,
    height: 270,
    layers: [
      { src: "/scenes/hearth_bg.png", z: "background", parallax: 1 },
      { src: "/scenes/hearth_ground.png", z: "ground", parallax: 1 },
      { src: "/scenes/hearth_occ.png", z: "occluder", baseline: 212 },
      { src: "/scenes/hearth_light.png", z: "light" },
    ],
    lights: [
      { id: "hearth-fire", x: 396, y: 128, color: "#ff9d4d", radius: 60, flicker: true },
      { id: "window", x: 242, y: 60, color: "#405a92", radius: 30 },
    ],
    depthScale: { min: 0.9, max: 1.08 },
    hotspots: [
      {
        id: "hs-wren",
        characterId: "wren",
        name: "Wren Hollowmoor",
        emoji: "🦔",
        accent: "#a85b3a",
        x: 210,
        y: 190,
        sprite: SHEET("/sprites/wren.png"),
        waypoints: [{ x: 210, y: 190 }, { x: 165, y: 196 }, { x: 355, y: 196 }],
      },
    ],
  },

  // 📜 The Scholars' Tower — arcane study. Leader: Lyra (deer).
  scholars: {
    id: "scholars",
    name: "The Scholars' Tower",
    emoji: "📜",
    width: 480,
    height: 270,
    layers: [
      { src: "/scenes/scholars_bg.png", z: "background", parallax: 1 },
      { src: "/scenes/scholars_ground.png", z: "ground", parallax: 1 },
      { src: "/scenes/scholars_occ.png", z: "occluder", baseline: 214 },
      { src: "/scenes/scholars_light.png", z: "light" },
    ],
    lights: [
      { id: "glyph", x: 240, y: 190, color: "#56f0e6", radius: 60, flicker: true },
      { id: "tome", x: 388, y: 188, color: "#56f0e6", radius: 14, flicker: true },
    ],
    depthScale: { min: 0.9, max: 1.06 },
    hotspots: [
      {
        id: "hs-lyra",
        characterId: "lyra",
        name: "Lyra Pageturner",
        emoji: "🦌",
        accent: "#6b8e4e",
        x: 240,
        y: 192,
        sprite: SHEET("/sprites/lyra.png"),
        waypoints: [{ x: 240, y: 192 }, { x: 200, y: 198 }, { x: 280, y: 196 }],
      },
    ],
  },
};

/** Travel order. */
export const SCENE_LIST = ["keep", "merchants", "ledger", "hearth", "scholars"].map((id) => SCENES[id]);

export const STARTING_SCENE = "keep";

/** Which scene a character lives in (for fast-travel + summon). */
export function sceneOfCharacter(characterId: string): string | undefined {
  return Object.values(SCENES).find((s) => s.hotspots.some((h) => h.characterId === characterId))?.id;
}
