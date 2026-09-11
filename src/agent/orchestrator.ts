import { useRealmStore } from "../store/useRealmStore";
import { CHARACTER_LIST, getCharacter } from "../data/characters";
import { agent } from "./index";
import { IDLE_SUBJECT, canSend, isElder, isGuildLeader, subordinatesOf } from "./bus";
import { explainRoute, routeFor } from "./risk";
import type { AgentAction, AgentContext } from "./AgentEngine";
import type { CharacterId, Message, Quest, TickSummary } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// THE WORLD CLOCK.
//
// Agents do NOT run continuously. One tick = one deliberate turn of the realm,
// either pressed by the Chairman or fired by the opt-in timer. Continuous loops
// are how autonomous multi-agent systems quietly spend real money overnight.
//
// A tick runs in two passes so cause and effect land in the SAME turn:
//   DOWN — the Elder, then guild leaders: commission and delegate work.
//   UP   — workers act, leaders consolidate, the Elder reports to the Chairman.
//
// Every guardrail lives here, not in the brains. A misbehaving agent gets
// refused; it never gets to have already done the damage.
// ─────────────────────────────────────────────────────────────────────────────

export const LIMITS = {
  /** Most actions one character may take in a single tick. */
  actionsPerAgent: 6,
  /** Most messages the whole realm may send in a single tick. */
  messagesPerTick: 30,
  /** Most tasks that may be created in a single tick. */
  tasksPerTick: 6,
  /** How far a message may be passed up the chain before we stop it. */
  maxHops: 4,
  /** Most pending permissions before agents stop raising more. */
  maxPendingPermissions: 6,
};

let seq = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${seq++}`;


interface TickBudget {
  messages: number;
  tasks: number;
  permissions: number;
  bounced: number;
  completed: number;
  headlines: string[];
  /** Dedupe key set — kills "thanks!" / "no, thank YOU" loops dead. */
  sent: Set<string>;
  halted?: string;
}

/**
 * Advance the realm by one tick. Returns a summary of what actually happened;
 * `dryRun` computes the whole thing and applies nothing (used to preview).
 */
export async function advanceRealm(opts: { dryRun?: boolean } = {}): Promise<TickSummary> {
  const store = useRealmStore.getState();
  const tick = store.tick + 1;

  const budget: TickBudget = {
    messages: 0,
    tasks: 0,
    permissions: 0,
    bounced: 0,
    completed: 0,
    headlines: [],
    sent: new Set(),
  };

  // Snapshot the pending queue ONCE. Messages produced this tick are delivered
  // next tick — that keeps a turn finite and stops within-tick ping-pong.
  const inboxSnapshot = store.messages.filter((m) => !m.read);

  const elder = CHARACTER_LIST.filter((c) => isElder(c.id));
  const leaders = CHARACTER_LIST.filter((c) => isGuildLeader(c.id));
  const workers = CHARACTER_LIST.filter((c) => !isElder(c.id) && !isGuildLeader(c.id));

  // DOWN-pass: commission & delegate. UP-pass: execute & report.
  const order: CharacterId[] = [
    ...elder.map((c) => c.id),
    ...leaders.map((c) => c.id),
    ...workers.map((c) => c.id),
    ...leaders.map((c) => c.id),
    ...elder.map((c) => c.id),
  ];

  const consumed = new Set<string>();

  for (const charId of order) {
    if (budget.halted) break;

    const ctx = buildContext(charId, tick, inboxSnapshot, consumed);
    if (!ctx) continue;

    let actions: AgentAction[] = [];
    try {
      actions = await agent.step(ctx);
    } catch (err) {
      budget.headlines.push(`⚠ ${getCharacter(charId)?.name ?? charId} faltered: ${String(err)}`);
      continue;
    }

    // Mark what they read, so nobody re-reads the same post next pass.
    for (const m of ctx.inbox) consumed.add(m.id);

    if (!opts.dryRun) {
      applyActions(charId, actions.slice(0, LIMITS.actionsPerAgent), tick, budget);
    }
  }

  if (!opts.dryRun && consumed.size) useRealmStore.getState().markRead([...consumed]);

  const summary: TickSummary = {
    tick,
    at: Date.now(),
    messagesSent: budget.messages,
    tasksCreated: budget.tasks,
    tasksCompleted: budget.completed,
    permissionsRaised: budget.permissions,
    bounced: budget.bounced,
    headlines: budget.headlines.slice(0, 8),
    haltedBy: budget.halted,
  };

  if (!opts.dryRun) useRealmStore.getState().commitTick(summary);
  return summary;
}

// ── context assembly ─────────────────────────────────────────────────────────

function buildContext(
  charId: CharacterId,
  tick: number,
  inboxSnapshot: Message[],
  consumed: Set<string>
): AgentContext | null {
  const character = getCharacter(charId);
  if (!character) return null;
  const s = useRealmStore.getState();

  const tasks = s.quests.filter((q) => q.ownerId === charId && q.status !== "done");
  const leads = isGuildLeader(charId);
  const guildTasks = leads ? s.quests.filter((q) => q.guildId === character.guildId) : [];
  const guildProposals = leads ? s.proposals.filter((p) => p.guildId === character.guildId) : [];

  return {
    character,
    tick,
    inbox: inboxSnapshot.filter((m) => m.to === charId && !consumed.has(m.id)),
    tasks: tasks.filter((q) => dependenciesMet(q, s.quests)),
    guildTasks,
    guildProposals,
    subordinates: subordinatesOf(charId),
    authority: s.authorityOf(charId),
    permissions: s.permissions.filter((p) => p.characterId === charId),
    verifications: s.verifications.filter(
      (v) => v.requesterId === charId || v.verifierId === charId
    ),
    realmIdle:
      !s.quests.some((q) => q.status === "in_progress" || q.status === "blocked") &&
      s.proposals.length === 0 &&
      !s.permissions.some((p) => p.status === "pending"),
    realmIdleAnnounced: s.messages.some((m) => m.subject === IDLE_SUBJECT),
    now: Date.now(),
  };
}

/** A task whose dependencies aren't done is simply not workable this tick. */
function dependenciesMet(task: Quest, all: Quest[]): boolean {
  if (!task.dependsOn?.length) return true;
  return task.dependsOn.every((id) => all.find((q) => q.id === id)?.status === "done");
}

// ── applying intents (the only place state changes) ──────────────────────────

function applyActions(
  fromId: CharacterId,
  actions: AgentAction[],
  tick: number,
  budget: TickBudget
): void {
  const store = useRealmStore.getState();

  for (const a of actions) {
    switch (a.t) {
      case "send": {
        if (budget.messages >= LIMITS.messagesPerTick) {
          budget.halted = `Message budget (${LIMITS.messagesPerTick}/tick) reached.`;
          return;
        }
        // dedupe: same sender, same recipient, same subject, same tick
        const key = `${fromId}→${a.to}:${a.subject}`;
        if (budget.sent.has(key)) break;
        budget.sent.add(key);

        // routing rules — refuse, or reroute via the Elder and say so
        const verdict = canSend(fromId, a.to, a.kind);
        let to = a.to;
        if (!verdict.ok) {
          if (!verdict.redirectTo) {
            store.addBounce({
              id: uid("b"),
              tick,
              from: fromId,
              to: a.to,
              subject: a.subject,
              reason: verdict.reason ?? "Refused.",
            });
            budget.bounced += 1;
            break;
          }
          store.addBounce({
            id: uid("b"),
            tick,
            from: fromId,
            to: a.to,
            subject: a.subject,
            reason: `${verdict.reason} Rerouted via ${getCharacter(verdict.redirectTo as string)?.name ?? verdict.redirectTo}.`,
          });
          budget.bounced += 1;
          to = verdict.redirectTo;
        }

        const msg: Message = {
          id: uid("m"),
          threadId: a.threadId ?? uid("t"),
          tick,
          at: Date.now(),
          from: fromId,
          to,
          kind: a.kind,
          subject: a.subject,
          body: a.body,
          taskId: a.taskId,
          read: false,
          hops: 0,
        };
        store.addMessage(msg);
        budget.messages += 1;
        if (to === "chairman") {
          budget.headlines.push(`✉ ${getCharacter(fromId)?.name}: ${a.subject}`);
        }
        break;
      }

      case "task.create": {
        if (budget.tasks >= LIMITS.tasksPerTick) break;
        const task: Quest = {
          id: uid("q"),
          title: a.title,
          chunks: a.chunks,
          guildId: a.guildId,
          ownerId: a.assignTo,
          assignedBy: fromId,
          dependsOn: a.dependsOn,
          threadId: a.threadId ?? uid("t"),
          visibility: a.visibility ?? "internal",
          status: "in_progress",
          progress: 0,
          createdAt: Date.now(),
          log: [],
        };
        // don't recreate work the assignee already has open
        const dupe = useRealmStore
          .getState()
          .quests.some((q) => q.ownerId === a.assignTo && q.title === a.title && q.status !== "done");
        if (dupe) break;
        store.addTask(task);
        budget.tasks += 1;
        break;
      }

      case "task.offer": {
        if (budget.tasks >= LIMITS.tasksPerTick) break;
        // offerQuest dedupes internally, so measure whether it actually landed
        // rather than counting the attempt (which inflated the tick summary).
        const before = useRealmStore.getState().proposals.length;
        store.offerQuest({
          id: uid("q"),
          title: a.title,
          chunks: a.chunks,
          guildId: a.guildId,
          ownerId: a.ownerId,
          assignedBy: fromId,
          threadId: a.threadId ?? uid("t"),
          visibility: "surfaced",
          status: "not_started",
          progress: 0,
          createdAt: Date.now(),
          log: [],
        });
        if (useRealmStore.getState().proposals.length > before) {
          budget.tasks += 1;
          budget.headlines.push(`❗ ${getCharacter(a.ownerId)?.name} wants a word: ${a.title}`);
        }
        break;
      }

      case "task.progress":
        store.noteProgress(a.taskId, fromId, a.note, a.progress);
        break;

      case "task.block": {
        store.blockTask(a.taskId, a.reason);
        budget.headlines.push(`🟥 ${getCharacter(fromId)?.name} is stopped: ${a.reason}`);
        break;
      }

      case "task.complete": {
        store.noteProgress(a.taskId, fromId, a.note, 100);
        store.completeQuest(a.taskId);
        budget.completed += 1;
        const t = useRealmStore.getState().quests.find((q) => q.id === a.taskId);
        budget.headlines.push(`🟩 ${getCharacter(fromId)?.name} finished: ${t?.title ?? a.taskId}`);
        break;
      }

      case "permission": {
        // THE MATRIX DECIDES, not the agent. It supplied facts; we route.
        const route = routeFor(a.factors);
        const pendingSovereign = useRealmStore
          .getState()
          .permissions.filter((p) => p.status === "pending" && (p.route ?? "sovereign") === "sovereign");
        // Only interruptions are capped. The council docket may grow freely —
        // it's a queue you choose to open, not a thing shouting at you.
        if (route === "sovereign" && pendingSovereign.length >= LIMITS.maxPendingPermissions) break;

        store.raisePermission({
          id: uid("p"),
          tick,
          characterId: fromId,
          taskId: a.taskId,
          action: a.action,
          rationale: a.rationale,
          risk: a.factors.reversibility === 3 || (a.factors.cost ?? 0) > 25 ? "high" : a.factors.impact >= 3 ? "medium" : "low",
          factors: a.factors,
          route,
          because: explainRoute(a.factors),
          status: "pending",
        });
        budget.permissions += 1;
        if (route === "sovereign") {
          budget.headlines.push(`🔑 ${getCharacter(fromId)?.name} asks leave: ${a.action}`);
        } else {
          budget.headlines.push(`⚖️ For the council: ${a.action}`);
        }
        break;
      }

      case "verify.request": {
        store.requestVerification({
          id: uid("v"),
          tick,
          taskId: a.taskId,
          requesterId: fromId,
          verifierId: a.verifierId,
          action: a.action,
          status: "pending",
        });
        // The check travels as a real message so it shows up in Dispatches.
        const verdict = canSend(fromId, a.verifierId, "verify");
        if (verdict.ok) {
          store.addMessage({
            id: uid("m"),
            threadId: uid("t"),
            tick,
            at: Date.now(),
            from: fromId,
            to: a.verifierId,
            kind: "verify",
            subject: `Your eyes on this: ${a.action}`,
            body: "I'd not proceed on my own word alone. Check it and say.",
            taskId: a.taskId,
            read: false,
          });
          budget.messages += 1;
        }
        break;
      }

      case "verify.resolve": {
        store.resolveVerification(a.verificationId, a.endorsed, a.note);
        const v = useRealmStore.getState().verifications.find((x) => x.id === a.verificationId);
        if (v) {
          store.addMessage({
            id: uid("m"),
            threadId: uid("t"),
            tick,
            at: Date.now(),
            from: fromId,
            to: v.requesterId,
            kind: "verify",
            subject: `${a.endorsed ? "Endorsed" : "Objection"}: ${v.action}`,
            body: a.note,
            taskId: v.taskId,
            read: false,
          });
          budget.messages += 1;
          if (!a.endorsed) budget.headlines.push(`⚠ ${getCharacter(fromId)?.name} objected: ${v.action}`);
        }
        break;
      }

      case "move":
        // cosmetic only — the scene layer will consume this when we do visuals.
        break;
    }
  }
}

// ── the auto-tick timer (opt-in) ─────────────────────────────────────────────

let timer: ReturnType<typeof setInterval> | null = null;

/** Start/stop the background timer to match the store's autoTick + paused flags. */
export function syncAutoTick(): void {
  const { autoTick, paused, autoTickMinutes } = useRealmStore.getState();
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (!autoTick || paused) return;
  timer = setInterval(
    () => {
      const s = useRealmStore.getState();
      if (s.paused || s.advancing) return;
      void runTick();
    },
    Math.max(1, autoTickMinutes) * 60_000
  );
}

/** Guarded entry point used by both the button and the timer. */
export async function runTick(): Promise<TickSummary | null> {
  const s = useRealmStore.getState();
  if (s.paused || s.advancing) return null;
  s.setAdvancing(true);
  try {
    return await advanceRealm();
  } finally {
    useRealmStore.getState().setAdvancing(false);
  }
}
