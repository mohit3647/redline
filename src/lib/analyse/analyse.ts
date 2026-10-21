import type {
  Analysis,
  AnalyseOptions,
  AnalysisModel,
  Cleared,
  ContractValue,
  Dropped,
  Fee,
  Flag,
  RedLine,
  Severity,
} from "./types";

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
    consequence: { low: str(c.low)!, high: str(c.high)!, basis: str(c.basis)! },
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
  return { clauseType, finding, sourceSentence: raw.sourceSentence };
}

function parseFee(raw: unknown): { amount: number; currency: string; sourceSentence: string } | string {
  if (!isObj(raw)) return "fee is not an object";
  if (typeof raw.amount !== "number" || !Number.isFinite(raw.amount) || raw.amount < 0) return "fee amount must be a non-negative number";
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

  const result: Analysis = { summary: "", fee: { state: "unknown" }, flags: [], cleared: [], dropped };

  if (!isObj(raw)) {
    drop({ kind: "payload", reason: "malformed", detail: "model payload is not an object" });
    if (contractValue) result.fee = { state: "supplied", ...contractValue };
    return result;
  }

  result.summary = str(raw.summary) ?? "";
  if (raw.summary !== undefined && typeof raw.summary !== "string") {
    drop({ kind: "payload", reason: "malformed", label: "summary", detail: "summary is not a string" });
  }

  // Flags
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
    result.flags.push(parsed);
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

  // Fee (ADR 0006): a supplied value wins; the model's fee is only used when none is supplied.
  if (contractValue) {
    result.fee = { state: "supplied", amount: contractValue.amount, currency: contractValue.currency };
  } else if (raw.fee !== undefined && raw.fee !== null) {
    const parsed = parseFee(raw.fee);
    if (typeof parsed === "string") {
      drop({ kind: "fee", reason: "malformed", sourceSentence: isObj(raw.fee) ? str(raw.fee.sourceSentence) : undefined, detail: parsed });
    } else {
      const check = checkQuote(documentText, parsed.sourceSentence);
      if (check.ok) {
        const fee: Fee = { state: "extracted", ...parsed };
        result.fee = fee;
      } else {
        drop({
          kind: "fee",
          reason: check.reason,
          sourceSentence: parsed.sourceSentence,
          detail: check.reason === "empty-quote" ? "source sentence is empty" : "source sentence is not an exact substring of the document",
        });
      }
    }
  }

  return result;
}
