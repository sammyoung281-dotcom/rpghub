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

- **Vite + React + TypeScript** — UI overlays (dialogue, journal, scrolls) live in React.
- **react-three-fiber + three.js + drei** — the 3D world, movement, models. Owns the canvas; React UI sits on top.
- **Zustand** — single source of truth.
- **localStorage / JSON** — persistence (added in later steps).

## Visual style

Late-90s top-down **god-game in 3D** (Black & White / Populous), not 2D pixels.
Tilted 3/4 camera (~52°) trails the Sovereign; **Q/E orbit the view**. Cosy mood:
warm sun, soft shadows, rounded low-poly buildings, lush grass + fog.

## Architecture (current + planned)

```
src/
  game/            3D world (react-three-fiber)
    World.tsx      the <Canvas>, lights, sky, soft shadows — composes the scene
    Hero.tsx       the Sovereign avatar + camera-follow + Q/E orbit
    Keep.tsx       the High Keep structures (towers, walls, throne)
    Scenery.tsx    grassland + ring of trees
    useKeys.ts     keyboard-held-state hook
  ui/              React overlays: DialogueBox, NeedsYouNow, Journal, DecreeQuill, Reports (later steps)
  data/            content lives here — guilds, characters, quests (data-driven)
  store/           Zustand store (single source of truth)
  agent/           AgentEngine seam — see below
  types.ts         core domain types + urgency colour system
  App.tsx          composes the 3D world + React overlays
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
