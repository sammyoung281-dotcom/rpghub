# State — 2026-09-11

## Working right now
- **The realm runs.** `PORT=5199 npm run dev` → http://localhost:5199
- Phase 1: playable world, painted/pixel scenes, dialogue, Journal, Council, decree quill, autosave.
- Phase 2: agentic substrate on mock brains, zero API cost. Orchestrator tick (`Advance the Realm`),
  message bus enforcing the org chart, task graph, risk matrix deciding who authorises what,
  peer verification, couriers flying messages across the world, Dispatches raven log.
- Headless sim is the real gate for agent logic: transpile `orchestrator.ts` to CJS into `/tmp/sim`,
  stub `localStorage`, drive it with a script. `tsc -b && vite build` is the gate for everything else.

## Half-built
- **Phase 3 (real Claude agents) — Step 1 barely started.** Brief written (`PHASE3_PROMPT.md`).
  Deps installed (`@anthropic-ai/sdk`, `express`, `dotenv`, `tsx`). `server/bootstrap.ts` (localStorage
  shim) and `server/.env.example` exist. **No `server/realm.ts`, no Express app, no `/tick` endpoint,
  no `ClaudeAgentEngine`, no debug window.** `src/agent/index.ts` has the runtime swap seam ready.
- **Milestone D (pixel scene assembly)** — engine ready, blocked on Sam-supplied art for any
  remaining scenes; core art already landed and is wired.

## Next action
- **Phase 3 Step 1:** `server/realm.ts` + Express on :5200 with `POST /tick` that proxies the existing
  MockAgentEngine and returns the actions. No AI yet. Prove the round trip, then show it running.
- Blocked on: Sam supplying an Anthropic API key with billing before Step 2. Step 1 needs no key.

## Known broken / risky
- Nothing uncommitted (cleared 2026-09-11 — Phase 2 landed in 6 commits on `master`, build green).
  Repo has **no remote**: all history is local only. A disk loss loses the project.
- `preview_start` MCP is broken on this Mac (anchored to the TCC-protected Desktop working dir).
  Visual verification = computer-use screenshots (read tier) + Sam pasting screenshots.
- **Do NOT kill `ruby .claude/serve.rb` on :8123** — that's Sam's Meta course server, unrelated.
- npm 11 blocks the esbuild postinstall; after any install run `npm approve-scripts esbuild`.
- `tsc` green proves nothing about agent behaviour — Phase 2 hid four serious bugs behind it.
- Stray empty `_probe_delete_test` in the repo root; safe to delete, not mine to decide.
