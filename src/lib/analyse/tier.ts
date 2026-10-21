import { ANCHOR_TYPES } from "./types";
import type { AnchorType, Analysis, Cleared, ContractValue, Fee, Flag, Reclassified, TierBasis } from "./types";

/** Word tests on a clause type's hyphen-separated words: a match means the type is one of the anchors. */
export const ANCHOR_WORDS: Record<AnchorType, (word: string) => boolean> = {
  "uncapped-indemnity": (w) => w.startsWith("indemn"),
  "ip-assignment": (w) => w === "ip",
  "termination-for-convenience": (w) => w.startsWith("terminat"),
};

export function isAnchorClause(clauseType: string): boolean {
  const words = clauseType.toLowerCase().split(/[^a-z0-9]+/);
  return ANCHOR_TYPES.some((a) => words.some(ANCHOR_WORDS[a]));
}

/**
 * Clause types whose definition already encodes the fee comparison (PRD §5: a liability cap below
 * the contract value is Serious by construction). Its figure limits what the signer can recover,
 * not what it can cost them, so the fee never moves it.
 */
const FIXED_TIER_TYPES = new Set(["liability-cap-below-value"]);

export function isFixedTier(clauseType: string): boolean {
  return FIXED_TIER_TYPES.has(clauseType.trim().toLowerCase());
}

/** The sentence shown where a tier depends on a fee nobody has given (ADR 0006, ticket 06). */
export const FEE_UNKNOWN_NOTE =
  "Serious or minor depends on the fee, which this document does not state. Enter the contract value to split them.";

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

/** Validates what the signer typed. The amount must be a number above zero; the currency a three-letter code. */
export function parseContractValue(amountText: string, currencyText: string): { ok: true; value: ContractValue } | { ok: false; message: string } {
  const cleaned = amountText.trim().replace(/^[$€£]/, "").replace(/[,\s]/g, "");
  if (!/^\d+(\.\d+)?$/.test(cleaned) || !Number.isFinite(Number(cleaned)) || Number(cleaned) <= 0) {
    return { ok: false, message: "Enter the contract value as a number above zero, such as 24000." };
  }
  const currency = currencyText.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) return { ok: false, message: "Enter the currency as a three-letter code, such as USD." };
  return { ok: true, value: { amount: Number(cleaned), currency } };
}

function validValue(v: ContractValue | undefined): ContractValue | undefined {
  if (!v) return undefined;
  if (typeof v.amount !== "number" || !Number.isFinite(v.amount) || v.amount <= 0) return undefined;
  if (typeof v.currency !== "string" || v.currency.trim() === "") return undefined;
  return { amount: v.amount, currency: v.currency.trim().toUpperCase() };
}

/** The fee the tiering uses: a supplied value overrides an extracted one only because the signer entered it. */
export function chooseFee(extracted: Analysis["extractedFee"], contractValue: ContractValue | undefined): Fee {
  const supplied = validValue(contractValue);
  if (supplied) return { state: "supplied", ...supplied };
  if (extracted && extracted.amount > 0) return { state: "extracted", ...extracted };
  return { state: "unknown" };
}

type Tiered = { flag: Flag; minor: boolean };

function tierOne(flag: Flag, fee: Fee): Tiered {
  // Confidentiality flags sit outside the tiers (ADR 0005). Critical is never changed by the fee.
  if (flag.kind !== "risk") return { flag, minor: false };
  const base = { ...flag };
  delete base.tierNote;
  if (flag.severity === "critical") return { flag: { ...base, tierBasis: "unboundedness" }, minor: false };
  if (isFixedTier(flag.clauseType)) return { flag: { ...base, severity: flag.severity ?? "serious", tierBasis: "definition" }, minor: false };
  // Named anchors have no natural limit, so the fee does not move them.
  if (isAnchorClause(flag.clauseType)) return { flag: { ...base, severity: flag.severity ?? "serious", tierBasis: "unboundedness" }, minor: false };

  // A red line may raise a tier and never lowers one, and the fee never moves a flag it triggered.
  // With the fee unknown the tier stays the one the model gave, not an open one.
  if (flag.triggeredByRedLine) {
    return { flag: { ...base, severity: "serious", tierBasis: "red-line" }, minor: false };
  }

  if (fee.state === "unknown") return { flag: { ...base, severity: null, tierBasis: "fee-unknown" }, minor: false };

  const basis: TierBasis = fee.state === "extracted" ? "fee-extracted" : "fee-supplied";
  const serious = (tierNote?: string): Tiered => {
    const f: Flag = { ...base, severity: "serious", tierBasis: basis };
    if (tierNote) f.tierNote = tierNote;
    return { flag: f, minor: false };
  };
  const c = flag.consequence;
  const high = c.highAmount;
  if (typeof high !== "number" || !Number.isFinite(high) || !c.currency) {
    return serious("Stays serious: the document gives no figure for the most this could cost, so it cannot be shown to be below the fee.");
  }
  if (c.currency.toUpperCase() !== fee.currency.toUpperCase()) {
    return serious(`Stays serious: the most this could cost is stated in ${c.currency.toUpperCase()} and the fee is in ${fee.currency}, so the two cannot be compared.`);
  }
  if (high <= fee.amount) return { flag: { ...base, severity: "minor", tierBasis: basis }, minor: true };
  return serious();
}

function demotedEntry(flag: Flag, fee: Extract<Fee, { amount: number }>): Cleared {
  const high = formatMoney(flag.consequence.highAmount ?? 0, fee.currency);
  return {
    clauseType: flag.clauseType,
    finding: flag.claim,
    sourceSentence: flag.sourceSentence,
    note: `Listed here, not flagged. The most this could cost is ${high}, at or below the fee of ${formatMoney(fee.amount, fee.currency)}. Basis: ${flag.consequence.basis}`,
    fromFlagId: flag.id,
  };
}

/**
 * Tiers every flag against the fee and returns a new analysis. Pure: no model call, no clock, no
 * network. The signer changing the contract value runs this in the browser.
 *
 * - Critical is never changed. Named anchors keep the tier they were given.
 * - Other risk flags are minor when their stated upper bound is at or below the fee. They move to
 *   the cleared list with a note, keeping their verified sentence, and are recorded in `reclassified`.
 * - A flag with no usable bound stays serious and says why. With no known fee, the tier is left
 *   open (`severity` null, `tierBasis` "fee-unknown").
 *
 * Passing no contract value returns to the extracted fee if the document stated one.
 */
export function retier(analysis: Analysis, contractValue?: ContractValue): Analysis {
  const fee = chooseFee(analysis.extractedFee, contractValue);

  const pool = [...analysis.flags, ...analysis.demoted];
  const rank = (f: Flag) => {
    const i = analysis.order.indexOf(f.id);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  pool.sort((a, b) => rank(a) - rank(b));

  const flags: Flag[] = [];
  const demoted: Flag[] = [];
  const moved: Cleared[] = [];
  const reclassified: Reclassified[] = analysis.reclassified.filter((r) => r.reason !== "below-fee");
  for (const f of pool) {
    const t = tierOne(f, fee);
    if (t.minor && fee.state !== "unknown") {
      demoted.push(t.flag);
      moved.push(demotedEntry(t.flag, fee));
      reclassified.push({ id: t.flag.id, clauseType: t.flag.clauseType, from: "flag", to: "cleared", reason: "below-fee" });
    } else {
      flags.push(t.flag);
    }
  }

  const cleared = [...analysis.cleared.filter((c) => c.fromFlagId === undefined), ...moved];
  return { ...analysis, fee, flags, demoted, cleared, reclassified };
}
