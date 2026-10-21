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
  /** Verbatim substring of the document text. Never empty. */
  sourceSentence: string;
  /** Why the entry sits here and not in the flags. Set in code, never by the model. */
  note?: string;
}

/**
 * The anchor clause types (PRD §5). When the document has no clause of the type, the analysis
 * says so. That is a claim about the whole document, so it carries no source sentence.
 */
export const ANCHOR_TYPES = ["uncapped-indemnity", "ip-assignment", "termination-for-convenience"] as const;
export type AnchorType = (typeof ANCHOR_TYPES)[number];

/** A risk flag the pipeline moved to the cleared list because its clause type is never flagged. */
export interface Reclassified {
  id: string;
  clauseType: string;
  from: "flag";
  to: "cleared";
}

export type Fee =
  | { state: "extracted"; amount: number; currency: string; sourceSentence: string }
  | { state: "supplied"; amount: number; currency: string }
  | { state: "unknown" };

export type DropReason = "not-verbatim" | "empty-quote" | "malformed" | "contradicted";

export interface Dropped {
  kind: "flag" | "cleared" | "fee" | "absent" | "payload";
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
  /** Anchor clause types the model found no clause for, after the contradiction check. */
  absent: AnchorType[];
  /** Flags moved to the cleared list by the pipeline (payment terms, arbitration). */
  reclassified: Reclassified[];
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
