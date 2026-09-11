import { useRealmStore } from "../store/useRealmStore";
import { MOCK_DIALOGUES } from "../data/mockDialogues";
import { getCharacter } from "../data/characters";
import { sceneOfCharacter } from "../data/scenes";
import type { Risk } from "../types";

/**
 * Approach a character: travel to the scene they live in, then open the right
 * dialogue. Priority order is deliberate — the thing that BLOCKS the realm comes
 * first, so clicking anyone always surfaces their most decision-shaped item:
 *   1. a pending permission request (they're frozen waiting on your leave)
 *   2. a quest proposal (accept / decline)
 *   3. a blocked task (you're the blocker)
 *   4. their scripted greeting
 * Shared by hotspot clicks and the scroll's "Attend ▸" so both feel identical.
 */

/** Travel to the character's room (if not already there), then talk. */
export function summonCharacter(characterId: string) {
  const store = useRealmStore.getState();
  const sceneId = sceneOfCharacter(characterId);
  if (sceneId && sceneId !== store.activeSceneId) store.setActiveScene(sceneId);
  openCharacterDialogue(characterId);
}

const RISK_WORD: Record<Risk, string> = {
  low: "A small thing",
  medium: "Worth a moment's thought",
  high: "Weigh this one carefully",
};

/** Talk to a character who is already on-screen (no travel). */
export function openCharacterDialogue(characterId: string) {
  const store = useRealmStore.getState();
  const char = getCharacter(characterId);
  const accent = char ? guildAccent(char.guildId) : undefined;

  // ── 1. pending permission — they cannot move until you rule ──
  const perm = store.permissions.find((p) => p.characterId === characterId && p.status === "pending");
  if (perm) {
    store.openDialogue({
      id: `perm-${perm.id}`,
      speakerName: char?.name ?? characterId,
      speakerTitle: char?.title,
      portrait: char?.portrait ?? "❓",
      accent,
      chunks: [
        `I ask your leave: ${perm.action}.`,
        perm.rationale,
        // Never leave the routing opaque — say why this one reached you.
        perm.because ?? `${RISK_WORD[perm.risk]}.`,
      ],
      choices: [
        { id: "grant", label: "Granted — proceed", tone: "accept" },
        { id: "deny", label: "Denied for now", tone: "decline" },
      ],
      onResolve: (choice) => {
        useRealmStore.getState().decidePermission(perm.id, choice === "grant");
      },
    });
    return;
  }

  // ── 2. a quest proposal ──
  const proposal = store.proposals.find((p) => p.ownerId === characterId);
  if (proposal) {
    store.openDialogue({
      id: `offer-${proposal.id}`,
      speakerName: char?.name ?? proposal.ownerId,
      speakerTitle: char?.title,
      portrait: char?.portrait ?? "❓",
      accent,
      chunks: proposal.chunks,
      choices: [
        { id: "accept", label: "Accept the quest", tone: "accept" },
        { id: "decline", label: "Decline for now", tone: "decline" },
      ],
      onResolve: (choice) => {
        const s = useRealmStore.getState();
        if (choice === "accept") s.acceptProposal(proposal.id);
        else s.declineProposal(proposal.id);
      },
    });
    return;
  }

  // ── 3. a blocked task — you are the blocker ──
  const blocked = store.quests.find((q) => q.ownerId === characterId && q.status === "blocked");
  if (blocked) {
    store.openDialogue({
      id: `blocked-${blocked.id}`,
      speakerName: char?.name ?? characterId,
      speakerTitle: char?.title,
      portrait: char?.portrait ?? "❓",
      accent,
      chunks: [
        `I'm stopped on “${blocked.title}”.`,
        blocked.blockedReason ?? "I need your word before I can go on.",
      ],
      choices: [
        { id: "unblock", label: "Consider it cleared", tone: "accept" },
        { id: "later", label: "Hold there for now", tone: "neutral" },
      ],
      onResolve: (choice) => {
        if (choice !== "unblock") return;
        const s = useRealmStore.getState();
        s.noteProgress(blocked.id, characterId, "The Chairman cleared the way.");
      },
    });
    return;
  }

  // ── 4. no pending decision — a scripted greeting, or a generated one ──
  const base = MOCK_DIALOGUES[characterId];
  if (base) {
    store.openDialogue({ ...base });
    return;
  }
  if (char) {
    store.openDialogue({
      id: `greet-${characterId}`,
      speakerName: char.name,
      speakerTitle: char.title,
      portrait: char.portrait,
      accent,
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
