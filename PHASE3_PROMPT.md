# Phase 3 brief — real Claude agents behind the existing seam

> Paste this whole file to Claude Code from inside the repo root.

## Read first

Read `CLAUDE.md` end to end before writing anything, especially the build journals.
Phases 1 and 2 are done. This is Phase 3. The important context:

- `src/agent/AgentEngine.ts` is the seam. `step(ctx: AgentContext): Promise<AgentAction[]>`.
- **Agents return intents, never side effects.** The orchestrator validates and applies them.
- `src/agent/orchestrator.ts` is the world clock and owns every guardrail.
- `src/agent/bus.ts` enforces the org chart. `src/agent/risk.ts` decides who authorises what.
- `src/agent/MockAgentEngine.ts` is the current brain. It stays — it is the free fallback
  and the reference implementation. Do not delete it.

## Goal

A Node service that runs **real Claude-backed agents** behind that exact seam, plus a
**minimal debug window** to prove they work. Nothing about the RPG world changes yet.

I want to answer one question: *do real agents behave sensibly inside the rules we built?*
Not: *does it look good?* Deliberately keep this ugly.

## Hard constraints — do not negotiate these

1. **The API key never touches frontend code.** It lives in `server/.env`, read only by the
   Node process. Add `.env` to `.gitignore`. If the browser could ever see it, you did it wrong.
2. **Use the plain Messages API (`@anthropic-ai/sdk`), NOT the Claude Agent SDK.** Our
   orchestrator already owns the agent loop; the Agent SDK would fight it. One API call per
   agent per tick.
3. **The risk matrix stays authoritative.** An agent supplies `factors` (impact,
   reversibility, cost, external). It does NOT get to choose its own band. `routeFor()` in
   `risk.ts` decides. If a model tries to return a band, drop it.
4. **The bus stays authoritative.** Validate every `send` through `canSend()`. A model that
   tries to message across guilds gets rerouted via the Elder exactly as the mock does.
5. **Actions as data.** The model returns JSON matching `AgentAction[]`. Validate it against
   a schema before it reaches the store. Malformed output = log it, skip that agent's turn,
   do not crash the tick.
6. **Cost guardrails before features.** Per-tick token budget, a hard monthly ceiling read
   from env, a live spend counter, and a kill switch that halts everything. I want to see
   the running cost in the window at all times.
7. **Prompt caching on the static parts** (persona, world rules, org chart) from the start.

## Build it in this order, and show me a running screen at each step

**Step 1 — the service skeleton.**
`server/` — Express (or Hono), one endpoint `POST /tick` that currently just proxies to the
existing mock engine and returns the actions. Prove the round trip works end to end before
any AI is involved. Show me it running.

**Step 2 — one real agent.**
`ClaudeAgentEngine` implementing `AgentEngine`. Wire up ONLY the Elder to Claude; everyone
else stays mock. Persona and role come from `src/data/characters.ts` — the `personality` and
`role` fields are already written for this. Show me the Elder's first real report.

**Step 3 — the debug window.**
A dead-simple page (plain HTML + a bit of JS is fine, no need to touch the React app) at
`localhost:5200` showing:
- a big **Advance** button
- every agent as a row: name, current task, status
- the message log, newest first, showing sender → recipient and kind
- pending decisions split into sovereign / council / peer-verification
- **tokens and £ spent this session**, updating per tick
- the raw JSON each agent returned, collapsible — I want to see what the model actually said

**Step 4 — all six agents real.**
Haiku for workers, Sonnet for the Elder and guild leaders. Make the model per-character
configurable in one data file.

**Step 5 — one real tool.**
Give exactly one agent one real capability (web search is the obvious first). Everything
else stays talk. Prove the permission gate fires before the tool runs.

## Verification — this is not optional

`tsc` passing proves nothing about agent behaviour. Phase 2 found four serious bugs that
were all invisible to a typecheck. Before you tell me anything works:

- Rebuild the headless harness described in `CLAUDE.md` and run **20 turns** against the
  real engine with a small budget cap.
- Report: total spend, messages by kind, tasks completed, how many decisions reached the
  Chairman, and any agent that looped, stalled, or produced invalid JSON.
- Specifically check the failure modes the mock hit: re-offering the same work every tick,
  re-asking for permission after it was granted, one guild's script bleeding into another,
  and agents idling while blocked on a single task.

## Out of scope — do not build

- Any change to the RPG world, sprites, scenes, or couriers.
- Multi-device sync, auth, deployment, Docker.
- The Claude Agent SDK.
- Replacing `MockAgentEngine` — it stays as the zero-cost fallback, switchable at runtime.

## Tell me honestly

If any of the above can't work the way I've described it, say so immediately rather than
building around it. If real agents turn out to need a different context shape than
`AgentContext` provides, tell me what's missing before you change the seam.
