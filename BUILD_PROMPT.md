# 🏰 BUILD BRIEF — "The Realm of Endeavour" (AI Agent RPG Hub)

> Paste this whole file into Claude Code as the opening brief. Build **Phase 1 only** unless I say otherwise. Stop and show me a running screen as early as possible.

---

## 0. TL;DR (read this, then the rest)

Build a **local web app** that looks and feels like a top-down medieval fantasy RPG. It is secretly my personal command centre. Each "character" is an AI agent that handles a area of my life (side hustles, my job, personal admin, self-improvement). I am the **Chairman** — characters bring me quests, ask permission, and report back.

**Phase 1 = the world + the game loop, with FAKE agent actions** (scripted/mocked). Real Claude-powered agents come in Phase 2. Do not try to build live AI execution yet. Get a beautiful, working, clickable world on screen first.

Stack: **React + Vite + Phaser 3** (top-down movement & tilemaps) + **Zustand** (state) + **localStorage/JSON** (save data). No backend, no accounts, runs on `npm run dev`.

---

## 1. Why I'm building this (context — don't lose this)

I run change/ops at a fintech by day and I'm building side hustles by night. My brain is **ADHD** — I lose track of open loops, I avoid walls of text, and I need the *one thing that needs me right now* shoved in my face. A boring task list doesn't stick. A game does.

So the whole point: **turn my scattered responsibilities into characters in a kingdom I can see.** When something needs my decision, a character should literally walk up with a `!` over their head.

---

## 2. ADHD-friendly design rules (NON-NEGOTIABLE — apply to every screen)

These are requirements, not nice-to-haves. If a feature breaks one of these, redesign it.

1. **"Needs You Now" is always visible.** A persistent banner/panel (styled as a royal proclamation scroll) shows the *single most urgent action waiting on me*. One action. Big. Unmissable.
2. **No walls of text.** Dialogue and reports are chunked into short scrolls of ≤ 2 sentences with a "Continue ▸" press. Never dump a paragraph.
3. **Colour-coded urgency** everywhere: 🟥 Needs me now · 🟨 In progress · 🟩 Done/idle · ⬜ Not started. Use these consistently.
4. **One decision at a time.** Accept/decline a quest, approve/deny a permission — always a clear binary or small set of big buttons. Never a form with 8 fields.
5. **Instant dopamine.** Completing a quest = satisfying feedback: sound, coin/XP burst, a little fanfare, the journal entry getting a wax "SEALED" stamp. Make finishing feel good.
6. **Object permanence aids.** Nothing important lives only in a menu I have to remember to open. Open loops float in the world (quest markers) or on the proclamation scroll.
7. **Low-friction capture.** I can hand a character a new task in ≤ 2 clicks from anywhere. A floating "Decree a new task" quill button.
8. **Forgiving.** Everything autosaves. No "are you sure" friction on small stuff. Easy undo.
9. **Calm default view, detail on demand.** The map is uncluttered; I drill into a council or character only when I choose to.

---

## 3. The world & its structure (medieval fantasy theme throughout)

The app is a kingdom called **The Realm of Endeavour**. I am **the Chairman** (in-world title: *the Sovereign* / *Lord Chairman*). Everything uses fantasy language but maps to real function.

### Physical spaces (separate but connected — the player/camera travels between them)

- **The High Keep** — home of the **High Council**, led by **the Elder** (the most senior agent). This is my throne room hub. The Elder gives me the top-level cross-realm report.
- **Guild Halls / Lower Councils** — one connected building per area of my life. Each has its own **leader** and its own personality and décor. Starting guilds:
  - 🪙 **The Merchant's Guild** — side hustles / making money (app & game launches, testing, refining).
  - ⚙️ **The Order of the Ledger** — my day job (change & ops work).
  - 🛡️ **The Hearthkeepers** — personal admin & life tasks.
  - 📜 **The Scholars' Tower** — self-improvement / learning.
- Spaces are linked by paths/doors. Moving between them should feel like walking through a connected map, not switching tabs (though a fast-travel map is fine as an ADHD shortcut).

### The characters (agents)

Each character is a sprite that walks around its space doing little animations that **represent their real work** (e.g. the Merchant tending a market stall = working on a hustle; hammering at an anvil = building; pacing = blocked/waiting on me). Every character has:

- A **name, title, portrait, and distinct personality** (write these — make them characterful and fun).
- A **role** (what real-life domain they own).
- A **status** (idle / working / blocked-needs-me / reporting).
- A **responsibility/authority level** I set (see §5).

Give me a sensible starting cast: **the Elder** + each guild leader + 1–2 worker characters per guild. Write their personalities; don't make them generic.

---

## 4. Core game loop / features (Phase 1)

### Quests
- Characters generate **quests** (tasks). A new quest appears as a `!` floating above the character's head.
- I click the character → a **dialogue box** opens (styled parchment) → it offers the quest in chunked text → I **Accept** or **Decline** (big buttons).
- Accepted quests are written into **The Journal** (a quest log book UI) with status, the character who owns it, and the guild.
- Quests can become **blocked** — when a character needs *me* to unblock something or take an action, they show a `!` again and surface on the **Needs You Now** scroll.
- Completing a quest = dopamine feedback (§2.5) + a sealed journal entry.

### Giving characters information / tasks
- I can **decree a new task** to any character: a quick dialogue where I type/paste the info they need ("here's the brief"). ≤ 2 clicks to start.
- Characters can **ask me clarifying questions** via dialogue boxes (in Phase 1 these are scripted/mock; the structure must exist for Phase 2 to fill with real AI).

### Dialogue system
- Reusable **parchment dialogue box** component: portrait + name + chunked text + 1–3 big choice buttons. Used for quests, questions, reports, permissions. This is the backbone — build it well and reuse it.

### Councils & reports
- **The Elder** delivers a **realm-wide report** to me (high-level roll-up across all guilds): what's done, what's in progress, what's blocked on me.
- Each **guild leader** delivers a **detailed report** for their domain.
- Reports are chunked, skimmable, colour-coded. A "Hold council" button summons the relevant report.

### The Journal (quest log)
- A book UI listing all quests grouped by guild, filterable by status, with the urgent ones pinned top. This is my single source of truth for open loops.

### Persistence
- Everything (characters, quests, journal, authority levels, positions) autosaves to localStorage as JSON. Survives refresh. Include an export/import-to-file option so I can back up my realm.

---

## 5. Authority / permission system (I am Chairman)

I delegate trust per character. Build a simple **authority level** setting on each character:

- **Level 1 — Petitioner:** must ask me before *every* action (everything comes as a quest to approve).
- **Level 2 — Trusted:** acts on routine things, only asks me for big/risky/ambiguous decisions.
- **Level 3 — Steward:** acts freely in its domain, reports after the fact, only escalates true blockers.

In Phase 1 this just changes how chatty the (mock) character is and how much shows up on my proclamation scroll. The data model must support it cleanly so Phase 2 can enforce it for real agent actions.

Reporting chain: workers report to their **guild leader**, guild leaders report to **the Elder**, the Elder reports to **me**. Reflect this in the UI.

---

## 6. Visual / art direction

- Top-down 16-bit SNES-era RPG aesthetic (think classic tile-based fantasy RPGs). Cosy, readable, not grimdark.
- Use **free/CC0 placeholder assets** (e.g. Kenney.nl top-down packs) or simple generated tiles/sprites so it runs immediately. Note clearly in the README where to swap in nicer art later. Do not block the build waiting on art.
- UI chrome = parchment, wax seals, ornate but **legible** borders. Readability beats decoration (ADHD rule).
- Juicy feedback: gentle sounds, particle bursts on completion. Keep it tasteful and skippable.

---

## 7. Tech & build instructions for you (Claude Code)

- Scaffold with **Vite + React + TypeScript**. Use **Phaser 3** for the world/movement/sprites, React for UI overlays (dialogue, journal, scrolls, menus). Bridge them with an event bus + **Zustand** store as the single source of truth.
- Keep state **data-driven**: characters, guilds, quests, authority levels all defined in typed config/JSON so I can add a new guild or character by editing data, not code.
- **Stub the agent brain behind a clean interface** (e.g. `AgentEngine` with `proposeQuest()`, `askQuestion()`, `doWork()`, `report()`). Phase 1 returns scripted/mock data; Phase 2 swaps in real Claude API calls behind the same interface. Make this seam obvious.
- Structure the repo cleanly, comment the non-obvious bits, and write a **README** covering: how to run it, the architecture, where the agent stub lives, how to add a guild/character, and where to swap art.
- Commit in logical chunks.

### Build order (do it in this sequence and SHOW ME each milestone running)
1. Scaffold + a single walkable room with a controllable camera/character. *Show me.*
2. The parchment **dialogue box** component + **Needs You Now** scroll. *Show me.*
3. One guild (the Merchant's Guild) with a leader character, `!` quest markers, accept/decline → **Journal**. *Show me.*
4. Multiple connected spaces (High Keep + guilds) with travel between them. *Show me.*
5. The Elder + guild-leader **reports**, **authority levels**, **decree-a-task** flow, persistence, juice. *Show me.*

Do NOT build all five silently then reveal a giant blob. Stop at each milestone.

---

## 8. Out of scope for Phase 1 (note them, don't build them)

Real Claude API agent execution; real integrations (email, Slack, app stores, my job's tools); multi-device sync; auth. Leave clean seams (especially the `AgentEngine` interface and the authority model) so Phase 2 can wire these in without a rewrite. If something here genuinely can't work the way I described, **tell me immediately** rather than faking it deeper.

---

## 9. First reply I want from you (Claude Code)

Before coding: give me a short plan — folder structure, the data model for characters/guilds/quests/authority, and the `AgentEngine` interface. Then start at build step 1. Keep your messages short and skimmable (I'm ADHD — chunk it).
