import { create } from "zustand";
import type { Dialogue, NeedItem } from "../types";

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
}));
