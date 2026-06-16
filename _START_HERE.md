# ▶ START HERE — Pixel-Art Visual Upgrade

This is the kickoff index for the next build (16-bit pixel world + animated sprites + depth).

## Read these in order
1. **CLAUDE.md** — always-on project context (Claude Code auto-loads this).
2. **PIXEL_WORLD_PROMPT.md** — the build brief for this upgrade. Milestones A→D.
3. **SPRITE_SPEC.md** — the art contract (sheet sizes, palette, AI-gen prompts). I supply the PNGs.
4. **SCENE_DATA_SHAPE.ts** — concrete target data model (extends `src/types.ts`) with the High Keep fully populated as an example.

## Paste this as your FIRST message to Claude Code
> Read CLAUDE.md, then PIXEL_WORLD_PROMPT.md, then SPRITE_SPEC.md and SCENE_DATA_SHAPE.ts. Together they define a visual upgrade: convert the world to crisp 16-bit dark-fantasy pixel art and add animated pixel-sprite characters that depth-sort against the world (walk behind/in front of props, shadows, subtle depth-scale, elevation, crystal glow). Don't break the Zustand store, dialogue, journal, scrolls, or the AgentEngine seam. Give me a short plan — which `src/scene/` files change, the sprite-sheet data shape, the depth-sort approach, and the scene-layer/elevation model for `scenes.ts` — then start at **Milestone A**. Show me a running screen at each milestone. Keep replies chunked; I'm ADHD.

## What I (Sam) do in parallel
- Generate the **6 character sprite sheets** + **scene layers** per SPRITE_SPEC.md and drop them in `/public/sprites` and `/public/scenes`.
- Don't wait for all of them — one character + one scene is enough to test. Iterate via screenshots.

## Reminder to Claude Code
- Gate "done" on `tsc -b` + `vite build` green.
- Ask me for a screenshot after each milestone — it's the only reliable visual check here.
- Commit per milestone.
