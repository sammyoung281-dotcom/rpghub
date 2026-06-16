import { useEffect } from "react";
import World from "./game/World";
import DialogueBox from "./ui/DialogueBox";
import NeedsYouNow from "./ui/NeedsYouNow";
import { useRealmStore } from "./store/useRealmStore";

export default function App() {
  const addNeed = useRealmStore((s) => s.addNeed);
  const removeNeed = useRealmStore((s) => s.removeNeed);
  const openDialogue = useRealmStore((s) => s.openDialogue);

  // ── STEP 2 DEMO ──────────────────────────────────────────────────────────
  // Seeds one "Needs You Now" item that opens a sample parchment dialogue.
  // This is throwaway scaffolding — real quests come from the AgentEngine in
  // Step 3. It exists only to let you exercise the dialogue + scroll backbone.
  useEffect(() => {
    addNeed({
      id: "demo-need",
      title: "The Merchant seeks an audience",
      detail: "Brannock has a venture he dares not begin without your word.",
      ownerId: "brannock",
      guildId: "merchants",
      priority: 100,
      onAct: () =>
        openDialogue({
          id: "demo-dlg",
          speakerName: "Brannock Quillfeather",
          speakerTitle: "Master of the Merchant's Guild",
          portrait: "🦊",
          accent: "#b8860b",
          chunks: [
            "My liege — a window has opened. A small game of mine could launch this very fortnight.",
            "But the testing is unfinished, and coin must be spent on it. I'll not gamble the treasury without your nod.",
          ],
          choices: [
            { id: "accept", label: "Grant the venture", tone: "accept" },
            { id: "decline", label: "Hold for now", tone: "decline" },
          ],
          onResolve: () => removeNeed("demo-need"),
        }),
    });
  }, [addNeed, removeNeed, openDialogue]);
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <>
      <World />
      <NeedsYouNow />
      <DialogueBox />
      <div className="hint">WASD / Arrows to walk · Q / E to turn the view</div>
    </>
  );
}
