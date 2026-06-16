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
    regions: [
      { id: "keep", guildId: null, name: "The High Keep", emoji: "🏰", cx: 2400, cy: 850, focusZoom: 0.85 },
      { id: "merchants", guildId: "merchants", name: "The Merchant's Guild", emoji: "🪙", cx: 1150, cy: 1700, focusZoom: 1.0 },
      { id: "ledger", guildId: "ledger", name: "The Order of the Ledger", emoji: "⚙️", cx: 3650, cy: 1700, focusZoom: 1.0 },
      { id: "hearth", guildId: "hearth", name: "The Hearthkeepers", emoji: "🛡️", cx: 1500, cy: 2450, focusZoom: 1.0 },
      { id: "scholars", guildId: "scholars", name: "The Scholars' Tower", emoji: "📜", cx: 3300, cy: 2450, focusZoom: 1.0 },
    ],
    hotspots: [
      { id: "hs-elder", characterId: "elder", name: "Maeve the Elder", emoji: "🦉", accent: "#7b5fa0", x: 2400, y: 1080 },
      { id: "hs-brannock", characterId: "brannock", name: "Brannock Quillfeather", emoji: "🦊", accent: "#b8860b", x: 1010, y: 1880 },
      { id: "hs-tasha", characterId: "tasha", name: "Tasha Coppernick", emoji: "🦝", accent: "#b8860b", x: 1300, y: 1930 },
      { id: "hs-edmund", characterId: "edmund", name: "Magister Edmund Vell", emoji: "🦡", accent: "#4a6d8c", x: 3650, y: 1880 },
      { id: "hs-wren", characterId: "wren", name: "Wren Hollowmoor", emoji: "🦔", accent: "#a85b3a", x: 1500, y: 2630 },
      { id: "hs-lyra", characterId: "lyra", name: "Lyra Pageturner", emoji: "🦌", accent: "#6b8e4e", x: 3300, y: 2630 },
    ],
  },
};

export const STARTING_SCENE = "realm";
