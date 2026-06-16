import type { RealmScene } from "../types";

/**
 * Data-driven scene definitions. Add a place to the realm by adding an entry
 * here — no engine changes needed. `backdrop` is left undefined for now so the
 * engine paints a procedural atmospheric placeholder; drop a PNG into
 * /public/scenes and set `backdrop: "/scenes/high-glade.png"` to swap in real art.
 *
 * Coordinate space: 0,0 = top-left of the scene; the camera pans within it.
 */
export const SCENES: Record<string, RealmScene> = {
  "high-glade": {
    id: "high-glade",
    name: "The High Glade",
    width: 2400,
    height: 1500,
    // backdrop: "/scenes/high-glade.png",  // ← drop real art here later
    hotspots: [
      {
        id: "hs-brannock",
        characterId: "brannock",
        name: "Brannock Quillfeather",
        emoji: "🦊",
        accent: "#b8860b",
        x: 1180,
        y: 880,
        marker: "needs_me",
      },
      {
        id: "hs-elder",
        characterId: "elder",
        name: "Maeve the Elder",
        emoji: "🦉",
        accent: "#7b5fa0",
        x: 1480,
        y: 720,
        marker: "in_progress",
      },
    ],
  },
};

export const STARTING_SCENE = "high-glade";
