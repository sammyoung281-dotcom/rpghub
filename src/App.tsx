import { useEffect } from "react";
import SceneStage from "./scene/SceneStage";
import DialogueBox from "./ui/DialogueBox";
import NeedsYouNow from "./ui/NeedsYouNow";
import Journal from "./ui/Journal";
import RealmMap from "./ui/RealmMap";
import Council from "./ui/Council";
import DecreeQuill from "./ui/DecreeQuill";
import QuestJuice from "./ui/QuestJuice";
import TickControl from "./ui/TickControl";
import Dispatches from "./ui/Dispatches";
import { useRealmStore } from "./store/useRealmStore";
import { runTick, syncAutoTick } from "./agent/orchestrator";

export default function App() {
  const setJournalOpen = useRealmStore((s) => s.setJournalOpen);
  const setMapOpen = useRealmStore((s) => s.setMapOpen);
  const setCouncilOpen = useRealmStore((s) => s.setCouncilOpen);
  const setDecreeOpen = useRealmStore((s) => s.setDecreeOpen);
  const setDispatchesOpen = useRealmStore((s) => s.setDispatchesOpen);
  const activeSceneId = useRealmStore((s) => s.activeSceneId);
  const setActiveScene = useRealmStore((s) => s.setActiveScene);

  // ── Wake the realm ──────────────────────────────────────────────────────────
  // A fresh realm gets ONE tick so it isn't an empty stage — the guild leaders
  // commission their first work and the first proposals land. A rehydrated realm
  // is left exactly as you left it. Everything after this is on your say-so:
  // the "Advance the Realm" button, or the opt-in timer.
  useEffect(() => {
    const store = useRealmStore.getState();
    if (!store.proposals.length && !store.quests.length && store.tick === 0) {
      void runTick();
    }
    syncAutoTick();
  }, []);
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <>
      <SceneStage key={activeSceneId} />
      {activeSceneId !== "realm" && (
        <button className="leave-btn" onClick={() => setActiveScene("realm")} title="Return to the realm">
          ↩ Leave to realm
        </button>
      )}
      <NeedsYouNow />
      <DialogueBox />
      <Journal />
      <RealmMap />
      <Council />
      <DecreeQuill />
      <QuestJuice />
      <Dispatches />
      <TickControl />

      <div className="tool-rail">
        <button className="tome-btn" onClick={() => setDecreeOpen(true)} title="Decree a new task">
          🪶
          <span>Decree</span>
        </button>
        <button className="tome-btn" onClick={() => setDispatchesOpen(true)} title="Read the ravens">
          🕊
          <span>Dispatches</span>
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

      <div className="hint">Drag/WASD to roam · scroll to zoom · click a character · 🪶 decree · 🕊 dispatches</div>
    </>
  );
}
