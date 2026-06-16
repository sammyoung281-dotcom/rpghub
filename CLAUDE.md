# CLAUDE.md — The Realm of Endeavour (AI Agent RPG Hub)

Claude Code reads this file automatically. Keep it current. The full build brief lives in `BUILD_PROMPT.md` — read it for detail; this file is the always-on context.

## What this project is
A **local web app** styled as a top-down medieval-fantasy RPG that is secretly the owner's life/work command centre. "Characters" are AI agents covering side hustles, day job, personal admin, and self-improvement. The owner is the **Chairman** (in-world: the Sovereign). Characters bring quests, ask permission, and report back.

## Who I'm building for
Sam — runs change/ops at a fintech, building side hustles on the side. **ADHD.** Wants no fluff, honest limits stated early, and the *one thing that needs them now* made unmissable. Keep replies short and chunked.

## Phasing (do not skip ahead)
- **Phase 1 (current):** the playable world + game loop with **mocked/scripted agents**. No real AI execution, no external integrations.
- **Phase 2 (later):** real Claude-powered agents + tool integrations, wired in behind the existing `AgentEngine` interface. Don't build this until told.

## Tech stack
Vite + React + TypeScript · **painted 2.5D scene engine in plain React/DOM** (no game engine — parallax layers, SVG/canvas FX, a god-camera) · React for UI overlays (dialogue, journal, scrolls) · **Zustand** as single source of truth · localStorage/JSON persistence (with file export/import). No backend, no auth. Runs on `npm run dev`.

## Visual style (decided — painterly 2.5D)
**Painted isometric 2.5D**, à la the reference screenshot (lush forest glade, glowing crystals, light shafts, stone plaza). NOT pixel art, NOT real-time 3D. The look lives in **painted scene images** the owner generates and drops into `/public/scenes`; the engine renders them with parallax depth + glow FX. **Honest constraint stated to Sam:** Claude cannot author painterly art, and real-time 3D can't fake it — so scenes are owner-supplied PNGs. Camera = free **pan + zoom + parallax** (no live tilt/rotate, since painted art is single-angle). Until real art arrives, a procedural ATMOSPHERIC PLACEHOLDER (layered SVG) stands in — deliberately abstract, not painterly. Engine lives in `src/scene/` (SceneStage, useCamera, Backdrop, Motes, Hotspot); scenes are data-driven in `src/data/scenes.ts`.

## Architecture rules
- **Data-driven:** characters, guilds, quests, authority levels defined in typed config/JSON. Adding a guild/character = editing data, not code.
- **Agent brain behind a clean seam:** `AgentEngine` interface with `proposeQuest()`, `askQuestion()`, `doWork()`, `report()`. Phase 1 = mock implementation; Phase 2 swaps in real Claude calls behind the same interface. Keep this seam obvious and isolated.
- Zustand store is the source of truth; the 3D world and React overlays both read/write through it.
- Authority model and reporting chain must be real data structures now (even if only cosmetic in Phase 1) so Phase 2 can enforce them.

## The world (theme = medieval fantasy, maps to real function)
- **High Keep** — High Council, led by **the Elder** (most senior agent). Gives the realm-wide roll-up report. The Chairman's hub.
- **Guild Halls (lower councils)** — one connected building per life area, each with its own leader + personality:
  - 🪙 Merchant's Guild = side hustles / making money
  - ⚙️ Order of the Ledger = day job (change & ops)
  - 🛡️ Hearthkeepers = personal admin
  - 📜 Scholars' Tower = self-improvement / learning
- Reporting chain: workers → guild leader → Elder → Chairman.

## Core loop
Character generates a quest → `!` floats over their head → click → parchment **dialogue box** → Accept/Decline → accepted quests go to **the Journal** → blocked quests resurface as `!` + on the **Needs You Now** scroll → completing a quest = dopamine feedback + sealed journal entry. Chairman can **decree a new task** to any character in ≤ 2 clicks.

## Authority levels (per character)
1. **Petitioner** — asks before every action.
2. **Trusted** — acts on routine, asks on big/risky/ambiguous.
3. **Steward** — acts freely in domain, reports after, escalates only blockers.

## ADHD design rules (NON-NEGOTIABLE — applies to every screen)
1. "Needs You Now" proclamation scroll always visible — one urgent action, big, unmissable.
2. No walls of text — dialogue/reports chunked to ≤ 2 sentences with "Continue ▸".
3. Colour-coded urgency everywhere: 🟥 needs me · 🟨 in progress · 🟩 done/idle · ⬜ not started.
4. One decision at a time — big buttons, never an 8-field form.
5. Instant dopamine on completion (sound, XP/coin burst, wax "SEALED" stamp).
6. Open loops live in the world (quest markers) or on the scroll — never buried in a menu.
7. Low-friction capture — floating "Decree a new task" quill, ≤ 2 clicks.
8. Forgiving — autosave, easy undo, no nagging confirmations on small stuff.
9. Calm default map; detail on demand.

## Working agreements
- **Show me a running screen at each build milestone** (see build order in `BUILD_PROMPT.md`). Never build everything silently then reveal a blob.
- Keep messages short and skimmable.
- If something can't work the way described, say so immediately — don't fake it deeper.
- Use free/CC0 placeholder art (e.g. Kenney.nl) so it runs now; note where to swap in better art. Don't block on assets.
- Commit in logical chunks. Keep the README current (run steps, architecture, where the agent stub lives, how to add a guild/character).

## Out of scope (Phase 1)
Real Claude API execution, external integrations (email/Slack/app stores/job tools), multi-device sync, auth. Leave clean seams; don't build.

---

## Build journal — Phase 1 retrospective & feedback analysis
_Written at end of Phase 1 (all 5 milestones complete). Read this before resuming so you don't repeat the detours._

**How it went:** Built in 5 milestones, showing a running screen at each (this cadence worked — keep it). Phase 1 is feature-complete: persistent, clickable world with mocked agents behind the `AgentEngine` seam.

**Aesthetic pivoted twice — both Sam-driven, both before much code, so cheap:**
1. Phaser 2D top-down (Steps 1–2) → 2. react-three-fiber 3D god-game → 3. **painted 2.5D god-view, no avatar** (current), based on a reference screenshot. R3F and Phaser fully retired. The React UI overlays + Zustand store survived every pivot untouched — proof that keeping the engine layer thin and the UI/state engine-agnostic paid off.

**The camera was the hardest part — took 3 rounds.** Final working model (`src/scene/useCamera.ts`): contain-based min-zoom (whole realm + atmosphere frame) + ~130px pan overscan + a **single bleeding foreground layer**. Key lesson: **multi-layer parallax with mismatched layer sizes creates edge artifacts at zoom-out** — at full zoom-out the far/near layers drift apart and their edges float as junk. The fix was to collapse to one ground layer that bleeds well past the map (overflow:visible) and fades to dark forest. Don't reintroduce separate parallax layers for the placeholder.

**Honest constraint established & accepted by Sam:** Claude cannot author painterly art, and real-time 3D can't fake the painted look → scenes are **owner-supplied PNGs**; the engine just renders them. The placeholder is deliberately abstract, not painterly. Stating this upfront (rather than faking depth) is exactly what Sam wanted.

**What worked well — keep doing:**
- **Screenshot-paste feedback loop.** Sam pastes screenshots; I adjust. This was the ONLY working visual-verification channel (see gotchas). Lean on it; ask for a screenshot rather than assuming a visual is right.
- `tsc -b` + `vite build` green as the gate before reporting "done."
- `AskUserQuestion` for big forks (engine, camera angle, art fidelity, world layout) before building. Sam engages and makes real calls — surface the honest trade-offs in the options.
- Commit in logical chunks (one per milestone/fix).

**Environment gotchas (cost real time — avoid):**
- **The preview panel (`preview_start`) is broken on this machine.** It's anchored to the primary working dir `~/Desktop/Meta Back End Course/Visual Studio Files`, which is macOS-TCC-protected, and it tries to launch that dir's `serve.rb`. Reviving it needs a **Claude app restart** (so it has Desktop permission).
- **computer-use screenshots need Screen Recording granted to Claude AND an app restart to take effect** (macOS checks the grant once at launch).
- **The RPG dev server runs on `localhost:5199`** (`PORT=5199 npm run dev`), not the default 5173.
- **Do NOT kill `ruby .claude/serve.rb` on :8123** — that's Sam's *Meta Back End Course* static file server, unrelated to this project. I killed it once by mistake; restored it. Investigate unknown localhost processes before killing.

## Build journal — Pixel-art upgrade (Milestones A–C done; D needs art)
_Visual upgrade after Phase 1: retire the painted/SVG placeholder for 16-bit pixel art + animated sprites. Briefs: `PIXEL_WORLD_PROMPT.md`, `SPRITE_SPEC.md`, `SCENE_DATA_SHAPE.ts`._

**This is the 4th visual direction** (Phaser → R3F → painted 2.5D → pixel art). The pattern holds: each pivot only touched `src/scene/`; the store / dialogue / journal / Council / AgentEngine seam never moved. Keep the rendering layer thin and swappable.

**Done:**
- **A — pixel foundation:** `image-rendering: pixelated` everywhere (`.pixel-canvas`/`.pixel-img`); virtual resolution = scene ÷ PX. `PixelPlaceholder` draws the realm at low-res, scaled up crisp. `scene.layers[]` (owner PNGs) render if present, else placeholder.
- **B — sprites:** `Sprite.tsx` — animated character, waypoint wander, 4-dir facing, retro frame-step. Marker/ring/name/click intact.
- **C — depth:** `depth.ts` + Sprite — z-index = baseline Y (feet − elevation) y-sorts sprites against occluder layers (walk behind/in front); elevation lift; depth-scale; light rim glow. `SceneStage` = behind-layers / depth-container / light-layers.

**Pixel-specific lessons (don't relearn):**
- **Match the pixel grid:** ground virtual-pixel size MUST equal the sprite's (`PX = Sprite DRAW = 4` world-px/pixel) or ground blocks dwarf the character. First pass had PX=10 vs sprite 4 — looked broken.
- **The zoom-out void recurs with every backdrop.** Fix (again): fill the foreground edge-to-edge AND set `.scene-viewport` background to the same base colour so the scene rectangle blends. (Pixel version: flat grass + matching bg, no vignette circle.)
- **Per-instance `<canvas>` painted invisibly** (timing/StrictMode-ish). Lesson: **prefer declarative SVG/DOM over imperative canvas for per-element visuals that must reliably paint.** The placeholder sprite is now inline SVG.
- **Screen Recording WORKS now** (after Sam restarted Claude) → I can self-screenshot via computer-use (read tier: see, can't click). `open_application "Safari"` brings the app window forward. Preview MCP still broken; reloads rely on Vite HMR. Temporal effects (walk-behind) need a live watch, not a still.

## Parked tasks (persist here — task chips don't survive an app restart)
1. **★ Milestone D — assemble a real pixel scene (Sam is generating the art).** When art lands in `public/sprites/` + `public/scenes/` per `SPRITE_SPEC.md`: add `layers[]` (`_bg`/`_ground`/`_occ*` with `baseline`/`_light`) + per-character `sprite` fields to `src/data/scenes.ts`, then tune coords (`x,y`, occluder `baseline`, `elevationZones`, `lights`, `labelOffset`) by screenshot. Engine is ready — this is wiring + tuning, not new engine code. One set (e.g. the Keep + `elder.png`) is enough to start.
2. **Phase 2 — real agents.** Swap `MockAgentEngine` → a Claude-backed engine (one line in `src/agent/index.ts`). **Do not start until Sam says.**
