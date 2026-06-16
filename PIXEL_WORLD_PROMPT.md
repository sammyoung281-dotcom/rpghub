# 🗡️ BUILD PROMPT — Pixel-Art Sprites, Walk Cycles & a "3D" Pixel World

> Paste into Claude Code. This is a **visual/engine task**, not new game logic. The game loop, store, and UI overlays already exist and must keep working untouched. Read `CLAUDE.md` and `SPRITE_SPEC.md` first. Show me a running screen at each milestone — don't build it all silently.

---

## 0. TL;DR

Two jobs, one direction:
1. **Convert the world to fully 16-bit pixel art, dark-fantasy vibe** — retire the painted/SVG placeholder backdrop, render owner-supplied pixel scenes + tilesets crisply (nearest-neighbour, no blur).
2. **Add real characters as animated pixel sprites** that walk with a retro 4-direction walk cycle and *appear to interact with the world's depth* — passing behind trees, in front of crystals, casting shadows, scaling slightly with depth. Aim for an **HD-2D / "fake 3D"** read: flat pixel art that feels like it has height and layers.

The reference screenshot (isometric forest glade — crystals, light shafts, stone plaza, layered depth) is the **composition + mood target**, re-imagined in 16-bit pixel art rather than painted.

**Honest constraints (state back to me if any bite):**
- Going fully pixel **reworks the existing `src/scene/` painted engine** (Backdrop, camera). That's expected and approved — but keep the Zustand store, dialogue, journal, scrolls, and `AgentEngine` seam untouched.
- **I supply the raw pixel art** (sprite sheets, scene PNGs, tilesets) generated with an AI pixel-art tool, following `SPRITE_SPEC.md`. You build the code that ingests, animates, and depth-sorts it. You do **not** hand-draw pixels.
- A single painted angle can't truly rotate; "3D" here = layered parallax + depth-sorting + lighting/shadow tricks, not real geometry. Don't fake more than that.

---

## 1. What already exists (do not break)

- Painted 2.5D scene engine in `src/scene/` (SceneStage, useCamera, Backdrop, Motes, Hotspot) with a hard-won camera (contain-based min-zoom, ~130px pan overscan, single bleeding ground layer — see `CLAUDE.md` build journal).
- Scenes are data-driven in `src/data/scenes.ts`.
- Zustand store is the single source of truth; React overlays + the world both read/write through it.
- Characters/guilds/quests/authority already modelled as data.

**Reuse the camera math.** The zoom/pan/overscan model works — don't reinvent it. Swap what it *renders* (pixel backdrop instead of SVG placeholder), not how it moves.

---

## 2. Pixel rendering foundation (do this first)

- Global crisp-pixel rendering: `image-rendering: pixelated` on all sprite/scene layers; integer-friendly scaling; disable canvas smoothing if canvas is used.
- Establish a **virtual pixel resolution** and scale the whole stage by an integer factor so art stays sharp at the camera's zoom range. Document the chosen base resolution in the README.
- Add a tiny **palette/lighting pass** option (optional CSS/canvas filter) so sprites and scenes share a unified dark-fantasy tone — muted, cool shadows, warm light pools. Keep it subtle and toggleable.

**Milestone A — show me:** the existing scene rendered as a crisp pixel image (use one placeholder pixel scene PNG I provide) with the existing camera pan/zoom still working. No characters yet.

---

## 3. Sprite system

Build a **data-driven sprite component** that reads `SPRITE_SPEC.md` conventions:

- Loads a **sprite sheet** per character (rows = direction, columns = animation frames) per the spec's grid.
- Supports animation states: **idle, walk** (required for Phase 1); leave clean hooks for **work / talk / blocked** states to add per character later.
- **Retro frame-stepping**, not smooth tweening: hold each frame (~6–10 FPS feel) so the walk reads as classic 16-bit, even while the character's position tweens smoothly across the map.
- 4-direction facing (N/E/S/W) chosen from movement vector; mirror E/W if the sheet only provides one side (note this in spec).
- Characters are placed by **world coordinates** in scene data and bound to existing store characters (name, guild, status, authority). The `!` quest marker, status colour ring (🟥🟨🟩⬜), and click-to-dialogue must all still work, now anchored above the sprite's head.

Add a small **scripted ambient wander** (Phase 1, mock): characters drift between a few waypoints in their space and play work/idle animations — representing "doing their job." Keep this behind the `AgentEngine` seam so Phase 2 can drive it for real.

**Milestone B — show me:** one character sprite walking a patrol loop in a scene, retro walk cycle playing, `!` marker + status ring intact, click still opens the parchment dialogue.

---

## 4. The "3D" illusion — depth & interaction (the important part)

Make flat sprites feel embedded in a world with height and layers:

1. **Y-sort / depth ordering.** Sort sprites *and* tagged scene props by their **feet (baseline) Y** so a character drawn lower on screen renders in front, higher renders behind. This is what makes a character walk *behind* a tree, then *in front of* the next one.
2. **Occluder layers.** Allow a scene to define foreground occluder elements (tree canopies, the front edge of the stone plaza, a crystal) as separate cut-out PNGs or tagged sprites with their own baseline, so characters pass behind them naturally.
3. **Contact shadows.** Each sprite gets a soft elliptical shadow blob at its feet that anchors it to the ground and shifts subtly with the scene's light direction.
4. **Depth scaling (subtle).** Characters shrink slightly as they move "up"/away and grow as they move "down"/toward camera, within a small clamp — sells isometric depth without breaking pixel integrity (snap to integer scale steps).
5. **Height / elevation zones.** Support a few elevation bands (e.g. the raised stone plaza vs. the forest floor in the reference): stepping up a staircase raises the sprite's draw offset and shadow so they read as standing higher.
6. **Light & glow interaction.** Where the scene has glowing crystals / light shafts (per the reference), let nearby sprites pick up a tint or rim-light. Cheap, big payoff.

**Milestone C — show me:** a character walking a path that takes them *behind* one prop and *in front* of another, up onto the raised plaza, with shadow + subtle depth-scale + a crystal glow tint. This is the money shot — get it convincing.

---

## 5. Making the map read as more 3D (using the screenshot as inspiration)

Translate the reference composition into pixel art, owner-supplied:

- **Layered depth:** distinct background (far forest/cliff), midground (playable ground + props), and foreground occluders. Reuse the camera's parallax carefully — heed the build-journal warning that mismatched layer sizes cause edge artifacts at zoom-out. Each scene PNG/layer must bleed past the map and fade to dark.
- **Vertical interest:** cliffs, staircases, a raised plaza, tall trees framing the top — height is what made the reference feel 3D.
- **Light shafts, glowing crystals, floating motes, water shimmer:** reuse the existing Motes FX, re-skinned pixel-style, plus animated glow on crystal hotspots.
- Keep the **dark fantasy mood**: cool shadowed forest, warm pools of light, bioluminescent accents.

I will generate these scene/tileset PNGs per `SPRITE_SPEC.md` §Scenes. You define the **slots and data shape** in `src/data/scenes.ts` (background layer, occluder layer(s), elevation zones, hotspot + light positions) and render them; I drop in art and nudge coordinates via screenshot feedback.

**Milestone D — show me:** one full scene (the High Keep or Merchant's Guild) assembled from my pixel layers with depth, elevation, occluders, and FX, a character living in it.

---

## 6. Workflow & guardrails

- **Screenshot feedback loop:** after each milestone, ask me for a screenshot and adjust. This is the only reliable visual-verification channel here — lean on it, don't assume a visual is right.
- Gate every "done" on `tsc -b` + `vite build` green.
- Provide a **`/public/sprites` and `/public/scenes` drop convention** matching `SPRITE_SPEC.md`, plus a `placeholder` set so the app runs before I supply final art (procedural blocky sprite is fine as a stand-in — clearly a placeholder, not faux hand-pixelled).
- Keep all new art-handling **data-driven**: adding a character sprite or a scene = dropping a PNG and editing data, never engine code.
- Commit per milestone. Update the README: pixel pipeline, sheet/scene conventions, how depth-sorting works, how to add a sprite or scene.

## 7. First reply I want

A short plan: which `src/scene/` files change, the sprite-sheet data shape, the depth-sort approach, and the scene-layer/elevation data model in `scenes.ts`. Then start at **Milestone A**. Keep it chunked — I'm ADHD.
