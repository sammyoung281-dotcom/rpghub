import { useEffect } from "react";
import SceneStage from "./scene/SceneStage";
import DialogueBox from "./ui/DialogueBox";
import NeedsYouNow from "./ui/NeedsYouNow";
import { useRealmStore } from "./store/useRealmStore";
import { SCENES, STARTING_SCENE } from "./data/scenes";
import { summonCharacter } from "./scene/interactions";

export default function App() {
  const addNeed = useRealmStore((s) => s.addNeed);

  // ── STEP DEMO ──────────────────────────────────────────────────────────────
  // Seeds one "Needs You Now" item. Attending it (or clicking Brannock in the
  // glade) glides the camera to him and opens his quest dialogue. Throwaway
  // scaffolding — real quests come from the AgentEngine in the next step.
  useEffect(() => {
    const scene = SCENES[STARTING_SCENE];
    addNeed({
      id: "need-brannock",
      title: "The Merchant seeks an audience",
      detail: "Brannock has a venture he dares not begin without your word.",
      ownerId: "brannock",
      guildId: "merchants",
      priority: 100,
      onAct: () => summonCharacter(scene, "brannock"),
    });
  }, [addNeed]);
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <>
      <SceneStage />
      <NeedsYouNow />
      <DialogueBox />
      <div className="hint">Drag or WASD to roam · scroll to zoom · click a character</div>
    </>
  );
}
