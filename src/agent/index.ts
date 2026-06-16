import type { AgentEngine } from "./AgentEngine";
import { MockAgentEngine } from "./MockAgentEngine";

/**
 * The single agent brain the whole app talks to. Swap this one line in Phase 2:
 *   export const agent: AgentEngine = new ClaudeAgentEngine();
 */
export const agent: AgentEngine = new MockAgentEngine();

export type { AgentEngine } from "./AgentEngine";
