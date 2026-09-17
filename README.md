# 🏰 The Realm of Endeavour

A browser RPG that is secretly a personal command centre. Every "character" is an
AI agent responsible for a slice of real life — side hustles, the day job, admin,
learning — and you play the Sovereign who commissions their work, approves the
risky calls, and reads their reports. The medieval fantasy is the interface; a
small multi-agent system is the engine underneath.

**▶ Live demo:** https://sammyoung281-dotcom.github.io/rpghub/
&nbsp;·&nbsp; built with Vite + React + TypeScript, deployed automatically to GitHub Pages.

<!-- Add a screenshot: save one to docs/screenshot.png and it shows here. -->
![The Realm of Endeavour](docs/screenshot.png)

---

## What it is

You open onto a painted overworld where six characters mill around their guild
halls. Click a building to walk into its interior; click a character to talk.
When an agent has something for you, a quest marker (`!`) floats over its head and
the urgent one is pinned to a **"Needs You Now"** scroll so it is never buried.
Accept a quest and it lands in the **Journal**; complete one and you get a burst of
feedback and a sealed entry.

Behind the scenes the agents run on a scripted "mock brain" — there is **no API
cost and no key required** to run the whole thing. Every turn ("Advance the
Realm") the agents commission work down the chain of command, act on it, verify
each other, escalate anything risky to you, and report back up. The interface was
built with an ADHD user in mind: one urgent thing at a time, big buttons, colour-
coded urgency, low-friction capture, instant feedback.

## What this project demonstrates

This started as a personal tool, but it is deliberately built to show engineering
practice rather than just "a thing that works":

- **Interface seams over rewrites.** The world talks to agents through one
  `AgentEngine` interface (`step(ctx) → AgentAction[]`). Agents return *intents*,
  never side effects — so a mock brain and a real Claude brain are drop-in
  interchangeable, and misbehaving agents can be refused before they act.
- **Pure decision logic, so it is testable.** Who is allowed to message whom
  (`bus.ts`) and who must authorise an action (`risk.ts`, an impact × reversibility
  matrix) are pure functions. The same rules govern the mock and any future real
  engine identically.
- **The build is gated by simulation, not just types.** Agent behaviour is proven
  by running the orchestrator headlessly for dozens of turns — a typecheck passing
  says nothing about whether the agents deadlock. Several real bugs (nag loops,
  cross-agent script bleed, stalled realms) were caught this way.
- **Data-driven content.** Adding a guild or character is editing typed data
  (`src/data/*`), not touching the engine.
- **The rendering layer is thin and swappable.** The visual approach was rebuilt
  several times (2D → 3D → painted 2.5D); each pivot only touched `src/scene/`, and
  the state store, UI overlays, and agent seam never moved.
- **Honest constraints, stated early.** A browser-only app cannot run autonomous
  agents or hold an API key safely — so the real-agent work is scoped to a small
  Node service the RPG becomes a viewer onto, and everything else is built to make
  that swap additive rather than a rewrite.

## The world (and what it maps to)

| In-world | Real function | Led by |
|---|---|---|
| 🏰 The High Keep | The roll-up view / your hub | Maeve, the Elder |
| 🪙 The Merchant's Guild | Side hustles — building & launching apps | Brannock (with Tasha) |
| ⚙️ The Order of the Ledger | The day job — change & ops | Edmund |
| 🛡️ The Hearthkeepers | Personal admin & life tasks | Wren |
| 📜 The Scholars' Tower | Self-improvement & learning | Lyra |

Reporting runs **workers → guild leader → Elder → Sovereign**. Each agent has an
authority level — *Petitioner* (asks before acting), *Trusted* (acts on routine,
asks on risk), *Steward* (acts freely, reports after) — enforced as real data so
the rule is the same whether a mock or a real agent is driving.

## Run it locally

```bash
npm install
npm run dev        # → http://localhost:5199
```

Build the production bundle:

```bash
npm run build      # tsc -b && vite build → dist/
npm run preview    # serve the built bundle locally
```

No environment variables, no backend, no account. State autosaves to
`localStorage`; there is JSON export/import for portability.

## Architecture

```
src/
  scene/       The painted 2.5D world in plain React/DOM (no game engine)
    SceneStage.tsx   viewport: parallax layers, doors, depth-sorted sprites, camera
    Sprite.tsx       sheet-animated character (facing, walk cycle, feet-anchored)
    useCamera.ts      god-camera — pan (WASD/drag), zoom (wheel), smooth glide
    Couriers.tsx      draws every agent message flying between senders
  ui/          React overlays — DialogueBox, NeedsYouNow, Journal, Council,
               DecreeQuill, Dispatches, TickControl, QuestJuice
  agent/       The multi-agent substrate
    AgentEngine.ts    the seam: step(ctx) → AgentAction[]
    MockAgentEngine.ts + mockBehaviour.ts   scripted brains (logic vs. flavour)
    orchestrator.ts   the world clock — two passes per tick, finite turns
    bus.ts            org-chart routing rules (pure)
    risk.ts           who-authorises-what matrix (pure)
    index.ts          the runtime swap point (mock ↔ real engine)
  data/        Typed content — characters, guilds, scenes, dialogue
  store/        Zustand store — single source of truth
  types.ts      Core domain types + the urgency colour system
```

## Tech stack

**Vite · React · TypeScript · Zustand.** The 2.5D world is plain React/DOM —
parallax layers, a free pan/zoom god-camera, painterly PNG scenes with
sheet-animated characters — no game engine. Persistence is `localStorage` + JSON.
Deployment is a GitHub Actions workflow that builds and publishes to GitHub Pages
on every push.

## Roadmap

- **Phase 1 — the playable world + game loop (done).** Clickable realm, dialogue,
  quests, Journal, Council, decrees, autosave.
- **Phase 2 — the agentic substrate (done).** Agents hold tasks, message along the
  org chart, escalate, verify each other, and ask permission — all on the mock
  brain, zero API cost.
- **Phase 3 — real Claude-backed agents (in progress).** A small Node service
  behind the same `AgentEngine` interface. The deployed demo runs Phases 1–2.

> The live demo is the world running on scripted agents — fully interactive, no AI
> calls. It is a portfolio piece and a working personal tool, not a shipped product.
