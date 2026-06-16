# 🎨 SPRITE & WORLD ART SPEC — The Realm of Endeavour

> The contract between the art I generate (with an AI pixel-art tool) and the code Claude Code builds. Keep dimensions and naming **exact** so sprites line up and depth-sorting works. Style: **16-bit, dark medieval fantasy, retro SNES-era pixel art.**

---

## 1. Global art rules (every asset)

- **True pixel art:** hard edges, limited palette, no anti-aliasing, no soft gradients, no blur. Nearest-neighbour scaling only.
- **Mood:** dark fantasy — cool shadowed forest/stone, warm torch/light pools, bioluminescent crystal accents (teal/cyan). Muted, slightly desaturated, high readability.
- **Lighting direction:** top-left key light, shadows fall bottom-right. Keep consistent across all assets so the world feels unified.
- **Transparent background** (PNG, alpha) for all sprites and occluder cut-outs.
- **No built-in drop shadow** on sprites — the engine draws shadows. Keep feet clean.

### Shared palette (dark fantasy 16-ish colours — use as anchor, AI tools approximate)
```
Stone / UI:    #1b1a2e  #2c2b46  #4a4866  #7a7896  #b9b7d0
Forest dark:   #0e1f1a  #16382c  #245c3f  #3f8a5c  #6fbf86
Wood / earth:  #23160f  #3d2516  #6b3f22  #9c6a3c  #c9a36a
Skin tones:    #f1c9a5  #c98f6a  #8a5a3c
Crystal glow:  #0fd5d0  #56f0e6  #b8fff7  (emissive accents)
Warm light:    #ffd27a  #ff9d4d  (torch / light shafts)
Blood/alert:   #c1352b  #e25a4a   (urgency / blocked red)
```

---

## 2. Character sprite sheets

### Grid (EXACT)
- **Frame size:** `48 × 48 px` per cell. (Character ~32px tall within the cell, feet near the bottom, ~8px headroom for the `!` marker.)
- **Layout:** rows = direction, columns = animation frames. One sheet per character.
- **Sheet dimensions:** `frames_wide × 48` by `4 × 48`. With the frame counts below → **288 × 192 px** per character sheet.

### Rows (top → bottom), EXACT order
| Row | Direction | Notes |
|-----|-----------|-------|
| 0 | **Down (S, facing camera)** | default idle facing |
| 1 | **Left (W)** | engine may mirror for Right |
| 2 | **Right (E)** | include it; if omitted, code mirrors row 1 |
| 3 | **Up (N, back)** | back of head/cloak |

### Columns (frames per row), EXACT order
6 frames per row:
1. **Idle** (standing, slight breathing pose)
2. Walk contact (left foot fwd)
3. Walk passing
4. Walk contact (right foot fwd)
5. Walk passing (alt)
6. **Idle/work accent** (subtle — used for ambient "working" bob)

> Walk cycle uses frames **2–5** looped at ~8 FPS. Idle = frame 1. If a sheet only has 4 columns (idle + 3 walk) that's acceptable — tell the engine via data.

### Naming
`/public/sprites/<characterId>.png` — the ids **must match `src/data/characters.ts` exactly**: `elder.png`, `brannock.png`, `tasha.png`, `edmund.png`, `wren.png`, `lyra.png`.
Plus optional `<characterId>_work.png` later for job-specific animations (anvil, market stall, writing).

### Starting cast to generate (the REAL roster — anthropomorphic dark-fantasy animals)
> These are not humans. The existing characters are characterful talking animals (their emoji portraits hint the species). Keep that — anthropomorphic, upright, clothed, JRPG-cute-but-dark.

| id | Character | Species | Role | Visual hook |
|----|-----------|---------|------|-------------|
| `elder` | Maeve the Elder | 🦉 owl | High Council — cross-realm oversight | ancient hooded owl-sage, grey-blue robes, gnarled staff with a faint cyan rune |
| `brannock` | Brannock Quillfeather | 🦊 fox | Merchant's Guild (side hustles) | silver-tongued fox in a maroon-and-gold coat, heavy coin pouch, sly grin |
| `tasha` | Tasha Coppernick | 🦝 raccoon | Guild Artificer (build/QA) | meticulous raccoon tinkerer, leather apron, tools + goggles |
| `edmund` | Magister Edmund Vell | 🦡 badger | Order of the Ledger (day job) | stern badger clerk, iron-trimmed dark tunic, thick ledger + quill |
| `wren` | Wren Hollowmoor | 🦔 hedgehog | Hearthkeepers (personal admin) | warm fussy hedgehog warden, apron over green cloak, ring of keys, lantern |
| `lyra` | Lyra Pageturner | 🦌 deer | Scholars' Tower (learning) | curious deer scholar, spectacles, midnight-blue robe, open glowing tome |

---

## 3. AI generation prompts (paste into your pixel-art generator)

Generate **one character at a time as a sprite sheet**. Use these as bases; keep the trailing technical block identical every time for consistency.

**Shared technical suffix (append to every prompt):**
> `anthropomorphic upright animal character, 16-bit SNES-era pixel art, top-down JRPG character sprite sheet, 4 directions (down/left/right/up) as rows, 6 columns (idle + 4-frame walk cycle + work pose), 48x48px per frame, transparent background, hard pixel edges, no anti-aliasing, limited dark-fantasy palette, top-left light source, character centered with feet at cell bottom, consistent proportions across all frames.`

- **elder (owl):** `An ancient anthropomorphic owl-sage in long grey-and-deep-blue hooded robes, holding a tall gnarled staff topped with a faint glowing cyan rune, wise and severe, dark medieval fantasy.` + suffix
- **brannock (fox):** `A cunning anthropomorphic fox merchant in a maroon coat with gold trim, a heavy coin pouch on the belt, fingerless gloves, sly confident posture, dark medieval fantasy.` + suffix
- **tasha (raccoon):** `A meticulous anthropomorphic raccoon tinkerer in a leather apron with tool-belt and goggles pushed up, clever and watchful, dark medieval fantasy.` + suffix
- **edmund (badger):** `A stern anthropomorphic badger clerk in an iron-trimmed dark grey tunic, carrying a thick ledger book and quill, disciplined and rigid, dark medieval fantasy.` + suffix
- **wren (hedgehog):** `A warm fussy anthropomorphic hedgehog warden in a brown apron over a deep-green cloak, a ring of iron keys at the hip, holding a small glowing lantern, dark medieval fantasy.` + suffix
- **lyra (deer):** `A curious anthropomorphic deer scholar with round spectacles, a midnight-blue robe, clutching an open tome with faint cyan glyphs, gentle and bright-eyed, dark medieval fantasy.` + suffix

> **Consistency tip:** generate all characters with the same tool/seed family and the same suffix. If your tool won't do a clean 4-row sheet, generate **one direction sheet at a time** (a 6×1 strip, 288×48) and I'll stack them — tell Claude Code you're supplying per-direction strips.

---

## 4. Scene / world art (you supply; fully pixel)

Each scene is built from **layered PNGs** so the engine can depth-sort and parallax. Translate the reference screenshot's composition into pixel art.

### Layers per scene (EXACT slots)
- `/<sceneId>_bg.png` — **background**: far cliffs, distant forest, sky/canopy gaps. Bleeds past map edges, fades to dark.
- `/<sceneId>_ground.png` — **midground**: the walkable floor, stone plaza, paths, water — where characters stand.
- `/<sceneId>_occluders.png` (or numbered `_occ1`, `_occ2`) — **foreground cut-outs**: tree canopies, plaza front edge, large crystals characters walk *behind*. Transparent elsewhere.
- `/<sceneId>_light.png` (optional) — **light shafts / glow overlay**, additive.

### Canvas size
- Author scenes at **480 × 270 px** (16:9 pixel canvas), or a tidy multiple. Keep all layers of one scene **identical dimensions and aligned** so they stack pixel-perfect. Document the chosen size once and reuse it everywhere.

### Naming
`/public/scenes/<sceneId>_<layer>.png` — sceneIds **match the region ids in `src/data/scenes.ts`**: `keep`, `merchants`, `ledger`, `hearth`, `scholars`. (There's also a `realm` overview scene — the whole map zoomed out.)

### Scene generation prompt base (per scene, + technical suffix)
**Technical suffix for scenes:**
> `16-bit SNES-era pixel art, isometric/top-down RPG environment, dark medieval fantasy, layered depth (far background, mid ground, foreground), cool shadowed tones with warm light pools and cyan crystal glow, hard pixel edges, no anti-aliasing, 480x270px.`

- **High Keep:** `A grand dark-stone throne keep on a raised plateau, banners, torch sconces, a worn stone council floor, framed by tall pine forest and cliffs.` + suffix
- **Merchant's Guild:** `A cosy cluttered merchant hall — market stalls, crates, coin scales, hanging lanterns, a warm fire, forest visible through arched windows.` + suffix
- **Order of the Ledger:** `A severe stone records-hall, tall shelves of ledgers, a long writing desk, cold blue light, disciplined and orderly.` + suffix
- **Hearthkeepers:** `A warm hearth-lit cottage hall, hanging keys and herbs, a stew pot, soft domestic clutter, lantern glow.` + suffix
- **Scholars' Tower:** `A circular arcane study atop a tower, telescopes, floating tomes, glowing cyan glyph-circles, starlit windows.` + suffix

### Elevation & hotspots (data, not art)
For each scene I'll tell Claude Code (and tune by screenshot): elevation zones (e.g. raised plaza band), occluder baselines, character spawn/waypoint coords, crystal/torch light positions, and the clickable hotspot rectangles. These live in `src/data/scenes.ts`.

---

## 5. Checklist before handing art to Claude Code
- [ ] Character sheet is exactly 48×48 cells, rows = down/left/right/up, frames in order.
- [ ] Transparent background, no baked shadow, consistent proportions across frames.
- [ ] Scene layers all identical size and aligned; occluders transparent except the cut-out.
- [ ] Files named per convention, dropped in `/public/sprites` or `/public/scenes`.
- [ ] One full set is enough to test — don't wait to generate everyone. Iterate via screenshots.
