# State — 2026-09-17

## Working right now
- **Shipping to GitHub Pages for an engineering apprenticeship application (deadline: next day).**
  Repo: https://github.com/sammyoung281-dotcom/rpghub (branch `main`). Code pushed.
- Phase 1 (playable world) + Phase 2 (agentic substrate on mock brains) run with zero API cost.
- The demo that goes live is Phases 1–2. Phase 3 (real Claude agents) is not part of the deployed site.

## Half-built
- **GitHub Pages deploy in progress.** Done: `base: "./"` in vite.config, `src/asset.ts` helper
  (routes every scene/sprite URL through `import.meta.env.BASE_URL` so images load under `/rpghub/`
  instead of 404ing), wired into `SceneStage.tsx` + `Sprite.tsx`, `src/vite-env.d.ts`, `.nojekyll`,
  and `.github/workflows/deploy.yml` (node 20, npm ci, vite build, deploy-pages). Remaining: Sam
  toggles Settings → Pages → Source: GitHub Actions, then verify the LIVE site renders sprites.
- **README rewritten** as a reviewer-facing doc (what it demonstrates as engineering). Needs a real
  screenshot dropped into `docs/screenshot.png` — capture from the live site and commit.
- **Phase 3 (real Claude agents) — Step 1 barely started** (unchanged; not part of the apprenticeship push).

## Next action
- After Sam enables Pages + the Actions run goes green: open the live URL, screenshot it, confirm
  sprites load (the whole point of the `asset()` fix), judge the visual, save the shot to
  `docs/screenshot.png`, and fix anything off before the application is sent.

## Known broken / risky
- **The sandbox can't build or run this project** (npm registry blocked → missing platform rollup/
  esbuild binaries). Verification of the build happens on Sam's Mac or in GitHub Actions, not here.
- `_probe_delete_test` (empty stray file) got committed in the ship commit — harmless, tidy up later
  (`git rm _probe_delete_test`). The sandbox can't delete it (connected-folder writes to it are blocked).
- HTTPS pushes need a PAT with **both `repo` and `workflow`** scopes (workflow scope is required to
  push `.github/workflows/*`). Learned the hard way this session.
- `preview_start` MCP still broken on this Mac; Chrome is granted at read tier (view only).
- Do NOT kill `ruby .claude/serve.rb` on :8123 — Sam's unrelated Meta course server.
