import { useEffect } from "react";
import SceneStage from "./scene/SceneStage";
import DialogueBox from "./ui/DialogueBox";
import NeedsYouNow from "./ui/NeedsYouNow";
import Journal from "./ui/Journal";
import RealmMap from "./ui/RealmMap";
import Council from "./ui/Council";
import DecreeQuill from "./ui/DecreeQuill";
import QuestJuice from "./ui/QuestJuice";
import { useRealmStore } from "./store/useRealmStore";
import { CHARACTER_LIST } from "./data/characters";
import { agent } from "./agent";

export default function App() {
  const setJournalOpen = useRealmStore((s) => s.setJournalOpen);
  const setMapOpen = useRealmStore((s) => s.setMapOpen);
  const setCouncilOpen = useRealmStore((s) => s.setCouncilOpen);
  const setDecreeOpen = useRealmStore((s) => s.setDecreeOpen);
  const activeSceneId = useRealmStore((s) => s.activeSceneId);

  // ── Seed the realm from the AgentEngine ─────────────────────────────────────
  // Ask each character's (mock) brain for an opening quest. Each offered quest
  // becomes a proposal (→ a "!" over that character + a derived Needs You Now
  // entry). Skipped if a saved realm was just rehydrated from localStorage.
  // Phase 2 swaps `agent` for the real Claude engine; this loop is unchanged.
  useEffect(() => {
    const store = useRealmStore.getState();
    if (store.proposals.length || store.quests.length) return; // don't re-seed a saved realm
    for (const char of CHARACTER_LIST) {
      const quest = agent.proposeQuest(char);
      if (quest) store.offerQuest(quest);
    }
  }, []);
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <>
      <SceneStage key={activeSceneId} />
      <NeedsYouNow />
      <DialogueBox />
      <Journal />
      <RealmMap />
      <Council />
      <DecreeQuill />
      <QuestJuice />

      <div className="tool-rail">
        <button className="tome-btn" onClick={() => setDecreeOpen(true)} title="Decree a new task">
          🪶
          <span>Decree</span>
        </button>
        <button className="tome-btn" onClick={() => setCouncilOpen(true)} title="Hold council">
          ⚖️
          <span>Council</span>
        </button>
        <button className="tome-btn" onClick={() => setMapOpen(true)} title="Fast-travel">
          🗺️
          <span>Travel</span>
        </button>
        <button className="tome-btn" onClick={() => setJournalOpen(true)} title="Open the Journal">
          📖
          <span>Journal</span>
        </button>
      </div>

      <div className="hint">Drag/WASD to roam · scroll to zoom · click a character · 🪶 decree · ⚖️ council</div>
    </>
  );
}
