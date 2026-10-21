import type { Flag, Severity } from "./types";

const RANK: Record<Severity, number> = { critical: 0, serious: 1, minor: 2 };

/**
 * Risk flags in severity order (critical, serious, minor), keeping the model's order inside a
 * tier. Confidentiality flags sit outside the tiers (ADR 0005) and are returned separately.
 */
export function orderFlags(flags: readonly Flag[]): { ranked: Flag[]; confidentiality: Flag[] } {
  const ranked = flags
    .filter((f) => f.kind === "risk")
    .map((flag, index) => ({ flag, index }))
    .sort((a, b) => rank(a.flag) - rank(b.flag) || a.index - b.index)
    .map((x) => x.flag);
  return { ranked, confidentiality: flags.filter((f) => f.kind === "confidentiality") };
}

function rank(f: Flag): number {
  return f.severity === null ? 3 : RANK[f.severity];
}
