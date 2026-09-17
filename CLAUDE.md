# CLAUDE.md — The Realm of Endeavour (AI Agent RPG Hub)

Claude Code reads this file automatically. Keep it current. The full build brief lives in `BUILD_PROMPT.md` — read it for detail; this file is the always-on context.

## What this project is
A **local web app** styled as a top-down medieval-fantasy RPG that is secretly the owner's life/work command centre. "Characters" are AI agents covering side hustles, day job, personal admin, and self-improvement. The owner is the **Chairman** (in-world: the Sovereign). Characters bring quests, ask permission, and report back.

## Who I'm building for
Sam — runs change/ops at a fintech, building side hustles on the side. **ADHD.** Wants no fluff, honest limits stated early, and the *one thing that needs them now* made unmissable. Keep replies short and chunked.

## Session protocol — this is what makes "pick up any time" work

**At the start of every session, before anything else:**
1. Read `STATE.md`, `BACKLOG.md`, `DECISIONS.md`.
2. Give Sam exactly this: **where we are (2 lines max)** and **the single next action**.
3. Wait for confirm or redirect. Don't start a big change until he's said go.

**At the end of every session, or on "wrap up" / "save state":**
1. Overwrite `STATE.md` — it's a snapshot, not a log.
2. Add anything parked to `BACKLOG.md`.
3. Append any real decision, with the reason, to `DECISIONS.md`.
4. One line: what he'd need to remember if he disappeared for a month.

**Also update `STATE.md` mid-session** whenever a meaningful chunk finishes. Assume the laptop
closes without warning.

`STATE.md` sections: Working right now · Half-built · Next action · Known broken / risky.

## Priority: agents first, world second
**Primary: the automated agent ecosystem** — agents that perceive, decide, act, and persist state
without Sam driving each step. **Secondary: the world they live in**, which exists to give them
something to act on and to make the system watchable. The world is not the point on its own.
**If a session drifts into world-building, art, or polish while core agent behaviour is unproven,
say so and pull it back.**

## How to work with Sam
- Conversational. A collaborator, not a ticketing system.
- **No judgement of his level, ever.** Never flag what he "should" already know. Never quiz him.
- **Adapt to his level as observed.** Term used correctly ⇒ he knows it. Asks what something means ⇒
  explain plainly once and move on, no backfilling the topic. Clearly lost ⇒ drop an abstraction
  level without commenting on it.
- **One next step per response.** Not three options and a decision tree. Pick the best, give the
  reason in a line, do it. (Exception: genuine forks — use `AskUserQuestion` with honest trade-offs.
  Sam engages with those and makes real calls.)
- Action before context. Result first, explanation after, only if load-bearing.
- **Every instructive / how-to answer is a numbered, click-by-click walkthrough.** Whenever the
  answer is something Sam has to do himself — a website, an app, menus, buttons, Terminal — break it
  into numbered steps. Name the *exact* button / link / field and where it is on screen ("top-right,
  the ⚙ Settings tab"), give the URL to type into the address bar, put every command in a copy-paste
  block, and state what success looks like after each step so he knows it worked. Never hand-wave a
  UI path ("go to settings and enable it"), never assume he knows where a control lives, and flag the
  likely snag before it bites (e.g. "it won't show the password as you paste — that's normal"). This
  is the default for all instructions, not only when he asks for step-by-step.
- Minimal clarifying questions. Make a reasonable assumption, state it in one line, keep moving.
  Stop and ask only when getting it wrong would waste real work.
- No fluff, no ego-stroking, no "great question."
- If something isn't possible, say so immediately. If you don't know, say so — don't invent.
- Push back on bad ideas. Directly, briefly, with the reason.

## ADHD guardrails (working style — distinct from the on-screen rules below)
- Chunk work into pieces that finish inside one session. Nothing that only pays off in three sessions.
- Track progress visibly: what's done, what's next, nothing else.
- On a tangent: follow it briefly, then one line back — "parking that in BACKLOG.md — back to X."
- After a gap, don't recap everything. One-line state, one next action.
- **Prefer something running and ugly over something designed and theoretical.**

## Technical stance
- Stack decisions get made when they're forced, not upfront. When a choice is genuinely needed,
  pick one, give the one-line reason, note it in `DECISIONS.md`.
- Default to boring, well-documented tools over clever ones.
- Working locally beats deployed. Deployed beats scalable. Scalable is a later problem.
- **Every agent capability needs a way for Sam to watch it happen** — logs, console output, a simple
  UI, or drawn in the world. Invisible agent behaviour is unverifiable and demoralising.
- Keep the agent layer and the world layer separable. Agents must be testable with the world stubbed out.
- Mac. Give exact commands to paste, not descriptions of what to do.

## Monetisation reality check
The long-term aim is revenue. Don't bolt monetisation onto something that doesn't work yet. At a
milestone worth it, give a blunt read: **product, portfolio piece, or learning exercise?** All three
are fine answers — just say which.


## Phasing (do not skip ahead)
- **Phase 1 (done):** the playable world + game loop with mocked/scripted agents.
- **Phase 2 (done):** the **agentic substrate** — agents that hold tasks, message each other along the org chart, escalate, and ask permission. Still zero API cost: the mock brains drive it. Sam chose **orchestrator–worker (option A)**.
- **Phase 3 (current, Step 1 in progress):** a Node service + real Claude-backed agents behind the same `AgentEngine` interface. Brief: `PHASE3_PROMPT.md`. Steps 2+ **require an Anthropic API key with billing** — Step 1 (mock-proxy round trip) does not.

**Live status lives in `STATE.md`, not here.** This section is the shape of the plan; `STATE.md` is where we actually are.

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

## Build journal — Phase 2: the agentic substrate
_Sam picked **orchestrator–worker (A)** over a peer blackboard, substrate-first with the mock brain, and a manual tick with opt-in timer._

**The honest constraint stated up front and accepted:** a browser-only Vite app **cannot** run autonomous agents. No process persists when the tab closes, and an API key can't live in frontend code. So Phase 3 needs a small Node service; the RPG becomes a *viewer* onto it. Everything built in Phase 2 is deliberately backend-agnostic so that swap is additive.

**What exists now**
- `src/agent/bus.ts` — routing. The org chart is a HARD constraint: up/down your chain and sideways within a guild is fine; **cross-guild is refused and rerouted via the Elder**; only the Elder addresses the Chairman, except `permission`, which anyone may petition with. `canSend()` is pure, so mock and Claude engines obey identical rules.
- `src/agent/AgentEngine.ts` — the seam, rewritten. `step(ctx): Promise<AgentAction[]>`. **Agents return intents, never side effects.** That single decision buys interchangeable brains, replayable ticks, guardrails in one place, and the ability to refuse a misbehaving agent *before* it does damage.
- `src/agent/orchestrator.ts` — the world clock. Two passes per tick (down: Elder → leaders commission/delegate; up: workers act → leaders consolidate → Elder reports) so cause and effect land in the same turn. **Messages produced this tick are delivered next tick** — that's what keeps a turn finite and kills within-tick ping-pong. All budgets live in `LIMITS`.
- `src/agent/MockAgentEngine.ts` + `mockBehaviour.ts` — reactive scripted agents. Logic in the engine, all flavour/content in `mockBehaviour.ts` (`INITIATIVES`, `VOICE`).
- Store: `messages`, `permissions`, `bounces`, `tick`, `tickLog`, task-graph mutators. `Quest` is now a task-graph node (`assignedBy`, `dependsOn`, `threadId`, `visibility`, `progress`, `log`).
- UI: `TickControl` (Advance the Realm + opt-in timer + real pause/kill switch), `Dispatches` (the raven log — filter to/between, plus a rerouted-messages drawer). Permissions feed `NeedsYouNow` at top priority and open an approve/deny dialogue via `interactions.ts`.

**Bugs found by simulating 12 turns headlessly — all of them invisible to a typecheck:**
1. **Leaders re-offered the same quest every tick forever.** A leader can't see its own outbox, so a pending proposal looked like "nothing happening". Fix: `guildProposals` in `AgentContext`; an unanswered offer counts as open work.
2. **Permission nag loop.** The gate only checked *pending* permissions, so granting one made the agent immediately re-ask. Fix: check **decided** permissions too — approved ⇒ proceed, denied ⇒ block and stop. Gate now returns `AgentAction | "wait" | null`.
3. **Cross-guild script bleed.** `initiativeFor()` matched on title alone, so a forwarded aid request made the Scholars run the Merchants' entire launch script, £79 permission request and all. Fix: match on guild **and** title.
4. Phantom counts in the tick summary (deduped offers were counted as created) and double task creation on delegation.

**Lesson worth keeping: typecheck proves nothing about agent behaviour.** `tsc` was green through every one of the above. The headless harness (transpile `orchestrator.ts` to CJS into `/tmp/sim`, stub `localStorage`, copy `zustand`/`react` into `/tmp/sim/node_modules`, drive it with a script that auto-accepts everything) is the real gate for this layer. Rebuild it before touching agent logic.

**Where the mock runs out:** once every `INITIATIVE` is done the realm genuinely goes quiet (Elder reports, nothing else). That's honest, not broken — add initiatives or decree tasks. Real agents remove the ceiling.

## Build journal — the risk matrix (Sam's design, replaces "ask about everything")
_Sam's feedback after first running it: "Quests pop at the top and need to be attended to clear. Advancing the realm adds new quests."_

**What was actually wrong** (found by simulating a Chairman who ignores everything): the pile capped at 4, so it wasn't unbounded — but **an unanswered offer counted as its guild's open work, so every guild downed tools behind Sam's inbox.** By turn 5 only one character in the realm was still working. Advancing felt like it only added quests because everything else had jammed. Clearing each item also cost ~4 clicks (Attend → travel → Continue → Accept), against an ADHD rule of ≤ 2.

**Sam's model, which is better than the options offered:** a risk matrix ranks each action, and the rank picks who decides — some in council sessions, some independently with **verification from another agent**, individual approval only for high-risk-by-matrix and anything irreversible.

**`src/agent/risk.ts` — the single place that decides who decides.** `impact (1–4) × reversibility (1–3)`, plus cost and external-facing modifiers. Hard overrides that always win: **irreversible ⇒ Sovereign**, spend > `sovereignCost` (£25) ⇒ Sovereign, external-facing at impact ≥ 3 ⇒ Sovereign. Then bands: ≤3 routine · ≤6 verified · ≤9 council · above ⇒ sovereign; any spend at all is at least council.
- **routine** — the agent just does it.
- **verified** — a peer agent must endorse first. Sam never sees it.
- **council** — onto the docket, settled in a batch session in the Council panel.
- **sovereign** — Sam personally, on the scroll, one at a time.

**Key design rule: the agent supplies FACTS, the matrix assigns the band.** `PermissionAction` carries `factors`, never a band. An agent cannot talk its way into a lower tier, and `routeFor()` is pure so the mock and a real Claude engine are governed identically. `explainRoute()` produces the plain-English reason, surfaced everywhere — routing is never opaque.

**Peer verification** (`Verification`, `verify` message kind, `verify.request`/`verify.resolve` actions): verifier is a guild peer, else the leader, else the Elder — never yourself. An **objection does not let the agent proceed anyway**; it escalates to a human decision, which is the entire point of the check.

**Measured result, Chairman ignoring everything for 10 turns:** interruptions 4 → **2** (one irreversible migration, one quest offer), 2 decisions settled agent-to-agent, 2 waiting quietly on the docket, and **the realm keeps working throughout** (3–6 tasks in flight, 5 sealed) instead of stalling.

**Two further bugs the simulation caught:** an agent blocked on one task sat idle instead of working its others (`doWork` now walks past anything awaiting a ruling); and only interruptions are budget-capped — the council docket may grow freely, since it's a queue you choose to open rather than a thing shouting at you.

**Tuning:** all thresholds live in `RISK_CONFIG` in `src/agent/risk.ts`. Per-initiative `factors` live in `mockBehaviour.ts`. Changing who-decides-what is a data edit, not a code change.

## Parked tasks (persist here — task chips don't survive an app restart)

_Superseded by `BACKLOG.md` — keep new parked work there. Kept below for the history._
1. **★ Milestone D — assemble a real pixel scene (Sam is generating the art).** When art lands in `public/sprites/` + `public/scenes/` per `SPRITE_SPEC.md`: add `layers[]` (`_bg`/`_ground`/`_occ*` with `baseline`/`_light`) + per-character `sprite` fields to `src/data/scenes.ts`, then tune coords (`x,y`, occluder `baseline`, `elevationZones`, `lights`, `labelOffset`) by screenshot. Engine is ready — this is wiring + tuning, not new engine code.
2. ~~**Couriers in the world.**~~ **DONE.** `src/scene/Couriers.tsx` draws every message flying sender → recipient inside the depth layer (arcing flight, kind-coloured tag, staggered 260ms so a burst reads as a flock). Sam's complaint "I ran it but nothing has happened" was accurate and the diagnosis was: it worked fine, but *the world never showed any of it* — all the action lived in panels. Lesson: for this project, agent state that isn't drawn in the world doesn't count as built. The `move` AgentAction is still a no-op (couriers read positions straight from `scene.hotspots`). Couriers only appear on the `realm` overworld, since guild-hall interiors contain a single character. The Chairman's "position" is the Keep door.
3. ~~**Top up the initiatives.**~~ **DONE.** 23 `INITIATIVE`s now (was 9), mapped to Sam's real domains. Measured over 30 turns with an engaged Chairman: **28 tasks sealed, 85 messages, busy through ~turn 25** (was 10 tasks, quiet from turn 10). Also added `dependsOnTitle` so the leader links `dependsOn` when commissioning — the task graph is finally exercised rather than dead code. And the realm now **says when it runs dry**: `realmIdle` in `AgentContext` → the Elder sends the `IDLE_SUBJECT` notice once (never repeated), and `NeedsYouNow` shows "The realm awaits your word" with a one-click Decree button. A silent idle realm reads as broken — that was the exact failure Sam hit.
4. **Phase 3 — real agents.** Node service + `ClaudeAgentEngine` (one line in `src/agent/index.ts`). Blocked on Sam getting an Anthropic API key. **Do not start until Sam says.**
