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
Vite + React + TypeScript · **react-three-fiber + three.js + drei** for the 3D world/movement/models · React for UI overlays (dialogue, journal, scrolls) · **Zustand** as single source of truth · localStorage/JSON persistence (with file export/import). No backend, no auth. Runs on `npm run dev`.

## Visual style (decided)
Late-90s **top-down god-game** in 3D (think **Black & White / Populous: The Beginning**), NOT 2D pixel art. Tilted 3/4 camera (~52°) that trails the Sovereign and orbits with Q/E. Cosy "Black & White" mood — warm sun, soft shadows, rounded low-poly buildings, lush grass. "Higher bit-rate" = 90s low-poly silhouettes with modern rendering (soft shadows, fog, AO-ish lighting). All geometry currently procedural (no asset files) so it runs instantly; swap in CC0 low-poly GLTF (Kenney.nl / Quaternius) later.

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
