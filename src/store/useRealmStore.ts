import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Authority,
  type Bounce,
  type CharacterId,
  type Dialogue,
  type Message,
  type Permission,
  type Quest,
  type QuestId,
  type Recipient,
  type TickSummary,
  type Urgency,
} from "../types";
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
  messages: Message[];
  permissions: Permission[];
  tick: number;
}

/** Keep the log bounded so localStorage never blows up on a long-running realm. */
const MAX_MESSAGES = 400;
const MAX_BOUNCES = 50;
const MAX_TICK_LOG = 40;

/**
 * The single source of truth for the whole realm. The persisted slice
 * (proposals / quests / authority / messages / permissions / tick) autosaves to
 * localStorage; transient UI state (dialogue, camera, open panels) is not saved.
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

  // ── Quests / tasks ──
  offerQuest: (q: Quest) => void;
  acceptProposal: (questId: string) => void;
  declineProposal: (questId: string) => void;
  completeQuest: (questId: string) => void;
  /** Chairman hands a character a brief directly → an in-progress quest. */
  decreeQuest: (characterId: CharacterId, title: string, brief: string) => void;
  /** Colour-coded marker to float over a character, from their quest state. */
  characterMarker: (characterId: CharacterId) => Urgency | undefined;

  // ── The Ravenry (inter-agent messaging) ──
  addMessage: (m: Message) => void;
  markRead: (ids: string[]) => void;
  inboxFor: (id: Recipient) => Message[];
  bounces: Bounce[];
  addBounce: (b: Bounce) => void;

  // ── Task-graph mutations used by the orchestrator ──
  addTask: (q: Quest) => void;
  noteProgress: (taskId: QuestId, by: CharacterId, note: string, progress?: number) => void;
  blockTask: (taskId: QuestId, reason: string) => void;
  /** True when every dependency of this task is done. */
  isUnblocked: (taskId: QuestId) => boolean;

  // ── Permissions (the Authority gate) ──
  raisePermission: (p: Permission) => void;
  decidePermission: (id: string, approved: boolean) => void;

  // ── The world clock ──
  advancing: boolean;
  setAdvancing: (v: boolean) => void;
  autoTick: boolean;
  setAutoTick: (v: boolean) => void;
  autoTickMinutes: number;
  setAutoTickMinutes: (m: number) => void;
  /** Global kill switch — nothing advances while true. */
  paused: boolean;
  setPaused: (v: boolean) => void;
  tickLog: TickSummary[];
  commitTick: (summary: TickSummary) => void;

  // ── Authority (per character; overrides the data-file default) ──
  setAuthority: (characterId: CharacterId, level: Authority) => void;
  authorityOf: (characterId: CharacterId) => Authority;

  // ── Save / load to file ──
  exportRealm: () => string;
  importRealm: (json: string) => boolean;
  resetRealm: () => void;

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
  dispatchesOpen: boolean;
  setDispatchesOpen: (open: boolean) => void;
}

let questSeq = 0;
const newId = () => `q-${Date.now().toString(36)}-${questSeq++}`;

export const useRealmStore = create<RealmState>()(
  persist(
    (set, get) => ({
      proposals: [],
      quests: [],
      authorityOverrides: {},
      messages: [],
      permissions: [],
      tick: 0,

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

      // NOTE: Phase 1 allowed only one quest per character. The task graph needs
      // many, so dedupe is now by id + identical open title, not by owner.
      offerQuest: (q) =>
        set((s) => {
          const dupe =
            s.proposals.some((p) => p.id === q.id || (p.ownerId === q.ownerId && p.title === q.title)) ||
            s.quests.some((x) => x.id === q.id || (x.ownerId === q.ownerId && x.title === q.title && x.status !== "done"));
          return dupe ? s : { proposals: [...s.proposals, q] };
        }),
      acceptProposal: (questId) =>
        set((s) => {
          const q = s.proposals.find((p) => p.id === questId);
          if (!q) return s;
          return {
            proposals: s.proposals.filter((p) => p.id !== questId),
            quests: [...s.quests, { ...q, status: "in_progress" as const, visibility: "surfaced" as const }],
          };
        }),
      declineProposal: (questId) =>
        set((s) => ({ proposals: s.proposals.filter((p) => p.id !== questId) })),
      completeQuest: (questId) =>
        set((s) => ({
          quests: s.quests.map((q) =>
            q.id === questId ? { ...q, status: "done", progress: 100, sealedAt: Date.now() } : q
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
              assignedBy: "chairman" as const,
              status: "in_progress" as const,
              visibility: "surfaced" as const,
              progress: 0,
              threadId: `t-${newId()}`,
              createdAt: Date.now(),
              log: [],
            },
          ],
        })),
      characterMarker: (characterId) => {
        const s = get();
        if (s.proposals.some((p) => p.ownerId === characterId)) return "needs_me";
        if (s.permissions.some((p) => p.characterId === characterId && p.status === "pending"))
          return "needs_me";
        const mine = s.quests.filter((q) => q.ownerId === characterId);
        if (mine.some((q) => q.status === "blocked")) return "needs_me";
        if (mine.some((q) => q.status === "in_progress")) return "in_progress";
        if (mine.length > 0) return "done";
        return undefined;
      },

      // ── The Ravenry ──
      addMessage: (m) =>
        set((s) => ({ messages: [...s.messages, m].slice(-MAX_MESSAGES) })),
      markRead: (ids) =>
        set((s) => {
          const idSet = new Set(ids);
          return { messages: s.messages.map((m) => (idSet.has(m.id) ? { ...m, read: true } : m)) };
        }),
      inboxFor: (id) => get().messages.filter((m) => m.to === id && !m.read),
      bounces: [],
      addBounce: (b) => set((s) => ({ bounces: [...s.bounces, b].slice(-MAX_BOUNCES) })),

      // ── Task graph ──
      addTask: (q) => set((s) => ({ quests: [...s.quests, q] })),
      noteProgress: (taskId, by, note, progress) =>
        set((s) => ({
          quests: s.quests.map((q) =>
            q.id === taskId
              ? {
                  ...q,
                  status: q.status === "done" ? q.status : ("in_progress" as const),
                  blockedReason: undefined,
                  progress: progress ?? Math.min(95, (q.progress ?? 0) + 20),
                  log: [...(q.log ?? []), { tick: s.tick, by, note }].slice(-20),
                }
              : q
          ),
        })),
      blockTask: (taskId, reason) =>
        set((s) => ({
          quests: s.quests.map((q) =>
            q.id === taskId ? { ...q, status: "blocked" as const, blockedReason: reason } : q
          ),
        })),
      isUnblocked: (taskId) => {
        const s = get();
        const task = s.quests.find((q) => q.id === taskId);
        if (!task?.dependsOn?.length) return true;
        return task.dependsOn.every((dep) => s.quests.find((q) => q.id === dep)?.status === "done");
      },

      // ── Permissions ──
      raisePermission: (p) =>
        set((s) =>
          // never let an agent stack duplicate asks — that's how you get nagged to death
          s.permissions.some(
            (x) => x.status === "pending" && x.characterId === p.characterId && x.action === p.action
          )
            ? s
            : { permissions: [...s.permissions, p] }
        ),
      decidePermission: (id, approved) =>
        set((s) => ({
          permissions: s.permissions.map((p) =>
            p.id === id
              ? { ...p, status: approved ? ("approved" as const) : ("denied" as const), decidedAt: Date.now() }
              : p
          ),
        })),

      // ── World clock ──
      advancing: false,
      setAdvancing: (v) => set({ advancing: v }),
      autoTick: false,
      setAutoTick: (v) => set({ autoTick: v }),
      autoTickMinutes: 15,
      setAutoTickMinutes: (m) => set({ autoTickMinutes: m }),
      paused: false,
      setPaused: (v) => set({ paused: v }),
      tickLog: [],
      commitTick: (summary) =>
        set((s) => ({ tick: summary.tick, tickLog: [summary, ...s.tickLog].slice(0, MAX_TICK_LOG) })),

      setAuthority: (characterId, level) =>
        set((s) => ({ authorityOverrides: { ...s.authorityOverrides, [characterId]: level } })),
      authorityOf: (characterId) =>
        get().authorityOverrides[characterId] ?? getCharacter(characterId)?.authority ?? Authority.Trusted,

      exportRealm: () => {
        const { proposals, quests, authorityOverrides, messages, permissions, tick } = get();
        return JSON.stringify(
          { proposals, quests, authorityOverrides, messages, permissions, tick },
          null,
          2
        );
      },
      importRealm: (json) => {
        try {
          const data = JSON.parse(json) as Partial<SavedRealm>;
          if (!Array.isArray(data.quests) || !Array.isArray(data.proposals)) return false;
          set({
            proposals: data.proposals,
            quests: data.quests,
            authorityOverrides: data.authorityOverrides ?? {},
            messages: data.messages ?? [],
            permissions: data.permissions ?? [],
            tick: data.tick ?? 0,
          });
          return true;
        } catch {
          return false;
        }
      },
      resetRealm: () =>
        set({
          proposals: [],
          quests: [],
          messages: [],
          permissions: [],
          bounces: [],
          tickLog: [],
          tick: 0,
        }),

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
      dispatchesOpen: false,
      setDispatchesOpen: (open) => set({ dispatchesOpen: open }),
    }),
    {
      name: "realm-of-endeavour",
      // only persist the durable realm state, never transient UI
      partialize: (s): SavedRealm => ({
        proposals: s.proposals,
        quests: s.quests,
        authorityOverrides: s.authorityOverrides,
        messages: s.messages,
        permissions: s.permissions,
        tick: s.tick,
      }),
    }
  )
);
