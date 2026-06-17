# Background Generation Prompts — overworld + rooms

Paste these **one at a time** into your image generator. Each is self-contained (style + framing + scene). Matches the uploaded reference: lush painterly isometric 2.5D, glowing crystals, light shafts, stone plaza.

---

## ⚠️ Read first — flat images vs the layer system (honest)

Your engine renders each scene as **separated layers** (`_bg`, `_ground`, `_occ`, `_light`) so characters can walk *behind* trees/pillars and pick up glow. An image generator gives you **one flat painting** — it cannot cleanly separate those layers.

Two ways to use what you generate:

1. **Flat backdrop (simplest, recommended to start).** Use the whole painting as the scene's `_bg` layer; leave `_occ`/`_light` empty. Characters walk *on top* of everything (no walk-behind). Looks great, loses only the occlusion trick. → save each as `<id>_bg.png`.
2. **Add occluders later (more work).** Keep the flat `_bg`, then in an image editor cut out the big foreground objects (front trees, pillars, counter) onto a transparent PNG = `<id>_occ.png`. Only worth it for the hero scenes.

Tell Claude Code which you're doing: *"Scenes are flat single paintings in `<id>_bg.png`; treat a scene with only `_bg` as a flat backdrop, sprites render on the floor area."*

## Sizing & framing (all scenes)
- **Aspect:** 16:9. **Resolution:** as large as your generator allows (ideally ≥ 1536 px wide); upscale after. Off-aspect is fine — Claude Code crops/scales.
- **Camera:** keep the **SAME 3/4 top-down isometric angle** in every image (overworld + all rooms) so sprites composite consistently. This consistency matters more than any single detail.
- **Transparent background NOT needed** here — these are full opaque scenes (unlike the sprites).

---

## SHARED STYLE (baked into every prompt below)
> lush painterly 2.5D isometric RPG diorama, high-detail HD-2D, 3/4 top-down isometric camera, rich atmospheric lighting with god-ray light shafts, glowing cyan crystals, soft volumetric fog, warm torchlight against cool shadow, detailed natural textures (mossy stone, weathered wood, lush foliage), slightly desaturated moody-but-beautiful colour, dark fantasy mood. NOT flat, NOT pixel art, NOT a real photo.

---

## 1 — `realm.png` (THE OVERWORLD — the gathering map)

```
A lush painterly 2.5D isometric RPG overworld map, high-detail HD-2D, 3/4 top-down isometric camera. A misty ancient forest glade realm with a large central mossy-stone plaza where characters gather, ringed by tall sunlit pine trees, cliffs, glowing cyan crystals, waterfalls, light shafts and soft fog — exactly the mood of a cosy fantasy diorama.

Arranged around the central plaza, FIVE distinct visitable BUILDINGS, each clearly separate and clickable, connected by stone paths:
- a grand arcane KEEP / council hall on a raised stone plateau with banners and a glowing rune (top centre),
- a warm candlelit TAVERN with a wooden sign and glowing windows (left),
- a dark stone THRONE HALL / records keep with iron-and-gold trim and tall narrow windows (right),
- a cosy stone GATEHOUSE COTTAGE with lanterns and a warm hearth-glow window (lower left),
- a tall arcane WIZARD'S TOWER topped with a glowing observatory (lower right).

Each building reads as its own landmark with a clear entrance. Cohesive single painting, dark fantasy mood, god-ray light shafts, glowing crystals, volumetric fog, slightly desaturated. 16:9. NOT pixel art, NOT flat.
```
> The 5 buildings become clickable hotspots; Claude Code maps the click areas to each building's pixel position (tuned by screenshot).

---

## 2 — `keep_bg.png` (High Keep — Maeve the Archmage's council hall)

```
[SHARED STYLE]. Interior of a grand arcane COUNCIL HALL inside an ancient keep — vaulted dark stone, tall star-flecked banners, a raised dais with a glowing blue rune circle, floating candle-light, drifting motes, cold magical glow. A clear open stone floor in the centre for a figure to stand. Atmospheric god-rays through high windows. Dark fantasy, painterly isometric 3/4 view. 16:9.
```

## 3 — `merchants_bg.png` (Merchant's Guild — Brannock's tavern)

```
[SHARED STYLE]. Interior of a warm candlelit medieval TAVERN — heavy timber beams, a long worn bar counter, barrels and crates, hanging iron lanterns, a stone fireplace, mugs and clutter, glowing windows showing dark forest outside. Cosy but grimy, oxblood and tarnished-gold tones. Clear open floor in the centre. Painterly isometric 3/4 view. 16:9.
```

## 4 — `ledger_bg.png` (Order of the Ledger — Edmund the Dark King's throne hall)

```
[SHARED STYLE]. Interior of a severe dark stone THRONE HALL / records keep — tall narrow windows with cold blue light, a high iron-and-gold throne on a stepped dais, towering shelves of heavy ledgers and tomes, black-and-gold banners, a single warm candle. Grim, imposing, orderly, hollow. Clear floor before the throne. Painterly isometric 3/4 view. 16:9.
```

## 5 — `hearth_bg.png` (Hearthkeepers — Wren the Warden's gatehouse)

```
[SHARED STYLE]. Interior of a weathered stone GATEHOUSE / warden's hall — a big stone hearth with a low warm fire, hanging rings of iron keys and herb bundles, heavy wooden door, a rusted lantern, worn rug, simple table. Tired, lived-in, cosy-but-grim warmth against cold stone. Clear floor in the centre. Painterly isometric 3/4 view. 16:9.
```

## 6 — `scholars_bg.png` (Scholars' Tower — Lyra the Loremaster's library)

```
[SHARED STYLE]. Interior of a circular arcane TOWER LIBRARY-STUDY — curved stone walls, tall starlit windows, floor-to-ceiling shelves of glowing tomes, a cluttered writing desk with candles and scrolls, a brass telescope, a faint cyan glyph-circle on the floor, drifting magical motes. Scholarly, hushed, mysterious. Clear floor space in the centre. Painterly isometric 3/4 view. 16:9.
```

---

## File names → `/public/scenes/`
| File | Scene |
|------|-------|
| `realm.png` | the overworld gathering map (5 building exteriors) |
| `keep_bg.png` | High Keep council hall |
| `merchants_bg.png` | tavern |
| `ledger_bg.png` | dark king's throne hall |
| `hearth_bg.png` | warden's gatehouse |
| `scholars_bg.png` | tower library |

## Practical notes (honest)
- **Keep the camera angle identical** across all 6 — mismatched perspective is the one thing that will make sprites look wrong on top.
- Generators drift on multi-building layouts — you may need a few tries to get the overworld with **5 clearly separate buildings**; regenerate until each is distinct and has a visible entrance.
- Leave a **clear, fairly flat floor area** in each room so a character has somewhere believable to stand and walk.
- These are **opaque full scenes** — do not ask for transparent background (that's only for the sprites).
- Existing `_ground/_occ/_light` placeholder PNGs can stay or be deleted; with flat backdrops you only need `<id>_bg.png` + `realm.png`.
```
