import type {
  AgentAction,
  AgentContext,
  AgentEngine,
  RealmSnapshot,
  Report,
  ReportScope,
} from "./AgentEngine";
import { IDLE_SUBJECT, guildRoster, isElder, isGuildLeader, subordinatesOf } from "./bus";
import { routeFor } from "./risk";
import { INITIATIVES, VOICE, pick, type Initiative } from "./mockBehaviour";
import { GUILDS } from "../data/guilds";
import { getCharacter } from "../data/characters";
import { Authority, type Quest } from "../types";

/**
 * Phase 2 mock brain: NOT a random simulator. Each character reads its inbox and
 * its task state and emits real, causally-connected actions — leaders delegate,
 * workers report and escalate, cross-guild asks route through the Elder, and
 * Petitioners raise permission requests before spending anything.
 *
 * The point of this class is that it exercises the ENTIRE agentic substrate
 * (bus, task graph, authority gate, orchestrator budgets) at zero API cost. When
 * ClaudeAgentEngine replaces it, everything downstream is already proven.
 */
export class MockAgentEngine implements AgentEngine {
  async step(ctx: AgentContext): Promise<AgentAction[]> {
    const out: AgentAction[] = [];

    // 1 ── read the post
    for (const msg of ctx.inbox) out.push(...this.handleMessage(ctx, msg));

    // 2 ── sign off on anything a colleague asked you to check
    out.push(...this.verifyForOthers(ctx));

    // 2 ── advance the work you already own
    out.push(...this.doWork(ctx));

    // 3 ── role-specific initiative
    if (isElder(ctx.character.id)) out.push(...this.elderTurn(ctx));
    else if (isGuildLeader(ctx.character.id)) out.push(...this.leaderTurn(ctx));

    return out;
  }

  // ── inbox handling ─────────────────────────────────────────────────────────

  private handleMessage(ctx: AgentContext, msg: AgentContext["inbox"][number]): AgentAction[] {
    const me = ctx.character.id;
    const voice = VOICE[me];
    const out: AgentAction[] = [];

    switch (msg.kind) {
      case "request": {
        // The Elder is the cross-guild switchboard: forward, don't do.
        if (isElder(me)) {
          const target = this.guessTargetGuildLeader(msg.body) ?? null;
          if (target && target !== msg.from) {
            out.push({
              t: "send",
              to: target,
              kind: "request",
              subject: msg.subject,
              body: `${getCharacter(msg.from)?.name ?? msg.from} asks it of you. ${pick(voice.delegate, ctx.tick) ?? ""}`.trim(),
              threadId: msg.threadId,
              taskId: msg.taskId,
            });
          }
          break;
        }

        // Everyone else: take it on as real work, and say so. Guard against
        // creating a second copy when the delegating leader already booked it.
        const title = msg.subject.replace(/^Re:\s*/i, "").replace(/^Aid wanted:\s*/i, "Aid: ");
        const alreadyMine = ctx.tasks.some((q) => q.title === title || q.title === msg.subject);
        if (!alreadyMine) {
          out.push({
            t: "task.create",
            title,
            chunks: [msg.body],
            guildId: ctx.character.guildId ?? "",
            assignTo: me,
            visibility: "internal",
            threadId: msg.threadId,
          });
        }
        out.push({
          t: "send",
          to: msg.from,
          kind: "response",
          subject: `Re: ${msg.subject}`,
          body: pick(voice?.ack ?? ["Understood."], ctx.tick) ?? "Understood.",
          threadId: msg.threadId,
        });
        break;
      }

      case "escalation": {
        // A blocker came up the chain. Push it further up — or to the Chairman
        // if you're the Elder. Never sit on it.
        if (isElder(me)) {
          out.push({
            t: "send",
            to: "chairman",
            kind: "report",
            subject: msg.subject,
            body: `${getCharacter(msg.from)?.name ?? msg.from} is stopped and it needs you. ${msg.body}`,
            threadId: msg.threadId,
            taskId: msg.taskId,
          });
        } else {
          out.push({
            t: "send",
            to: ctx.character.reportsTo ?? "chairman",
            kind: "escalation",
            subject: msg.subject,
            body: msg.body,
            threadId: msg.threadId,
            taskId: msg.taskId,
          });
        }
        break;
      }

      case "report": {
        // Leaders consolidate upward; the Elder consolidates in elderTurn().
        if (isGuildLeader(me) && ctx.character.reportsTo) {
          out.push({
            t: "send",
            to: ctx.character.reportsTo,
            kind: "report",
            subject: `${GUILDS[ctx.character.guildId ?? ""]?.name ?? "Guild"} — word from below`,
            body: `${getCharacter(msg.from)?.name ?? msg.from}: ${msg.body}`,
            threadId: msg.threadId,
          });
        }
        break;
      }

      // responses and broadcasts are informational — consumed, not acted on.
      default:
        break;
    }

    return out;
  }

  // ── doing the actual work ──────────────────────────────────────────────────

  private doWork(ctx: AgentContext): AgentAction[] {
    const out: AgentAction[] = [];
    const me = ctx.character.id;

    // One task per tick — agents that multitask produce noise, not throughput.
    // But a task stuck awaiting a ruling must not idle the whole character:
    // walk past anything that's waiting and work the next thing instead.
    let active: Quest | undefined;
    let init: Initiative | undefined;
    let stepIndex = 0;

    for (const candidate of ctx.tasks.filter((q) => q.status === "in_progress")) {
      const candidateInit = this.initiativeFor(candidate);
      const candidateStep = candidate.log?.length ?? 0;
      const gate = this.permissionGate(ctx, candidate, candidateInit, candidateStep);
      if (gate === "wait") continue; // parked awaiting a decision — try the next
      if (gate) return [gate]; // needs authorising: raise it and stop here
      active = candidate;
      init = candidateInit;
      stepIndex = candidateStep;
      break;
    }
    if (!active) return out;

    // — cross-guild help: addressed to the other guild's leader, which the bus
    //   will refuse and reroute via the Elder. That reroute is the demo. —
    if (init?.needsHelpAt === stepIndex && init.helpFrom) {
      out.push({
        t: "send",
        to: init.helpFrom,
        kind: "request",
        subject: `Aid wanted: ${active.title}`,
        body: init.helpAsk ?? "I need another guild's hand on this.",
        threadId: active.threadId,
        taskId: active.id,
      });
      out.push({ t: "task.progress", taskId: active.id, note: "Word sent asking for aid." });
      return out;
    }

    // — hard block: only the Chairman can clear it —
    if (init?.blockAt === stepIndex && init.blockReason) {
      out.push({ t: "task.block", taskId: active.id, reason: init.blockReason });
      out.push({
        t: "send",
        to: ctx.character.reportsTo ?? "chairman",
        kind: "escalation",
        subject: `Stopped: ${active.title}`,
        body: init.blockReason,
        threadId: active.threadId,
        taskId: active.id,
      });
      return out;
    }

    // — ordinary progress —
    // Ad-hoc work (a decree from you, or a favour asked by another guild) has no
    // script, so fall back to the character's own voice over a few turns rather
    // than completing instantly, which reads as the task being ignored.
    const steps = init?.steps ?? this.improvisedSteps(me);
    const note = steps[Math.min(stepIndex, steps.length - 1)];
    const finished = stepIndex >= steps.length - 1;

    if (finished) {
      out.push({ t: "task.complete", taskId: active.id, note });
      out.push({
        t: "send",
        to: ctx.character.reportsTo ?? "chairman",
        kind: "report",
        subject: `Done: ${active.title}`,
        body: note,
        threadId: active.threadId,
        taskId: active.id,
      });
    } else {
      const progress = Math.round(((stepIndex + 1) / steps.length) * 100);
      out.push({ t: "task.progress", taskId: active.id, note, progress });
      // Workers keep their leader informed; leaders don't spam the Elder every tick.
      if (ctx.character.reportsTo && !isGuildLeader(me) && stepIndex % 2 === 1) {
        out.push({
          t: "send",
          to: ctx.character.reportsTo,
          kind: "report",
          subject: active.title,
          body: note,
          threadId: active.threadId,
          taskId: active.id,
        });
      }
    }

    return out;
  }

  /**
   * THE GATE. An agent states the facts about what it wants to do; the risk
   * matrix decides who rules on it. The agent gets no say in its own band.
   *
   *   routine   → proceed, no interruption to anyone
   *   verified  → a peer must endorse it first (Sam never sees it)
   *   council   → onto the docket, settled in a council session
   *   sovereign → Sam, personally — money and irreversible things only
   *
   * Returns "wait" when the agent must sit still. Checking DECIDED permissions
   * here — not just pending ones — is what stops the nag loop where granting a
   * request immediately makes them ask again.
   */
  private permissionGate(
    ctx: AgentContext,
    task: Quest,
    init: Initiative | undefined,
    stepIndex: number
  ): AgentAction | "wait" | null {
    // ── already resolved by the Chairman or the council? ──
    const forThis = ctx.permissions.filter((p) => p.taskId === task.id);
    if (forThis.some((p) => p.status === "pending")) return "wait";
    if (forThis.some((p) => p.status === "denied")) {
      return { t: "task.block", taskId: task.id, reason: "You refused me leave, so I've stopped here." };
    }
    const granted = forThis.some((p) => p.status === "approved");

    // ── already resolved by a peer? ──
    const checks = ctx.verifications.filter((v) => v.taskId === task.id && v.requesterId === ctx.character.id);
    if (checks.some((v) => v.status === "pending")) return "wait";
    const objected = checks.find((v) => v.status === "objected");
    if (objected) {
      // A peer objected. That does NOT mean the agent may proceed anyway — it
      // escalates to a human decision, which is the whole point of the check.
      if (!forThis.length) {
        return {
          t: "permission",
          taskId: task.id,
          action: init?.permission?.action ?? task.title,
          rationale: `${getCharacter(objected.verifierId)?.name ?? objected.verifierId} objected: ${objected.note ?? "no reason given"}.`,
          factors: { impact: 4, reversibility: 2 },
        };
      }
      return "wait";
    }
    if (checks.some((v) => v.status === "endorsed") || granted) return null; // cleared — crack on

    // ── nothing to authorise at this step? ──
    const flagged = init?.permissionAt === stepIndex && init.permission;
    const petitioner = ctx.authority === Authority.Petitioner && stepIndex === 0 && !init?.permission;
    if (!flagged && !petitioner) return null;

    const ask = init?.permission ?? {
      action: `Begin work on "${task.title}"`,
      rationale: "I'm sworn to ask before I act.",
      factors: { impact: 1, reversibility: 1 } as const,
    };

    // A Steward has earned the benefit of the doubt on the small stuff.
    const band = routeFor(ask.factors);
    if (band === "routine") return null;
    if (band === "verified" && ctx.authority === Authority.Steward) return null;

    if (band === "verified") {
      const verifier = this.pickVerifier(ctx);
      if (!verifier) return null; // nobody to ask — proceed rather than stall
      return { t: "verify.request", taskId: task.id, verifierId: verifier, action: ask.action };
    }

    // council or sovereign — the orchestrator files it in the right place
    return { t: "permission", taskId: task.id, ...ask };
  }

  /**
   * Who checks this agent's work: a peer in their guild, else their leader,
   * else the Elder. Never themselves — a self-endorsement isn't a check.
   */
  private pickVerifier(ctx: AgentContext): string | null {
    const me = ctx.character.id;
    const peers = guildRoster(ctx.character.guildId ?? "").filter((id) => id !== me);
    return peers[0] ?? ctx.character.reportsTo ?? (me === "elder" ? null : "elder");
  }

  /** Answer sign-off requests addressed to this character. */
  private verifyForOthers(ctx: AgentContext): AgentAction[] {
    return ctx.verifications
      .filter((v) => v.verifierId === ctx.character.id && v.status === "pending")
      .map((v) => {
        // The mock verifier is agreeable but not a rubber stamp: it objects to
        // anything whose owning task has already been blocked once.
        const troubled = ctx.guildTasks.some((q) => q.id === v.taskId && q.status === "blocked");
        return {
          t: "verify.resolve" as const,
          verificationId: v.id,
          endorsed: !troubled,
          note: troubled
            ? "This one has stumbled once already — I'd not wave it through."
            : (VOICE[ctx.character.id]?.ack[0] ?? "Checked, and I'm content."),
        };
      });
  }

  // ── leaders: commission work and keep the guild busy ───────────────────────

  private leaderTurn(ctx: AgentContext): AgentAction[] {
    const out: AgentAction[] = [];
    const guildId = ctx.character.guildId;
    if (!guildId) return out;

    // An unanswered offer keeps its title off the menu (otherwise the leader
    // re-offers the same quest forever) but must NOT count as the guild being
    // busy — that made every guild down tools behind the Chairman's inbox.
    const activeWork = ctx.guildTasks.filter((q) => q.status === "in_progress");
    if (activeWork.length >= 2) return out; // genuinely busy

    const next = this.nextInitiative(guildId, [...ctx.guildTasks, ...ctx.guildProposals]);
    if (!next) return out;

    if (next.offerFirst) {
      // Big enough to want your blessing → becomes a "!" and a Journal quest.
      out.push({
        t: "task.offer",
        title: next.title,
        chunks: next.chunks,
        guildId,
        ownerId: ctx.character.id,
      });
      return out;
    }

    // Routine work: delegate it if you have hands, otherwise roll your sleeves up.
    const doer = subordinatesOf(ctx.character.id)[0] ?? ctx.character.id;

    // Link the task graph. If the prerequisite isn't commissioned yet, hold this
    // one back rather than creating work that can't start — the leader will
    // pick it up again once the earlier task exists.
    let dependsOn: string[] | undefined;
    if (next.dependsOnTitle) {
      const prior = ctx.guildTasks.find((q) => q.title === next.dependsOnTitle);
      if (!prior) return out;
      if (prior.status !== "done") dependsOn = [prior.id];
    }

    out.push({
      t: "task.create",
      title: next.title,
      chunks: next.chunks,
      guildId,
      assignTo: doer,
      dependsOn,
      visibility: "internal",
    });
    if (doer !== ctx.character.id) {
      out.push({
        t: "send",
        to: doer,
        kind: "request",
        subject: next.title,
        body: pick(VOICE[ctx.character.id]?.delegate ?? [], ctx.tick) ?? "This one's yours.",
      });
    }

    return out;
  }

  // ── the Elder: realm-wide roll-up ──────────────────────────────────────────

  private elderTurn(ctx: AgentContext): AgentAction[] {
    // If the whole realm has run dry, say so ONCE rather than reporting nothing
    // forever. An idle realm that stays silent looks broken; an idle realm that
    // asks for direction is just waiting on you.
    if (ctx.realmIdle && !ctx.realmIdleAnnounced) {
      return [
        {
          t: "send",
          to: "chairman",
          kind: "escalation",
          subject: IDLE_SUBJECT,
          body: "Every labour we set ourselves is sealed, Sovereign. Set us a task with the quill and we'll move.",
        },
      ];
    }
    if (ctx.realmIdle) return [];

    // Report to the Chairman every third tick — often enough to feel alive,
    // rare enough not to become wallpaper.
    if (ctx.tick % 3 !== 0) return [];
    return [
      {
        t: "send",
        to: "chairman",
        kind: "report",
        subject: `State of the Realm — turn ${ctx.tick}`,
        body: pick(VOICE.elder.report, ctx.tick) ?? "The realm turns.",
      },
    ];
  }

  // ── helpers ────────────────────────────────────────────────────────────────

  /**
   * Match on guild AND title. Title alone let a character in one guild pick up
   * another guild's script wholesale — the Scholars ran the Merchants' launch
   * plan, permission requests and all, purely because a forwarded aid request
   * carried the same subject line.
   */
  private initiativeFor(task: Quest): Initiative | undefined {
    return INITIATIVES.find((i) => i.title === task.title && i.guildId === task.guildId);
  }

  /** Three turns of in-character noise for work that has no script. */
  private improvisedSteps(id: string): string[] {
    const v = VOICE[id];
    return [
      v?.ack[0] ?? "Begun.",
      v?.report[0] ?? "The work advances.",
      v?.report[1] ?? "Finished, and finished properly.",
    ];
  }

  private nextInitiative(guildId: string, existing: Quest[]): Initiative | undefined {
    const seen = new Set(existing.map((q) => q.title));
    return INITIATIVES.find((i) => i.guildId === guildId && !seen.has(i.title));
  }

  /** Crude routing hint for the Elder forwarding a cross-guild ask. */
  private guessTargetGuildLeader(body: string): string | null {
    const lower = body.toLowerCase();
    for (const g of Object.values(GUILDS)) {
      const word = g.name.replace(/^The /, "").split(/[\s']/)[0].toLowerCase();
      if (lower.includes(word)) return g.leaderId;
    }
    return null;
  }

  // ── reporting ──────────────────────────────────────────────────────────────

  report(scope: ReportScope, snap: RealmSnapshot): Report {
    const inScope = (guildId: string) => (scope === "realm" ? true : guildId === scope);
    const quests = snap.quests.filter((q) => inScope(q.guildId));
    const proposals = snap.proposals.filter((p) => inScope(p.guildId));
    const pendingPerms = snap.permissions.filter(
      (p) => p.status === "pending" && inScope(getCharacter(p.characterId)?.guildId ?? "")
    );

    const blocked = quests.filter((q) => q.status === "blocked");
    const tally = {
      needsMe: proposals.length + blocked.length + pendingPerms.length,
      inProgress: quests.filter((q) => q.status === "in_progress").length,
      done: quests.filter((q) => q.status === "done").length,
    };

    const chunks: string[] = [];
    if (scope === "realm") {
      chunks.push(
        tally.needsMe === 0
          ? `Sovereign — ${tally.inProgress} labours advance and nothing waits on you.`
          : `Sovereign — ${tally.needsMe} matter${tally.needsMe === 1 ? "" : "s"} wait on your word; ${tally.inProgress} advance without you.`
      );
      const first = blocked[0] ?? proposals[0];
      if (first) {
        const who = getCharacter(first.ownerId);
        chunks.push(`${who?.name ?? first.ownerId} is the one to see: “${first.title}”.`);
      } else if (tally.done) {
        chunks.push(`${tally.done} sealed since we began. The realm is in good order.`);
      }
    } else {
      const guild = GUILDS[scope];
      chunks.push(
        tally.needsMe > 0
          ? `${tally.needsMe} thing${tally.needsMe === 1 ? "" : "s"} here want your word.`
          : tally.inProgress > 0
            ? `Work proceeds. Nothing yet demands your attention here.`
            : `Quiet. Set us a task and we'll move.`
      );
      if (guild && blocked[0]) chunks.push(blocked[0].blockedReason ?? blocked[0].title);
    }

    return {
      scope,
      title: scope === "realm" ? "State of the Realm" : `${GUILDS[scope]?.name ?? "Guild"} Report`,
      tally,
      chunks,
    };
  }
}
