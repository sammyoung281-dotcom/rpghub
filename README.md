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
- **Phaser 3** — the world, movement, sprites, tilemaps. Owns the canvas; React sits on top.
- **Zustand** — single source of truth (added in later steps).
- **localStorage / JSON** — persistence (added in later steps).

## Architecture (current + planned)

```
src/
  game/            Phaser world
    scenes/        WorldScene = the rooms
    PhaserGame.tsx React wrapper that mounts/destroys the Phaser.Game
    bridge/        event bus React <-> Phaser (later step)
  ui/              React overlays: DialogueBox, NeedsYouNow, Journal, DecreeQuill, Reports (later steps)
  data/            content lives here — guilds, characters, quests (data-driven)
  store/           Zustand store (later step)
  agent/           AgentEngine seam — see below
  App.tsx          composes Phaser + React overlays
```

### The agent seam (where Phase 2 plugs in)

`src/agent/AgentEngine.ts` will define the interface the world talks to:
`proposeQuest()`, `askQuestion()`, `doWork()`, `report()`.
Phase 1 ships a `MockAgentEngine` returning scripted data. Phase 2 swaps in a
real Claude-backed implementation behind the *same* interface — no rewrite of the world.

## Art

All visuals are currently **generated procedurally** in `WorldScene.makeTextures()`
(colored tiles + a drawn hero) so the app runs with zero external assets.
To upgrade: drop free/CC0 top-down art (e.g. Kenney.nl) into `public/`, load it in
`preload()`, and point the sprites/tiles at the loaded texture keys.

## Build milestones (see BUILD_PROMPT.md §7)

1. ✅ Scaffold + a single walkable room with a controllable character + camera follow.
2. ⬜ Parchment dialogue box + "Needs You Now" scroll.
3. ⬜ Merchant's Guild: leader + `!` quest markers + accept/decline → Journal.
4. ⬜ Multiple connected spaces (High Keep + guilds) with travel.
5. ⬜ Elder/guild reports, authority levels, decree-a-task, persistence, juice.
