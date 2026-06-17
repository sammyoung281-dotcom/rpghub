import { useRealmStore } from "../store/useRealmStore";
import { MOCK_DIALOGUES } from "../data/mockDialogues";
import { getCharacter } from "../data/characters";
import { sceneOfCharacter } from "../data/scenes";

/**
 * Approach a character: travel to the scene they live in, then open the right
 * dialogue.
 * - If they have a pending quest proposal → offer it with Accept / Decline.
 *   Accepting writes it to the Journal (in_progress); declining drops it.
 * - Otherwise → their scripted greeting/report.
 * Shared by hotspot clicks and the scroll's "Attend ▸" so both feel identical.
 */
/** Travel to the character's room (if not already there), then talk. */
export function summonCharacter(characterId: string) {
  const store = useRealmStore.getState();
  const sceneId = sceneOfCharacter(characterId);
  if (sceneId && sceneId !== store.activeSceneId) store.setActiveScene(sceneId);
  openCharacterDialogue(characterId);
}

/** Talk to a character who is already on-screen (no travel). */
export function openCharacterDialogue(characterId: string) {
  const store = useRealmStore.getState();
  const proposal = store.proposals.find((p) => p.ownerId === characterId);
  if (proposal) {
    const char = getCharacter(characterId);
    store.openDialogue({
      id: `offer-${proposal.id}`,
      speakerName: char?.name ?? proposal.ownerId,
      speakerTitle: char?.title,
      portrait: char?.portrait ?? "❓",
      accent: char ? guildAccent(char.guildId) : undefined,
      chunks: proposal.chunks,
      choices: [
        { id: "accept", label: "Accept the quest", tone: "accept" },
        { id: "decline", label: "Decline for now", tone: "decline" },
      ],
      onResolve: (choice) => {
        if (choice === "accept") store.acceptProposal(proposal.id);
        else store.declineProposal(proposal.id);
      },
    });
    return;
  }

  // no pending quest — a scripted greeting, or a generated one from persona
  const base = MOCK_DIALOGUES[characterId];
  if (base) {
    store.openDialogue({ ...base });
    return;
  }
  const char = getCharacter(characterId);
  if (char) {
    store.openDialogue({
      id: `greet-${characterId}`,
      speakerName: char.name,
      speakerTitle: char.title,
      portrait: char.portrait,
      accent: guildAccent(char.guildId),
      chunks: [`${char.role}.`, "All is in hand here, Sovereign. I'll send word the moment I need you."],
      choices: [{ id: "ok", label: "Carry on", tone: "neutral" }],
    });
  }
}

// minimal accent lookup without importing guild data circularly into hot paths
function guildAccent(guildId: string | null): string | undefined {
  const map: Record<string, string> = {
    merchants: "#b8860b",
    ledger: "#4a6d8c",
    hearth: "#a85b3a",
    scholars: "#6b8e4e",
  };
  return guildId ? map[guildId] : "#7b5fa0";
}
