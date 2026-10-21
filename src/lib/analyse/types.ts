export type Severity = "critical" | "serious" | "minor";

/** A range statement about what a clause would cost if invoked (ADR 0004). */
export interface Consequence {
  low: string;
  high: string;
  basis: string;
}

export interface Flag {
  id: string;
  kind: "risk" | "confidentiality";
  clauseType: string;
  /** null when the tier depends on a fee that is not known, or for confidentiality flags. */
  severity: Severity | null;
  /** Verbatim substring of the document text. Never empty. */
  sourceSentence: string;
  /** Flat description of what the text says. */
  claim: string;
  consequence: Consequence;
  counterOffer: string;
  triggeredByRedLine?: string;
}

export interface Cleared {
  clauseType: string;
  finding: string;
  sourceSentence: string;
}

export type Fee =
  | { state: "extracted"; amount: number; currency: string; sourceSentence: string }
  | { state: "supplied"; amount: number; currency: string }
  | { state: "unknown" };

export type DropReason = "not-verbatim" | "empty-quote" | "malformed";

export interface Dropped {
  kind: "flag" | "cleared" | "fee" | "payload";
  reason: DropReason;
  /** The clause id or type if one could be read from the raw item. */
  label?: string;
  /** The quote the model supplied, if any. */
  sourceSentence?: string;
  detail: string;
}

export interface Analysis {
  summary: string;
  fee: Fee;
  flags: Flag[];
  cleared: Cleared[];
  dropped: Dropped[];
}

export interface ContractValue {
  amount: number;
  currency: string;
}

export interface RedLine {
  id?: string;
  text: string;
}

/**
 * Raw, unvalidated model output. `analyse` validates it; a model implementation
 * must not be trusted to have done so.
 */
export type RawAnalysisPayload = unknown;

export interface AnalysisModel {
  analyse(input: {
    documentText: string;
    redLines: RedLine[];
    contractValue?: ContractValue;
  }): Promise<RawAnalysisPayload>;
}

export type DropLogger = (message: string, dropped: Dropped) => void;

export interface AnalyseOptions {
  /** Defaults to console.warn. Called once per dropped item. */
  logger?: DropLogger;
}
