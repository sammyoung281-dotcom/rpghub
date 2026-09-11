import type { AgentEngine } from "./AgentEngine";
import { MockAgentEngine } from "./MockAgentEngine";

/**
 * The single agent brain the whole app talks to.
 *
 * `MockAgentEngine` is the default and the permanent zero-cost fallback — it is
 * never deleted. Phase 3 swaps in a Claude-backed engine at runtime via
 * `setAgentEngine()`; because this is a live ES module binding, every importer
 * (notably orchestrator.ts) sees the change without re-importing.
 */
export let agent: AgentEngine = new MockAgentEngine();

/** Swap the brain. Pass a fresh MockAgentEngine to fall back to free/scripted. */
export function setAgentEngine(next: AgentEngine): void {
  agent = next;
}

/** The always-available zero-cost brain. */
export function mockEngine(): AgentEngine {
  return new MockAgentEngine();
}

export type { AgentEngine } from "./AgentEngine";
