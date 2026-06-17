import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Authority, type CharacterId, type Dialogue, type Quest, type Urgency } from "../types";
import { getCharacter } from "../data/characters";

/** A request for the camera to glide to a point in the current scene. */
export interface CameraTarget {
  x: number;
  y: number;
  zoom?: number;
}

/** The shape that gets autosaved to localStorage (and exported to file). */
interface SavedRealm {
  proposals: Quest[];
  quests: Quest[];
  authorityOverrides: Record<CharacterId, Authority>;
}

/**
 * The single source of truth for the whole realm. The persisted slice
 * (proposals / quests / authority) autosaves to localStorage; transient UI
 * state (dialogue, camera, open panels) is not saved.
 */
interface RealmState extends SavedRealm {
  // ── Dialogue (the parchment box) ──
  activeDialogue: Dialogue | null;
  openDialogue: (d: Dialogue) => void;
  resolveDialogue: (choiceId: string) => void;
  closeDialogue: () => void;

  // ── Camera ──
  cameraTarget: CameraTarget | null;
  focusCamera: (t: CameraTarget) => void;
  clearCameraTarget: () => void;

  // ── Quests ──
  offerQuest: (q: Quest) => void;
  acceptProposal: (questId: string) => void;
  declineProposal: (questId: string) => void;
  completeQuest: (questId: string) => void;
  /** Chairman hands a character a brief directly → an in-progress quest. */
  decreeQuest: (characterId: CharacterId, title: string, brief: string) => void;
  /** Colour-coded marker to float over a character, from their quest state. */
  characterMarker: (characterId: CharacterId) => Urgency | undefined;

  // ── Authority (per character; overrides the data-file default) ──
  setAuthority: (characterId: CharacterId, level: Authority) => void;
  authorityOf: (characterId: CharacterId) => Authority;

  // ── Save / load to file ──
  exportRealm: () => string;
  importRealm: (json: string) => boolean;

  // ── Travel (which place you're in) ──
  activeSceneId: string;
  setActiveScene: (id: string) => void;

  // ── UI panels ──
  journalOpen: boolean;
  setJournalOpen: (open: boolean) => void;
  mapOpen: boolean;
  setMapOpen: (open: boolean) => void;
  councilOpen: boolean;
  setCouncilOpen: (open: boolean) => void;
  decreeOpen: boolean;
  setDecreeOpen: (open: boolean) => void;
}

let questSeq = 0;
const newId = () => `q-${Date.now().toString(36)}-${questSeq++}`;

export const useRealmStore = create<RealmState>()(
  persist(
    (set, get) => ({
      proposals: [],
      quests: [],
      authorityOverrides: {},

      activeDialogue: null,
      openDialogue: (d) => set({ activeDialogue: d }),
      resolveDialogue: (choiceId) => {
        const d = get().activeDialogue;
        set({ activeDialogue: null });
        d?.onResolve?.(choiceId);
      },
      closeDialogue: () => set({ activeDialogue: null }),

      cameraTarget: null,
      focusCamera: (t) => set({ cameraTarget: t }),
      clearCameraTarget: () => set({ cameraTarget: null }),

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
      decreeQuest: (characterId, title, brief) =>
        set((s) => ({
          quests: [
            ...s.quests,
            {
              id: newId(),
              title,
              chunks: [brief],
              guildId: getCharacter(characterId)?.guildId ?? "",
              ownerId: characterId,
              status: "in_progress",
              createdAt: Date.now(),
            },
          ],
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

      setAuthority: (characterId, level) =>
        set((s) => ({ authorityOverrides: { ...s.authorityOverrides, [characterId]: level } })),
      authorityOf: (characterId) =>
        get().authorityOverrides[characterId] ?? getCharacter(characterId)?.authority ?? Authority.Trusted,

      exportRealm: () => {
        const { proposals, quests, authorityOverrides } = get();
        return JSON.stringify({ proposals, quests, authorityOverrides }, null, 2);
      },
      importRealm: (json) => {
        try {
          const data = JSON.parse(json) as Partial<SavedRealm>;
          if (!Array.isArray(data.quests) || !Array.isArray(data.proposals)) return false;
          set({
            proposals: data.proposals,
            quests: data.quests,
            authorityOverrides: data.authorityOverrides ?? {},
          });
          return true;
        } catch {
          return false;
        }
      },

      activeSceneId: "realm",
      setActiveScene: (id) => set({ activeSceneId: id }),

      journalOpen: false,
      setJournalOpen: (open) => set({ journalOpen: open }),
      mapOpen: false,
      setMapOpen: (open) => set({ mapOpen: open }),
      councilOpen: false,
      setCouncilOpen: (open) => set({ councilOpen: open }),
      decreeOpen: false,
      setDecreeOpen: (open) => set({ decreeOpen: open }),
    }),
    {
      name: "realm-of-endeavour",
      // only persist the durable realm state, never transient UI
      partialize: (s): SavedRealm => ({
        proposals: s.proposals,
        quests: s.quests,
        authorityOverrides: s.authorityOverrides,
      }),
    }
  )
);
