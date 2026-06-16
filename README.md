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

1. ✅ Scaffold + a walkable world with a controllable character + camera follow. *(now 3D god-game)*
2. ✅ Parchment dialogue box + "Needs You Now" scroll.
3. ⬜ Merchant's Guild: leader + `!` quest markers + accept/decline → Journal.
4. ⬜ Multiple connected spaces (High Keep + guilds) with travel.
5. ⬜ Elder/guild reports, authority levels, decree-a-task, persistence, juice.
