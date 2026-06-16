import { create } from "zustand";
import type { CharacterId, Dialogue, NeedItem, Quest, Urgency } from "../types";

/** A request for the camera to glide to a point in the current scene. */
export interface CameraTarget {
  x: number;
  y: number;
  zoom?: number;
}

/**
 * The single source of truth. Phaser and React both read/write through this.
 * Step 2 introduces only what the dialogue box + Needs You Now scroll require;
 * quests, characters, persistence etc. are layered on in later steps.
 */
interface RealmState {
  // ── Dialogue (the parchment box) ──
  activeDialogue: Dialogue | null;
  openDialogue: (d: Dialogue) => void;
  /** Resolve the active dialogue with a choice, fire its handler, then close. */
  resolveDialogue: (choiceId: string) => void;
  closeDialogue: () => void;

  // ── Needs You Now (the proclamation scroll) ──
  needs: NeedItem[];
  addNeed: (need: NeedItem) => void;
  removeNeed: (id: string) => void;
  /** The single most urgent item — what the scroll shows big. */
  topNeed: () => NeedItem | null;

  // ── Camera (the scene engine consumes & clears this) ──
  cameraTarget: CameraTarget | null;
  focusCamera: (t: CameraTarget) => void;
  clearCameraTarget: () => void;

  // ── Quests ──
  /** Offered quests awaiting the Chairman's accept/decline (status not_started). */
  proposals: Quest[];
  /** Accepted quests (in_progress / blocked / done) — the Journal's contents. */
  quests: Quest[];
  offerQuest: (q: Quest) => void;
  acceptProposal: (questId: string) => void;
  declineProposal: (questId: string) => void;
  completeQuest: (questId: string) => void;
  /** Colour-coded marker to float over a character, from their quest state. */
  characterMarker: (characterId: CharacterId) => Urgency | undefined;

  // ── UI panels ──
  journalOpen: boolean;
  setJournalOpen: (open: boolean) => void;
}

export const useRealmStore = create<RealmState>((set, get) => ({
  activeDialogue: null,
  openDialogue: (d) => set({ activeDialogue: d }),
  resolveDialogue: (choiceId) => {
    const d = get().activeDialogue;
    set({ activeDialogue: null });
    d?.onResolve?.(choiceId);
  },
  closeDialogue: () => set({ activeDialogue: null }),

  needs: [],
  addNeed: (need) =>
    set((s) => ({ needs: [...s.needs.filter((n) => n.id !== need.id), need] })),
  removeNeed: (id) => set((s) => ({ needs: s.needs.filter((n) => n.id !== id) })),
  topNeed: () => {
    const sorted = [...get().needs].sort((a, b) => b.priority - a.priority);
    return sorted[0] ?? null;
  },

  cameraTarget: null,
  focusCamera: (t) => set({ cameraTarget: t }),
  clearCameraTarget: () => set({ cameraTarget: null }),

  proposals: [],
  quests: [],
  offerQuest: (q) =>
    set((s) =>
      s.proposals.some((p) => p.id === q.id) || s.quests.some((x) => x.ownerId === q.ownerId)
        ? s
        : { proposals: [...s.proposals, q] }
    ),
  acceptProposal: (questId) =>
    set((s) => {
      const q = s.proposals.find((p) => p.id === questId);
      if (!q) return s;
      return {
        proposals: s.proposals.filter((p) => p.id !== questId),
        quests: [...s.quests, { ...q, status: "in_progress" }],
      };
    }),
  declineProposal: (questId) =>
    set((s) => ({ proposals: s.proposals.filter((p) => p.id !== questId) })),
  completeQuest: (questId) =>
    set((s) => ({
      quests: s.quests.map((q) =>
        q.id === questId ? { ...q, status: "done", sealedAt: Date.now() } : q
      ),
    })),
  characterMarker: (characterId) => {
    const s = get();
    if (s.proposals.some((p) => p.ownerId === characterId)) return "needs_me";
    const mine = s.quests.filter((q) => q.ownerId === characterId);
    if (mine.some((q) => q.status === "blocked")) return "needs_me";
    if (mine.some((q) => q.status === "in_progress")) return "in_progress";
    if (mine.length > 0) return "done";
    return undefined;
  },

  journalOpen: false,
  setJournalOpen: (open) => set({ journalOpen: open }),
}));
