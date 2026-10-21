import { ANCHOR_WORDS, retier } from "./tier";
import { ANCHOR_TYPES } from "./types";
import type {
  AnchorType,
  Analysis,
  AnalyseOptions,
  AnalysisModel,
  Cleared,
  ContractValue,
  Consequence,
  Dropped,
  ExtractedFee,
  Flag,
  RedLine,
  Severity,
} from "./types";

/**
 * Clause types that are never flags (PRD §5, ADR 0003). Net-60/90 payment terms and mandatory
 * arbitration are survivable and visible, so they rank low on expected cost. The prompt says so,
 * and this table enforces it, because a prompt is a request and this is a guarantee.
 */
const CLEARED_ONLY_NOTES: Record<string, string> = {
  "payment-terms":
    "Listed here, not flagged. Redline ranks payment terms low on expected cost. Read the sentence for the days until payment and for any late interest.",
  arbitration:
    "Listed here, not flagged. Redline ranks mandatory arbitration low on expected cost. Read the sentence for where it is held and who picks the arbitrator.",
};
const CLEARED_ONLY_ALIASES: Record<string, string> = {
  "mandatory-arbitration": "arbitration",
  "class-action-waiver": "arbitration",
};

function clearedOnlyNote(clauseType: string): string | undefined {
  const key = clauseType.trim().toLowerCase();
  return CLEARED_ONLY_NOTES[CLEARED_ONLY_ALIASES[key] ?? key];
}

const SEVERITIES: readonly string[] = ["critical", "serious", "minor"];

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function nonEmpty(v: unknown): string | undefined {
  return typeof v === "string" && v.trim().length > 0 ? v : undefined;
}

type QuoteCheck = { ok: true } | { ok: false; reason: "empty-quote" | "not-verbatim" };

/** ADR 0001: exact substring, no normalisation of any kind. */
function checkQuote(documentText: string, quote: string): QuoteCheck {
  if (quote.trim().length === 0) return { ok: false, reason: "empty-quote" };
  return documentText.includes(quote) ? { ok: true } : { ok: false, reason: "not-verbatim" };
}

const NO_BOUNDS = { lowAmount: null, highAmount: null, currency: null } as const;

/**
 * The numeric ends of a consequence range. A figure the model could not state is null, and so is
 * anything unusable: a negative or non-numeric value, a missing currency, or a low above the high.
 * Unusable means unknown. It is never repaired.
 */
function parseBounds(c: Obj): Pick<Consequence, "lowAmount" | "highAmount" | "currency"> {
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null);
  const lowAmount = num(c.lowAmount);
  const highAmount = num(c.highAmount);
  const currency = nonEmpty(c.currency)?.trim().toUpperCase() ?? null;
  if (highAmount === null || currency === null) return { ...NO_BOUNDS };
  if (lowAmount !== null && lowAmount > highAmount) return { ...NO_BOUNDS };
  return { lowAmount, highAmount, currency };
}

function parseFlag(raw: unknown): Flag | string {
  if (!isObj(raw)) return "flag is not an object";
  const id = nonEmpty(raw.id);
  const clauseType = nonEmpty(raw.clauseType);
  const claim = nonEmpty(raw.claim);
  const counterOffer = nonEmpty(raw.counterOffer);
  if (!id) return "missing id";
  if (!clauseType) return "missing clauseType";
  if (raw.kind !== "risk" && raw.kind !== "confidentiality") return "kind must be risk or confidentiality";
  if (!claim) return "missing claim";
  if (!counterOffer) return "missing counterOffer";
  if (typeof raw.sourceSentence !== "string") return "missing sourceSentence";
  let severity: Severity | null;
  if (raw.severity === null) severity = null;
  else if (typeof raw.severity === "string" && SEVERITIES.includes(raw.severity)) severity = raw.severity as Severity;
  else return "severity must be critical, serious, minor or null";
  const c = raw.consequence;
  if (!isObj(c) || !nonEmpty(c.low) || !nonEmpty(c.high) || !nonEmpty(c.basis)) {
    return "consequence needs low, high and basis";
  }
  const flag: Flag = {
    id,
    kind: raw.kind,
    clauseType,
    severity,
    sourceSentence: raw.sourceSentence,
    claim,
    consequence: { low: str(c.low)!, high: str(c.high)!, basis: str(c.basis)!, ...parseBounds(c) },
    counterOffer,
  };
  if (raw.triggeredByRedLine !== undefined && raw.triggeredByRedLine !== null) {
    const t = nonEmpty(raw.triggeredByRedLine);
    if (!t) return "triggeredByRedLine must be a non-empty string";
    flag.triggeredByRedLine = t;
  }
  return flag;
}

function parseCleared(raw: unknown): Cleared | string {
  if (!isObj(raw)) return "cleared entry is not an object";
  const clauseType = nonEmpty(raw.clauseType);
  const finding = nonEmpty(raw.finding);
  if (!clauseType) return "missing clauseType";
  if (!finding) return "missing finding";
  if (typeof raw.sourceSentence !== "string") return "missing sourceSentence";
  const cleared: Cleared = { clauseType, finding, sourceSentence: raw.sourceSentence };
  const note = clearedOnlyNote(clauseType);
  if (note) cleared.note = note;
  return cleared;
}

function parseFee(raw: unknown): { amount: number; currency: string; sourceSentence: string } | string {
  if (!isObj(raw)) return "fee is not an object";
  if (typeof raw.amount !== "number" || !Number.isFinite(raw.amount) || raw.amount <= 0) return "fee amount must be a number above zero";
  const currency = nonEmpty(raw.currency);
  if (!currency) return "fee currency missing";
  if (typeof raw.sourceSentence !== "string") return "fee sourceSentence missing";
  return { amount: raw.amount, currency, sourceSentence: raw.sourceSentence };
}

export async function analyse(
  documentText: string,
  redLines: RedLine[],
  model: AnalysisModel,
  contractValue?: ContractValue,
  options: AnalyseOptions = {},
): Promise<Analysis> {
  const logger = options.logger ?? ((message: string) => console.warn(message));
  const dropped: Dropped[] = [];
  const drop = (d: Dropped) => {
    dropped.push(d);
    const quote = d.sourceSentence !== undefined ? ` quote=${JSON.stringify(d.sourceSentence)}` : "";
    logger(`[redline] dropped ${d.kind}${d.label ? ` "${d.label}"` : ""}: ${d.reason} (${d.detail})${quote}`, d);
  };

  const raw = await model.analyse({ documentText, redLines, contractValue });

  const result: Analysis = { summary: "", fee: { state: "unknown" }, flags: [], cleared: [], absent: [], reclassified: [], dropped, demoted: [], order: [] };

  if (!isObj(raw)) {
    drop({ kind: "payload", reason: "malformed", detail: "model payload is not an object" });
    return retier(result, contractValue);
  }

  result.summary = str(raw.summary) ?? "";
  if (raw.summary !== undefined && typeof raw.summary !== "string") {
    drop({ kind: "payload", reason: "malformed", label: "summary", detail: "summary is not a string" });
  }

  // Flags
  const movedFlags: Cleared[] = [];
  if (raw.flags !== undefined && !Array.isArray(raw.flags)) {
    drop({ kind: "payload", reason: "malformed", label: "flags", detail: "flags is not an array" });
  }
  for (const item of Array.isArray(raw.flags) ? raw.flags : []) {
    const parsed = parseFlag(item);
    if (typeof parsed === "string") {
      drop({
        kind: "flag",
        reason: "malformed",
        label: isObj(item) ? str(item.id) ?? str(item.clauseType) : undefined,
        sourceSentence: isObj(item) ? str(item.sourceSentence) : undefined,
        detail: parsed,
      });
      continue;
    }
    const check = checkQuote(documentText, parsed.sourceSentence);
    if (!check.ok) {
      drop({
        kind: "flag",
        reason: check.reason,
        label: parsed.id,
        sourceSentence: parsed.sourceSentence,
        detail: check.reason === "empty-quote" ? "source sentence is empty" : "source sentence is not an exact substring of the document",
      });
      continue;
    }
    // The source sentence is verified above, so a moved flag keeps it and the seam's guarantee holds.
    const note = parsed.kind === "risk" ? clearedOnlyNote(parsed.clauseType) : undefined;
    if (note) {
      movedFlags.push({
        clauseType: parsed.clauseType,
        finding: parsed.claim,
        sourceSentence: parsed.sourceSentence,
        note,
      });
      result.reclassified.push({ id: parsed.id, clauseType: parsed.clauseType, from: "flag", to: "cleared" });
      continue;
    }
    result.flags.push(parsed);
    result.order.push(parsed.id);
  }

  // Cleared
  if (raw.cleared !== undefined && !Array.isArray(raw.cleared)) {
    drop({ kind: "payload", reason: "malformed", label: "cleared", detail: "cleared is not an array" });
  }
  for (const item of Array.isArray(raw.cleared) ? raw.cleared : []) {
    const parsed = parseCleared(item);
    if (typeof parsed === "string") {
      drop({
        kind: "cleared",
        reason: "malformed",
        label: isObj(item) ? str(item.clauseType) : undefined,
        sourceSentence: isObj(item) ? str(item.sourceSentence) : undefined,
        detail: parsed,
      });
      continue;
    }
    const check = checkQuote(documentText, parsed.sourceSentence);
    if (!check.ok) {
      drop({
        kind: "cleared",
        reason: check.reason,
        label: parsed.clauseType,
        sourceSentence: parsed.sourceSentence,
        detail: check.reason === "empty-quote" ? "source sentence is empty" : "source sentence is not an exact substring of the document",
      });
      continue;
    }
    result.cleared.push(parsed);
  }
  result.cleared.push(...movedFlags);

  // Absent anchors: a claim about the whole document, so no sentence to verify. Keep the model's
  // claim only when nothing in the verified output contradicts it.
  if (raw.absent !== undefined && !Array.isArray(raw.absent)) {
    drop({ kind: "payload", reason: "malformed", label: "absent", detail: "absent is not an array" });
  }
  const seenTypes = [...result.flags, ...result.cleared].map((x) => x.clauseType.toLowerCase());
  for (const item of Array.isArray(raw.absent) ? raw.absent : []) {
    const anchor = (ANCHOR_TYPES as readonly unknown[]).includes(item) ? (item as AnchorType) : undefined;
    if (!anchor) {
      drop({ kind: "absent", reason: "malformed", label: typeof item === "string" ? item : undefined, detail: "not an anchor clause type" });
      continue;
    }
    if (seenTypes.some((t) => t.split(/[^a-z0-9]+/).some(ANCHOR_WORDS[anchor]))) {
      drop({ kind: "absent", reason: "contradicted", label: anchor, detail: "the analysis also lists a clause of this type" });
      continue;
    }
    if (!result.absent.includes(anchor)) result.absent.push(anchor);
  }

  // Fee (ADR 0006): the model's fee is verified like a flag and kept whatever the tiering uses.
  // A supplied value overrides it only because the signer entered it; the extracted fee stays visible.
  if (raw.fee !== undefined && raw.fee !== null) {
    const parsed = parseFee(raw.fee);
    if (typeof parsed === "string") {
      if (!contractValue) {
        drop({ kind: "fee", reason: "malformed", sourceSentence: isObj(raw.fee) ? str(raw.fee.sourceSentence) : undefined, detail: parsed });
      }
    } else {
      const check = checkQuote(documentText, parsed.sourceSentence);
      if (check.ok) {
        const extracted: ExtractedFee = parsed;
        result.extractedFee = extracted;
      } else if (!contractValue) {
        drop({
          kind: "fee",
          reason: check.reason,
          sourceSentence: parsed.sourceSentence,
          detail: check.reason === "empty-quote" ? "source sentence is empty" : "source sentence is not an exact substring of the document",
        });
      }
    }
  }

  return retier(result, contractValue);
}
