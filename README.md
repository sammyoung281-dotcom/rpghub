# 🏰 The Realm of Endeavour

A local, top-down medieval-fantasy RPG that is secretly a personal life/work command centre.
Characters = AI agents (side hustles, day job, admin, learning). You are the Chairman.
**Phase 1** = the playable world + game loop with *mocked* agents. No real AI yet.

## Run it

```bash
npm install
npm run dev        # → http://localhost:5173  (or set PORT=xxxx)
```

## Tech

- **Vite + React + TypeScript** — both the world and the UI overlays are React.
- **Painted 2.5D scene engine** (plain DOM — no game engine): parallax layers, a
  free god-camera (pan/zoom/glide), SVG + canvas atmosphere FX.
- **Zustand** — single source of truth.
- **localStorage / JSON** — persistence (added in later steps).

## Visual style — painterly 2.5D (owner-supplied art)

Painted isometric scenes like the reference (lush glade, glowing crystals, light
shafts, stone plaza). **The look comes from painted PNGs you drop into
`/public/scenes`** — see "Adding painted scenes" below. Until then a procedural
*atmospheric placeholder* (layered SVG) stands in: deliberately abstract, not
painterly. Camera is free **pan + zoom + parallax** (no live tilt/rotate — painted
art is single-angle).

> Honest note: Claude can't author painterly art, and real-time 3D can't fake the
> painted feel. So scenes are images you generate/commission; the engine brings
> them to life.

## Art pipeline (painterly)

The world uses **painterly art** (flat single paintings + sheet-animated
characters) — rendered **smoothly** (bilinear), NOT pixelated.

- **Overworld + interiors:** the app opens on `realm.png` (overworld). Five
  flat interiors (`keep/merchants/ledger/hearth/scholars`) are entered via
  **clickable building doors** (`scene.doors[]`); a **"↩ Leave to realm"** button
  returns. You can also jump anywhere via **Travel**. `activeSceneId` (store) is
  the current scene; `<SceneStage key={activeSceneId}>` refits the camera per scene.
- **All scenes are 1376×768** local px (matching the paintings); coords (hotspots,
  doors) are in that space.
- **Sprite sheets** are `1260×848`, 6 cols × 4 rows, **frameW 210 / frameH 212**
  (rows = down/left/right/up; cols = idle, 4 walk, work). Rendered by a per-scene
  **`spriteHeight`** target (small ~58 on the overworld, large ~190 in rooms) =
  `spriteHeight / frameH`, anchored by the feet (bottom-centre).
- **No walk-behind:** flat paintings have no separate foreground layer, so sprites
  render on top (occluder/elevation/light code remains but is unused by these scenes).
- To re-tune: nudge `hotspots[].x,y`, `doors[]` rects, and `spriteHeight` in
  `src/data/scenes.ts` — all by screenshot.

- **Crisp scaling:** all scene/sprite layers render with `image-rendering: pixelated`
  (`.pixel-canvas` / `.pixel-img` in `src/scene/scene.css`). No blur when the camera zooms.
- **Virtual base resolution:** the placeholder draws the realm at scene-size ÷ 10
  (e.g. 4800×3000 → 480×300) and scales up crisp. Owner-supplied scene PNGs are
  authored at 480×270 per scene (see SPRITE_SPEC §4).
- **Scene layers** (data-driven, in `scenes.ts` `layers[]`): drop PNGs into
  `public/scenes/<id>_<layer>.png` — `_bg` (background, parallax <1), `_ground`
  (walkable midground), `_occ*` (foreground occluders, with a `baseline`), `_light`
  (additive). Until art is dropped, a procedural `PixelPlaceholder` stands in.
- **Sprites:** drop `public/sprites/<characterId>.png` (48×48 cells, rows =
  down/left/right/up). Bound to a hotspot via its `sprite` field (Milestone B+).
- **Depth (Milestone C):** sprites + occluder layers share one container and are
  y-sorted by `z-index = effective baseline Y` (feet − elevation), so a character
  walks behind a prop with a higher baseline and in front of a lower one. Occluder
  layers carry a `baseline`; `elevationZones` lift a sprite (and its shadow) onto
  raised ground; `depthScale {min,max}` shrinks/grows sprites by depth; `lights`
  add a coloured rim glow to nearby characters. Until occluder PNGs are dropped, a
  few procedural demo trees in `SceneStage` prove the walk-behind.

## Adding painted scenes

1. Generate/commission a painted backdrop image (see `SCENE_ART_SPEC.md` for size
   + a copy-paste generation prompt).
2. Save it to `public/scenes/<id>.png`.
3. In `src/data/scenes.ts`, set that scene's `backdrop: "/scenes/<id>.png"` and
   place `hotspots` (characters) at the right `x,y` over the art.

## Architecture (current + planned)

```
src/
  scene/           painted 2.5D world (plain React/DOM)
    SceneStage.tsx the viewport: parallax layers + hotspots + camera
    useCamera.ts   god-camera — pan (WASD/drag), zoom (wheel), smooth glide
    Backdrop.tsx   procedural atmospheric PLACEHOLDER layers (swapped by real art)
    Motes.tsx      drifting glow particles (canvas)
    Hotspot.tsx    a clickable character + floating quest marker
    interactions.ts summonCharacter(): glide camera + open dialogue
  ui/              React overlays: DialogueBox, NeedsYouNow, Journal, … (later steps)
  data/            content — scenes.ts, mockDialogues.ts, guilds/characters (later)
  store/           Zustand store (single source of truth)
  agent/           AgentEngine seam — see below
  types.ts         core domain types + urgency colour system
  App.tsx          composes the scene + React overlays
```

### The agent seam (where Phase 2 plugs in)

`src/agent/AgentEngine.ts` will define the interface the world talks to:
`proposeQuest()`, `askQuestion()`, `doWork()`, `report()`.
Phase 1 ships a `MockAgentEngine` returning scripted data. Phase 2 swaps in a
real Claude-backed implementation behind the *same* interface — no rewrite of the world.

## Art

All visuals are currently **procedural low-poly geometry** (boxes, cylinders, cones
in `game/*.tsx`) so the app runs with zero external assets.
To upgrade: drop free/CC0 low-poly GLTF models (e.g. Kenney.nl, Quaternius) into
`public/`, load them with drei's `useGLTF`, and replace the procedural pieces —
the scene layout in `Keep.tsx` / `Scenery.tsx` stays the same.

## Build milestones (see BUILD_PROMPT.md §7)

1. ✅ Scaffold + a roamable world with a god-camera. *(now painted 2.5D)*
2. ✅ Parchment dialogue box + "Needs You Now" scroll.
3. ✅ Merchant's Guild: leader + `!` quest markers + accept/decline → Journal. *(+ AgentEngine seam, cast data)*
4. ✅ One continuous realm map — Keep + 4 guild regions, faked-iso buildings, fast-travel.
5. ✅ Council (Elder + guild reports), authority levels, decree-a-task, autosave + export/import, completion juice.

**Phase 1 complete.** Phase 2 = swap `MockAgentEngine` for a real Claude engine behind the same `AgentEngine` interface (see `src/agent/`).
