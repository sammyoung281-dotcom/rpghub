# Claude Code task — install the real painterly art (sprites + scenes + clickable overworld)

The real art is already in `public/`. This task is **wiring + tuning**, not new engine architecture. Don't touch the Zustand store, dialogue, journal, scrolls, or the `AgentEngine` seam. Gate "done" on `tsc -b` + `vite build` green, and show me a running screen at each milestone.

## What's on disk (already there)

**Sprites — `public/sprites/`** (overwrote the old placeholders):
`elder.png, brannock.png, tasha.png, edmund.png, wren.png, lyra.png`
- Each sheet is **1260 × 848 px**, a uniform **6 columns × 4 rows** grid.
- **frameW = 210, frameH = 212.**
- Rows (top→bottom) = facing: **0 Down, 1 Left, 2 Right, 3 Up.**
- Cols (left→right) = frame: **0 Idle, 1–4 Walk cycle, 5 Work/action pose.**
- These are **painterly, NOT pixel art** → do **NOT** apply `image-rendering: pixelated` to sprites. Render them smoothly (bilinear). The character fills most of the cell; anchor each sprite by its **feet = bottom-centre of the cell**.

**Scenes — `public/scenes/`** (flat single paintings, **1376 × 768 px**, fully opaque):
`realm.png` (the overworld map) · `keep_bg.png` · `merchants_bg.png` · `ledger_bg.png` · `hearth_bg.png` · `scholars_bg.png`
- The old layered placeholders (`*_ground.png`, `*_occ*.png`, `*_light.png`) are now **blank 16×16 transparent stubs** — remove their references in `scenes.ts` and don't render them. Each scene is just its flat `_bg`.

## 1. Update the sprite sheet config
For every character, set `frameW: 210, frameH: 212`, `cols: 6`, rows `{down:0,left:1,right:2,up:3}`, `idleFrame: 0`, `walkFrames: [1,2,3,4]`, `workFrames: [5]`, `fps: 8`. Make sure the slicer uses 210/212 (not 48) and smooth scaling. *Show me one character idling + walking in a scene.*

## 2. Wire the five interiors as flat backdrops
For `keep, merchants, ledger, hearth, scholars`: scene = the single `<id>_bg.png` (1376×768), no occluder/light/ground layers. Place that guild's **leader** standing on the room's floor at a believable spot, with a small ambient wander. Sprites here are **large** — render each at roughly **180–210 px tall on screen** (a normal full-size character in a room). Tune position by screenshot. *Show me each leader standing in their room.*

Leader → room:
`elder → keep` · `brannock → merchants` · `tasha → merchants` · `edmund → ledger` · `wren → hearth` · `lyra → scholars`

## 3. The overworld (`realm.png`) — default view with door access
- Make **`realm.png` the default scene** the app opens on: the whole realm, painted, where everyone can gather.
- It's a **big map** drawn at a larger effective scale than the rooms, so **sprites must appear much SMALLER here** — render characters on the realm at roughly **48–72 px tall** (distant/overview scale), versus ~180–210 px inside a room. Put this in data as a **per-scene sprite scale / target draw-height**, so the same sheet draws small on `realm` and large in interiors without new code.
- Scatter the characters around the map near their own buildings (small figures milling in the plaza/paths).
- Add **clickable "door" hotspots** on each of the five buildings in `realm.png`. Clicking a building **enters that interior scene** (loads `<id>_bg.png` with its leader). Add an obvious **"leave / return to realm"** action in each interior to come back.
- I'll fine-tune the door rectangles and the small-sprite scale **by screenshot** — give me sensible starting coords, then we nudge.

*Show me: the realm map on load with small wandering characters, clicking a building enters the room, leaving returns to the realm.*

## 4. Keep the ADHD rules intact
Quest `!` markers, status colour rings, click-to-dialogue, the Needs You Now scroll and Journal must all still work — anchored above each sprite at both scales (small on realm, large in rooms).

## Notes / honest constraints
- These flat paintings have no separate foreground layer, so there's **no walk-behind occlusion** — characters render on top of the scene. That's expected; don't fake depth layers.
- Per-character `frameW/frameH` and the per-scene sprite scale are the only "measurements" that matter — get those right and the art lines up.
- Tiny ✦ watermark sits in the bottom-right corner of each sprite sheet (last cell). Ignore it; it'll be painted out later.

## First reply I want
A short plan: which files change (`scenes.ts`, the sprite component/config, the scene→scene navigation), how you'll store the **per-scene sprite scale** and the **door hotspots**, then start at step 1. Keep it chunked.
