# Decisions

Append-only. Newest at the bottom. A decision goes here only if reversing it would cost real work.

---

## The five spec questions — answered by existing code, not by a fresh spec
_Recorded 2026-09-11. The "agent architecture is undefined" premise was out of date: `src/agent/`
already answers all five. Written down here so it stops being tribal knowledge._

**1. What is a single agent?**
A character with a `role`, `personality`, `guild`, an `authority` level, and a place in the org chart.
It **perceives** an `AgentContext` — itself, the tick number, its unread inbox, tasks it owns, its
guild's tasks (leaders only), offers already pending with the Chairman, its subordinates, and whether
the realm has gone idle. It **decides** by returning `AgentAction[]` from `step(ctx)`. It **acts** never —
it returns intents and the orchestrator applies them.
_Why:_ actions-as-data makes mock and real brains interchangeable, every tick replayable, guardrails
single-sited, and a misbehaving agent refusable *before* it does damage.

**2. What drives decisions?**
A mix, deliberately. `MockAgentEngine` (scripted, free, permanent fallback) today;
`ClaudeAgentEngine` (one Messages API call per agent per tick) in Phase 3, behind the same seam and
switchable at runtime. Cost is the reason for the split — the mock is the zero-cost reference
implementation and stays forever.

**3. What persists between ticks?**
The Zustand store, via localStorage: `tick`, tasks (a real task graph — `assignedBy`, `dependsOn`,
`threadId`, `visibility`, `progress`, `log`), `messages`, `permissions`, `bounces`, `tickLog`.
Messages produced this tick are delivered **next** tick — that's what keeps a turn finite.
In Phase 3 the Node service holds the same state; the RPG becomes a viewer onto it.

**4. Smallest demo that means "the ecosystem works"?**
Real Claude-backed agents surviving **20 headless turns** inside the existing rules: no re-offering
the same work, no re-asking granted permissions, no cross-guild script bleed, no idling while blocked,
no invalid JSON — with total spend, messages by kind, tasks sealed, and interruptions-to-Chairman
all reported. That is Phase 3's verification section, and it is the bar.

**5. World's minimum surface area for that demo?**
Zero. The debug window on :5200 is the demo surface. The RPG world is deliberately untouched during
Phase 3.

---

## Prior decisions, reconstructed from the build journals

**Visual direction: pixel art (4th and current).** Phaser 2D → react-three-fiber 3D → painted 2.5D →
16-bit pixel art. Each pivot only touched `src/scene/`; the store, UI overlays and agent seam never moved.
_Why it was cheap:_ keep the rendering layer thin and swappable. Keep it that way.

**Claude does not author the art — Sam supplies it.** Stated up front rather than faked.
Real-time 3D can't imitate a painted look, and placeholders are deliberately abstract, not painterly.

**Declarative SVG/DOM over imperative canvas** for per-element visuals. Per-instance `<canvas>` painted
invisibly (timing/StrictMode). Canvas only for one big surface.

**Orchestrator–worker over a peer blackboard** (Sam's call). Substrate first with the mock brain,
manual tick with an opt-in timer.

**A browser-only Vite app cannot run autonomous agents.** No process survives the tab closing and an
API key cannot live in frontend code. Hence a Node service in Phase 3, with everything in Phase 2
built backend-agnostic so the swap is additive.

**The org chart is a hard constraint, enforced in `bus.ts`.** Up/down your chain and sideways within a
guild is fine; cross-guild is refused and rerouted via the Elder; only the Elder addresses the Chairman,
except `permission`, which anyone may petition with. `canSend()` is pure, so every brain obeys it identically.

**The risk matrix decides who decides — not the agent** (`src/agent/risk.ts`, Sam's design, better than
the options offered). `impact (1–4) × reversibility (1–3)` plus cost and external-facing modifiers.
Hard overrides always win: irreversible ⇒ Sovereign; spend > £25 ⇒ Sovereign; external-facing at
impact ≥ 3 ⇒ Sovereign. Bands: ≤3 routine · ≤6 verified (peer endorses, Sam never sees it) ·
≤9 council (batched docket) · above ⇒ sovereign (Sam, one at a time). Any spend at all is at least council.
**The agent supplies facts, the matrix assigns the band** — an agent cannot talk its way into a lower tier.
_Measured:_ Chairman ignoring everything for 10 turns → interruptions 4 → 2, and the realm keeps working.
Tuning lives in `RISK_CONFIG`; changing who-decides-what is a data edit.

**Peer objection escalates to a human — it does not let the agent proceed.** That's the whole point of the check.

**A typecheck proves nothing about agent behaviour.** `tsc` was green through four serious Phase 2 bugs.
The headless simulation harness is the gate for the agent layer. Rebuild it before touching agent logic.

**Agent state that isn't drawn in the world doesn't count as built.** Sam ran it and said "nothing has
happened" — it worked fine, but all the action lived in panels. Hence couriers. Same reason the realm
now announces when it runs dry instead of going silently quiet.

**Phase 3 uses the plain Messages API, not the Claude Agent SDK.** The orchestrator already owns the
agent loop; the Agent SDK would fight it.

**`MockAgentEngine` is never deleted.** It's the zero-cost fallback and the reference implementation.
