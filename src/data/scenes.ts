import type { RealmScene } from "../types";

/**
 * THE REALM — one big continuous map. All connected spaces live inside it as
 * `regions`; the camera pans/fast-travels between them. Data-driven: move a
 * region or character by editing coordinates here, no engine changes.
 *
 * `backdrop` is left undefined → the engine paints a procedural placeholder
 * (grass, faked-iso buildings/platforms, paths). Drop a painted PNG into
 * /public/scenes and set `backdrop` to swap the whole map for real art.
 *
 * Coordinate space: 0,0 = top-left; characters/buildings positioned in map px.
 */
export const SCENES: Record<string, RealmScene> = {
  realm: {
    id: "realm",
    name: "The Realm of Endeavour",
    width: 4800,
    height: 3000,
    // backdrop: "/scenes/realm.png",  // ← drop the painted map here later
    // ── depth (Milestone C) — tune via screenshots ──
    depthScale: { min: 0.9, max: 1.12 },
    elevationZones: [
      // the High Keep forecourt — characters here stand "raised" on the plaza
      {
        id: "keep-plaza",
        polygon: [
          { x: 2230, y: 1010 }, { x: 2570, y: 1010 },
          { x: 2600, y: 1150 }, { x: 2200, y: 1150 },
        ],
        heightOffset: 30,
      },
    ],
    lights: [
      { id: "keep-crystal", x: 2400, y: 1010, color: "#56f0e6", radius: 320, flicker: true },
      { id: "merchant-lantern", x: 1150, y: 1700, color: "#ffd27a", radius: 240, flicker: true },
    ],
    regions: [
      { id: "keep", guildId: null, name: "The High Keep", emoji: "🏰", cx: 2400, cy: 850, focusZoom: 0.85 },
      { id: "merchants", guildId: "merchants", name: "The Merchant's Guild", emoji: "🪙", cx: 1150, cy: 1700, focusZoom: 1.0 },
      { id: "ledger", guildId: "ledger", name: "The Order of the Ledger", emoji: "⚙️", cx: 3650, cy: 1700, focusZoom: 1.0 },
      { id: "hearth", guildId: "hearth", name: "The Hearthkeepers", emoji: "🛡️", cx: 1500, cy: 2450, focusZoom: 1.0 },
      { id: "scholars", guildId: "scholars", name: "The Scholars' Tower", emoji: "📜", cx: 3300, cy: 2450, focusZoom: 1.0 },
    ],
    hotspots: [
      // `waypoints` = ambient wander loop (Phase-1 mock "doing their job"). Add a
      // `sprite: { src: "/sprites/<id>.png", ... }` field once real art is dropped;
      // until then each renders a procedural placeholder sprite.
      { id: "hs-elder", characterId: "elder", name: "Maeve the Elder", emoji: "🦉", accent: "#7b5fa0", x: 2400, y: 1080,
        waypoints: [{ x: 2400, y: 1080 }, { x: 2300, y: 1050 }, { x: 2500, y: 1050 }] },
      { id: "hs-brannock", characterId: "brannock", name: "Brannock Quillfeather", emoji: "🦊", accent: "#b8860b", x: 1010, y: 1880,
        waypoints: [{ x: 1010, y: 1880 }, { x: 1120, y: 1900 }, { x: 980, y: 1820 }] },
      // Tasha paces vertically through the demo tree at (1300,1905) → walks
      // behind it on the way up, in front on the way down (depth-sort demo).
      { id: "hs-tasha", characterId: "tasha", name: "Tasha Coppernick", emoji: "🦝", accent: "#b8860b", x: 1300, y: 1960,
        waypoints: [{ x: 1300, y: 1830 }, { x: 1300, y: 1980 }] },
      { id: "hs-edmund", characterId: "edmund", name: "Magister Edmund Vell", emoji: "🦡", accent: "#4a6d8c", x: 3650, y: 1880,
        waypoints: [{ x: 3650, y: 1880 }, { x: 3560, y: 1900 }, { x: 3720, y: 1840 }] },
      { id: "hs-wren", characterId: "wren", name: "Wren Hollowmoor", emoji: "🦔", accent: "#a85b3a", x: 1500, y: 2630,
        waypoints: [{ x: 1500, y: 2630 }, { x: 1420, y: 2600 }, { x: 1580, y: 2600 }] },
      { id: "hs-lyra", characterId: "lyra", name: "Lyra Pageturner", emoji: "🦌", accent: "#6b8e4e", x: 3300, y: 2630,
        waypoints: [{ x: 3300, y: 2630 }, { x: 3380, y: 2590 }, { x: 3240, y: 2600 }] },
    ],
  },
};

export const STARTING_SCENE = "realm";
