import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AnalysisModel } from "../../src/lib/analyse";

const FIXTURES = join(__dirname, "..", "fixtures");

export type FixtureName = "adhesion-contract" | "clean-contract";

export interface Sidecar {
  fee: { amount: number; currency: string; sourceSentence: string };
  flags: Array<{ id: string; clauseType: string; kind: "risk" | "confidentiality"; expectedSeverityBand: string | null; sourceSentence: string }>;
  cleared: Array<{ id: string; clauseType: string; finding: string; sourceSentence: string }>;
}

export function loadFixture(name: FixtureName): { text: string; sidecar: Sidecar } {
  return {
    text: readFileSync(join(FIXTURES, `${name}.txt`), "utf8"),
    sidecar: JSON.parse(readFileSync(join(FIXTURES, `${name}.expected.json`), "utf8")) as Sidecar,
  };
}

export interface StubOptions {
  /** Appends a flag whose quote appears nowhere in the document. */
  hallucinatedQuote?: string;
  /** Rewrites the quote of the flag with this id (or cleared id, or "fee"). */
  mutateQuote?: Record<string, (quote: string) => string>;
  /** Replaces the whole payload, for malformed-output tests. */
  rawPayload?: unknown;
  /** Extra risk flags appended as-is (the quote must still be real for it to survive). */
  extraFlags?: Array<{ id: string; clauseType: string; sourceSentence: string }>;
  /** Cleared ids to leave out of the payload. */
  omitCleared?: string[];
  /** Anchor types the stub claims are absent. */
  absent?: string[];
  /** Leaves the fee out of the payload, as when the document states none. */
  noFee?: boolean;
  /**
   * Numeric consequence bounds by flag id, in the currency given. Merged over the defaults.
   * A flag with no entry has no figure in the text, so all three are null.
   */
  bounds?: Record<string, { low: number | null; high: number | null; currency: string | null }>;
  /** Replaces the summary the stub returns (any value, to test malformed output). */
  summary?: unknown;
  /** Counter-offer text by flag id. */
  counterOffers?: Record<string, unknown>;
  /** Fields merged over a sidecar flag by id, e.g. a severity or a kind the model should not have used. */
  flagOverrides?: Record<string, Record<string, unknown>>;
  /** Called on each model invocation. */
  onCall?: () => void;
}

/**
 * Near-miss variants of a sentence: each differs from it by one character-level change.
 * (Truncating the end is deliberately absent: a prefix is a true substring and passes ADR 0001's check.)
 */
export function nearMisses(quote: string): Record<string, string> {
  const m: Record<string, string> = {
    extraSpace: quote.replace(" ", "  "),
    changedCase: quote.replace(/^./, (c) => c.toLowerCase() === c ? c.toUpperCase() : c.toLowerCase()),
    swappedPunctuation: quote.replace(/[.]$/, ";"),
    swappedInnerPunctuation: quote.includes(",") ? quote.replace(",", ";") : quote.replace(".", ","),
    droppedInnerPunctuation: quote.includes(",") ? quote.replace(",", "") : quote.replace(/\(|\)/, ""),
    trailingSpace: quote + " ",
  };
  if (/'/.test(quote)) m.curlyApostrophe = quote.replace(/'/g, "’");
  if (/"/.test(quote)) m.curlyQuotes = quote.replace(/"/g, "“");
  return m;
}

/**
 * No clause in the adhesion contract states a figure for the most it could cost the signer. The
 * liability cap limits what the signer can recover, so its $2,000 is not a cost bound and the stub
 * gives it none. Tests that need a bound pass `bounds`.
 */
export const DEFAULT_BOUNDS: NonNullable<StubOptions["bounds"]> = {};

const NO_BOUND = { low: null, high: null, currency: null };

export function stubModel(fixture: FixtureName, options: StubOptions = {}): AnalysisModel {
  const { sidecar } = loadFixture(fixture);
  const boundFor = (id: string) => {
    const b = { ...DEFAULT_BOUNDS, ...options.bounds }[id] ?? NO_BOUND;
    return { lowAmount: b.low, highAmount: b.high, currency: b.currency };
  };
  const q = (id: string, quote: string) => options.mutateQuote?.[id]?.(quote) ?? quote;
  return {
    async analyse() {
      options.onCall?.();
      if ("rawPayload" in options) return options.rawPayload;
      const flags: Array<Record<string, unknown>> = sidecar.flags.map((f) => ({
        id: f.id,
        kind: f.kind,
        clauseType: f.clauseType,
        severity: f.expectedSeverityBand,
        sourceSentence: q(f.id, f.sourceSentence),
        claim: `The document says: ${f.clauseType}.`,
        consequence: { low: "Low estimate", high: "High estimate", basis: "Stub basis", ...boundFor(f.id) },
        counterOffer: options.counterOffers && f.id in options.counterOffers ? options.counterOffers[f.id] : `Replacement language for ${f.id}.`,
        ...options.flagOverrides?.[f.id],
      }));
      if (options.hallucinatedQuote !== undefined) {
        flags.push({
          id: "hallucinated",
          kind: "risk",
          clauseType: "hallucinated",
          severity: "critical",
          sourceSentence: options.hallucinatedQuote,
          claim: "Invented.",
          consequence: { low: "x", high: "y", basis: "z", lowAmount: null, highAmount: null, currency: null },
          counterOffer: "n/a",
        });
      }
      for (const e of options.extraFlags ?? []) {
        flags.push({
          id: e.id,
          kind: "risk",
          clauseType: e.clauseType,
          severity: "serious",
          sourceSentence: e.sourceSentence,
          claim: `The document says: ${e.clauseType}.`,
          consequence: { low: "Low estimate", high: "High estimate", basis: "Stub basis", ...boundFor(e.id) },
          counterOffer: `Replacement language for ${e.id}.`,
        });
      }
      return {
        summary: "summary" in options ? options.summary : "Stub summary.",
        absent: options.absent ?? [],
        fee: options.noFee ? null : { ...sidecar.fee, sourceSentence: q("fee", sidecar.fee.sourceSentence) },
        flags,
        cleared: sidecar.cleared.filter((c) => !options.omitCleared?.includes(c.id)).map((c) => ({
          clauseType: c.clauseType,
          finding: c.finding,
          sourceSentence: q(c.id, c.sourceSentence),
        })),
      };
    },
  };
}

/** A clause type that is not fixed-tier, used where a test needs a bound under the fee. */
export const BOUNDED_ID = "non-compete";
/** PRD §5 defines this type as Serious by construction, so no fee moves it. */
export const FIXED_ID = "liability-cap-below-value";
