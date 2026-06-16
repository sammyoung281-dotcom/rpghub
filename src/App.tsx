import { useEffect } from "react";
import SceneStage from "./scene/SceneStage";
import DialogueBox from "./ui/DialogueBox";
import NeedsYouNow from "./ui/NeedsYouNow";
import Journal from "./ui/Journal";
import { useRealmStore } from "./store/useRealmStore";
import { SCENES, STARTING_SCENE } from "./data/scenes";
import { summonCharacter } from "./scene/interactions";
import { CHARACTER_LIST } from "./data/characters";
import { agent } from "./agent";

export default function App() {
  const setJournalOpen = useRealmStore((s) => s.setJournalOpen);

  // ── Seed the realm from the AgentEngine ─────────────────────────────────────
  // Ask each character's (mock) brain for an opening quest. Each offered quest
  // becomes a proposal (→ a "!" over that character) plus a Needs You Now entry.
  // Phase 2 swaps `agent` for the real Claude engine; this loop is unchanged.
  useEffect(() => {
    const store = useRealmStore.getState();
    if (store.proposals.length || store.quests.length) return; // don't re-seed
    const scene = SCENES[STARTING_SCENE];
    for (const char of CHARACTER_LIST) {
      const quest = agent.proposeQuest(char);
      if (!quest) continue;
      store.offerQuest(quest);
      store.addNeed({
        id: `need-${char.id}`,
        title: quest.title,
        detail: `${char.portrait} ${char.name} awaits your decision`,
        ownerId: char.id,
        guildId: char.guildId,
        priority: 100,
        onAct: () => summonCharacter(scene, char.id),
      });
    }
  }, []);
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <>
      <SceneStage />
      <NeedsYouNow />
      <DialogueBox />
      <Journal />

      <button className="tome-btn" onClick={() => setJournalOpen(true)} title="Open the Journal">
        📖
        <span>Journal</span>
      </button>

      <div className="hint">Drag or WASD to roam · scroll to zoom · click a character</div>
    </>
  );
}
