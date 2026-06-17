import type { RealmScene, SpriteSheet } from "../types";

/**
 * THE REALM — a painterly overworld (`realm.png`) you open on, plus five flat
 * interior paintings you enter through building doors. Each scene is its own
 * local space matching its art: overworld + interiors are all 1376×768.
 *
 * Flat single paintings → no occluder/light/ground layers, no walk-behind; the
 * sprite just renders on top. The only measurements that matter are the sprite
 * frame size (210×212) and each scene's `spriteHeight` (small on the overworld,
 * large in rooms). Tune all coords / door rects by screenshot.
 */

const W = 1376;
const H = 768;

const SHEET = (src: string): SpriteSheet => ({
  src,
  frameW: 210,
  frameH: 212,
  rows: { down: 0, left: 1, right: 2, up: 3 },
  cols: 6,
  idleFrame: 0,
  walkFrames: [1, 2, 3, 4],
  workFrames: [5],
  fps: 8,
});

/** A character standing in a room (large). */
function leader(id: string, charId: string, name: string, emoji: string, accent: string, x: number, y: number, sheet: string) {
  return {
    id,
    characterId: charId,
    name,
    emoji,
    accent,
    x,
    y,
    sprite: SHEET(sheet),
    waypoints: [{ x, y }, { x: x - 70, y: y - 12 }, { x: x + 70, y: y - 8 }],
  };
}

export const SCENES: Record<string, RealmScene> = {
  // 🗺️ The overworld — default view. Everyone mills near their building; doors enter.
  realm: {
    id: "realm",
    name: "The Realm of Endeavour",
    emoji: "🗺️",
    width: W,
    height: H,
    spriteHeight: 58, // small overview figures
    layers: [{ src: "/scenes/realm.png", z: "background", parallax: 1 }],
    // Door rects + figure spots are first-pass over the painted buildings —
    // tune by screenshot. Buildings: keep=central stairs, merchants=top-left
    // tavern, ledger=top-right cathedral, hearth=bottom-left cottage,
    // scholars=bottom-right tower.
    doors: [
      { id: "d-keep", to: "keep", label: "The High Keep", x: 580, y: 130, w: 200, h: 170 },
      { id: "d-merchants", to: "merchants", label: "The Merchant's Guild", x: 190, y: 220, w: 200, h: 160 },
      { id: "d-ledger", to: "ledger", label: "The Order of the Ledger", x: 1010, y: 180, w: 240, h: 200 },
      { id: "d-hearth", to: "hearth", label: "The Hearthkeepers", x: 300, y: 560, w: 200, h: 170 },
      { id: "d-scholars", to: "scholars", label: "The Scholars' Tower", x: 1000, y: 520, w: 170, h: 210 },
    ],
    hotspots: [
      smallChar("r-elder", "elder", "Maeve the Elder", "🦉", "#7b5fa0", 690, 360, "/sprites/elder.png"),
      smallChar("r-brannock", "brannock", "Brannock Quillfeather", "🦊", "#b8860b", 300, 440, "/sprites/brannock.png"),
      smallChar("r-tasha", "tasha", "Tasha Coppernick", "🦝", "#9c6a3c", 380, 470, "/sprites/tasha.png"),
      smallChar("r-edmund", "edmund", "Magister Edmund Vell", "🦡", "#4a6d8c", 1070, 480, "/sprites/edmund.png"),
      smallChar("r-wren", "wren", "Wren Hollowmoor", "🦔", "#a85b3a", 430, 660, "/sprites/wren.png"),
      smallChar("r-lyra", "lyra", "Lyra Pageturner", "🦌", "#6b8e4e", 1000, 670, "/sprites/lyra.png"),
    ],
  },

  keep: {
    id: "keep", name: "The High Keep", emoji: "🏰", width: W, height: H, spriteHeight: 200,
    layers: [{ src: "/scenes/keep_bg.png", z: "background", parallax: 1 }],
    hotspots: [leader("hs-elder", "elder", "Maeve the Elder", "🦉", "#7b5fa0", 688, 600, "/sprites/elder.png")],
  },

  merchants: {
    id: "merchants", name: "The Merchant's Guild", emoji: "🪙", width: W, height: H, spriteHeight: 190,
    layers: [{ src: "/scenes/merchants_bg.png", z: "background", parallax: 1 }],
    hotspots: [
      leader("hs-brannock", "brannock", "Brannock Quillfeather", "🦊", "#b8860b", 560, 600, "/sprites/brannock.png"),
      leader("hs-tasha", "tasha", "Tasha Coppernick", "🦝", "#9c6a3c", 880, 620, "/sprites/tasha.png"),
    ],
  },

  ledger: {
    id: "ledger", name: "The Order of the Ledger", emoji: "⚙️", width: W, height: H, spriteHeight: 190,
    layers: [{ src: "/scenes/ledger_bg.png", z: "background", parallax: 1 }],
    hotspots: [leader("hs-edmund", "edmund", "Magister Edmund Vell", "🦡", "#4a6d8c", 688, 610, "/sprites/edmund.png")],
  },

  hearth: {
    id: "hearth", name: "The Hearthkeepers", emoji: "🛡️", width: W, height: H, spriteHeight: 190,
    layers: [{ src: "/scenes/hearth_bg.png", z: "background", parallax: 1 }],
    hotspots: [leader("hs-wren", "wren", "Wren Hollowmoor", "🦔", "#a85b3a", 660, 610, "/sprites/wren.png")],
  },

  scholars: {
    id: "scholars", name: "The Scholars' Tower", emoji: "📜", width: W, height: H, spriteHeight: 190,
    layers: [{ src: "/scenes/scholars_bg.png", z: "background", parallax: 1 }],
    hotspots: [leader("hs-lyra", "lyra", "Lyra Pageturner", "🦌", "#6b8e4e", 688, 610, "/sprites/lyra.png")],
  },
};

/** A small wandering figure on the overworld. */
function smallChar(id: string, charId: string, name: string, emoji: string, accent: string, x: number, y: number, sheet: string) {
  return {
    id,
    characterId: charId,
    name,
    emoji,
    accent,
    x,
    y,
    sprite: SHEET(sheet),
    waypoints: [{ x, y }, { x: x - 36, y: y - 6 }, { x: x + 36, y: y + 4 }],
  };
}

export const SCENE_LIST = ["realm", "keep", "merchants", "ledger", "hearth", "scholars"].map((id) => SCENES[id]);

export const STARTING_SCENE = "realm";

/** The interior scene a character lives in (prefer their room over the overworld). */
export function sceneOfCharacter(characterId: string): string | undefined {
  const inRoom = Object.values(SCENES).find((s) => s.id !== "realm" && s.hotspots.some((h) => h.characterId === characterId));
  return (inRoom ?? Object.values(SCENES).find((s) => s.hotspots.some((h) => h.characterId === characterId)))?.id;
}
