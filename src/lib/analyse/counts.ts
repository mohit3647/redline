import type { Analysis, Flag } from "./types";

/**
 * Flags that count toward the false-positive budget (PRD criterion 7). The document's own
 * confidentiality clause is flagged because uploading may breach it, not because it is dangerous
 * (ADR 0005), so it is not counted.
 */
export function countBudgetFlags(analysis: Pick<Analysis, "flags">): number {
  return analysis.flags.filter((f) => f.kind === "risk").length;
}

/** True when the flag carries counter-offer text the signer could send. Whitespace is not text. */
export function hasCounterOffer(flag: Pick<Flag, "counterOffer">): boolean {
  return typeof flag.counterOffer === "string" && flag.counterOffer.trim().length > 0;
}

/** How many displayed flags came back without a counter-offer. */
export function countMissingCounterOffers(analysis: Pick<Analysis, "flags">): number {
  return analysis.flags.filter((f) => !hasCounterOffer(f)).length;
}
