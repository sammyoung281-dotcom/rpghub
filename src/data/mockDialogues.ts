import type { Dialogue } from "../types";

/**
 * Scripted placeholder dialogue, keyed by characterId. This is throwaway Phase-1
 * content — in Phase 2 the AgentEngine produces these dynamically. `onResolve`
 * is attached by the caller (it varies by context: a quest vs a report).
 */
export const MOCK_DIALOGUES: Record<string, Omit<Dialogue, "onResolve">> = {
  brannock: {
    id: "dlg-brannock",
    speakerName: "Brannock Quillfeather",
    speakerTitle: "Master of the Merchant's Guild",
    portrait: "🦊",
    accent: "#b8860b",
    chunks: [
      "My liege — a window has opened. A small game of mine could launch this very fortnight.",
      "But the testing is unfinished, and coin must be spent on it. I'll not gamble the treasury without your nod.",
    ],
    choices: [
      { id: "accept", label: "Grant the venture", tone: "accept" },
      { id: "decline", label: "Hold for now", tone: "decline" },
    ],
  },
  elder: {
    id: "dlg-elder",
    speakerName: "Maeve the Elder",
    speakerTitle: "Voice of the High Council",
    portrait: "🦉",
    accent: "#7b5fa0",
    chunks: [
      "Sovereign. The realm turns steadily — three labours advance, one awaits your word.",
      "When you are ready, summon a full council and I shall lay the whole realm before you.",
    ],
    choices: [{ id: "ok", label: "I have heard, Elder", tone: "neutral" }],
  },
};
