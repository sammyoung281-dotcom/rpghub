import type { RiskBand, RiskFactors } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// THE RISK MATRIX — the single place that decides who decides.
//
// Every action an agent wants to take is scored, and the score picks one of four
// routes. This replaces "ask the Chairman about everything", which stalled the
// realm behind his inbox.
//
//   routine   → just do it, and log it.
//   verified  → do it, but another agent must sign off first (peer review).
//   council   → goes on the docket, decided in a batch council session.
//   sovereign → the Chairman decides this one personally, on its own.
//
// Two axes, the way an ops risk matrix normally works:
//   IMPACT         how much it matters if this goes wrong        (1–4)
//   REVERSIBILITY  how hard it is to undo                        (1–3)
//
// Score = impact × reversibility (1–12), then these overrides win regardless:
//   • anything IRREVERSIBLE goes to the Chairman. Always. No exceptions.
//   • anything costing more than `sovereignCost` goes to the Chairman.
//   • anything externally visible (published, sent, posted) at impact ≥ 3 too.
//
// All thresholds are data. Tune them here; nothing else needs to change.
// ─────────────────────────────────────────────────────────────────────────────

export const RISK_CONFIG = {
  /** Any spend above this needs the Chairman personally. £. */
  sovereignCost: 25,
  /** Score at or below this is routine — act freely. */
  routineMax: 3,
  /** Score at or below this needs a peer to sign off. */
  verifiedMax: 6,
  /** Score at or below this goes to the council docket. Above → the Chairman. */
  councilMax: 9,
};

export const IMPACT_LABEL: Record<number, string> = {
  1: "Trivial",
  2: "Minor",
  3: "Significant",
  4: "Severe",
};

export const REVERSIBILITY_LABEL: Record<number, string> = {
  1: "Easily undone",
  2: "Recoverable with effort",
  3: "Cannot be undone",
};

export const BAND_LABEL: Record<RiskBand, string> = {
  routine: "Routine — act freely",
  verified: "Needs a second pair of eyes",
  council: "For the council to settle",
  sovereign: "The Sovereign decides",
};

/** Raw score before overrides. 1–12. */
export function scoreRisk(f: RiskFactors): number {
  return f.impact * f.reversibility;
}

/**
 * Who decides. Pure — same answer for the mock brains and for a real Claude
 * agent, which is the point: an agent cannot talk its way past the matrix.
 */
export function routeFor(f: RiskFactors): RiskBand {
  // ── hard overrides ──
  if (f.reversibility === 3) return "sovereign"; // cannot be undone
  if ((f.cost ?? 0) > RISK_CONFIG.sovereignCost) return "sovereign";
  if (f.external && f.impact >= 3) return "sovereign";

  const score = scoreRisk(f);
  if (score > RISK_CONFIG.councilMax) return "sovereign";

  // any spend at all is at least a council matter
  if ((f.cost ?? 0) > 0) return score > RISK_CONFIG.verifiedMax ? "council" : "council";

  if (score > RISK_CONFIG.verifiedMax) return "council";
  if (score > RISK_CONFIG.routineMax) return "verified";
  return "routine";
}

/** One line explaining the routing, shown to the Chairman so it's never opaque. */
export function explainRoute(f: RiskFactors): string {
  if (f.reversibility === 3) return "This cannot be undone, so it is yours to call.";
  if ((f.cost ?? 0) > RISK_CONFIG.sovereignCost)
    return `£${f.cost} leaves the treasury — above the £${RISK_CONFIG.sovereignCost} mark, so you rule on it.`;
  if (f.external && f.impact >= 3) return "This goes out into the world where others will see it.";

  const band = routeFor(f);
  const score = scoreRisk(f);
  switch (band) {
    case "sovereign":
      return `Weighted ${score} of 12 — heavy enough to want your own hand on it.`;
    case "council":
      return (f.cost ?? 0) > 0
        ? `£${f.cost} is small, but coin is coin — the council will settle it.`
        : `Weighted ${score} of 12 — the council can settle this without troubling you.`;
    case "verified":
      return `Weighted ${score} of 12 — one other pair of eyes and it may proceed.`;
    default:
      return `Weighted ${score} of 12 — routine. It simply gets done.`;
  }
}

/** Compact badge text, e.g. "Significant · Recoverable · £79". */
export function describeRisk(f: RiskFactors): string {
  const bits = [IMPACT_LABEL[f.impact], REVERSIBILITY_LABEL[f.reversibility]];
  if (f.cost) bits.push(`£${f.cost}`);
  if (f.external) bits.push("goes public");
  return bits.join(" · ");
}
