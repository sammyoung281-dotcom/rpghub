# Backlog

Parked work. Nothing here is in progress. Pull an item out only when it becomes the next action
in `STATE.md`.

## Next up
- **Phase 3 Steps 2–5** (after Step 1 lands and Sam has an API key with billing):
  2. `ClaudeAgentEngine`, Elder only, everyone else mock.
  3. Debug window on :5200 — Advance button, agent rows, message log, pending decisions, live £ spend,
     collapsible raw JSON per agent.
  4. All six agents real. Haiku for workers, Sonnet for Elder + guild leaders, model-per-character in one data file.
  5. One real tool (web search), with the permission gate proven to fire before the tool runs.
- **Commit the outstanding Phase 2 work** (risk matrix, couriers, TickControl, Dispatches) in logical chunks.

## Parked
- **Milestone D leftovers** — any scene still on placeholder art. Wiring is data-only:
  `layers[]` (`_bg`/`_ground`/`_occ*` + `baseline`/`_light`) and per-character `sprite` in
  `src/data/scenes.ts`, then tune `x,y`, occluder `baseline`, `elevationZones`, `lights`, `labelOffset`
  by screenshot. Engine is done; this is wiring + tuning.
- **The `move` AgentAction is a no-op.** Couriers read positions straight from `scene.hotspots`.
  Real agent movement would need it.
- **Mock ceiling.** 23 `INITIATIVE`s; with an engaged Chairman the realm is busy to ~turn 25 then
  goes honestly quiet. Add initiatives or let real agents remove the ceiling.
- **Monetisation read.** Not now. Revisit when real agents demonstrably do useful work —
  then get a blunt product / portfolio piece / learning exercise verdict.
- Delete the stray `_probe_delete_test` file.

## Explicitly not doing
- Claude Agent SDK (the orchestrator already owns the agent loop; it would fight it).
- Deployment, Docker, auth, multi-device sync.
- Any RPG world / sprite / scene change during Phase 3.
