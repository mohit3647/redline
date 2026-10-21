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

export function stubModel(fixture: FixtureName, options: StubOptions = {}): AnalysisModel {
  const { sidecar } = loadFixture(fixture);
  const q = (id: string, quote: string) => options.mutateQuote?.[id]?.(quote) ?? quote;
  return {
    async analyse() {
      options.onCall?.();
      if ("rawPayload" in options) return options.rawPayload;
      const flags = sidecar.flags.map((f) => ({
        id: f.id,
        kind: f.kind,
        clauseType: f.clauseType,
        severity: f.expectedSeverityBand,
        sourceSentence: q(f.id, f.sourceSentence),
        claim: `The document says: ${f.clauseType}.`,
        consequence: { low: "Low estimate", high: "High estimate", basis: "Stub basis" },
        counterOffer: `Replacement language for ${f.id}.`,
      }));
      if (options.hallucinatedQuote !== undefined) {
        flags.push({
          id: "hallucinated",
          kind: "risk",
          clauseType: "hallucinated",
          severity: "critical",
          sourceSentence: options.hallucinatedQuote,
          claim: "Invented.",
          consequence: { low: "x", high: "y", basis: "z" },
          counterOffer: "n/a",
        });
      }
      return {
        summary: "Stub summary.",
        fee: { ...sidecar.fee, sourceSentence: q("fee", sidecar.fee.sourceSentence) },
        flags,
        cleared: sidecar.cleared.map((c) => ({
          clauseType: c.clauseType,
          finding: c.finding,
          sourceSentence: q(c.id, c.sourceSentence),
        })),
      };
    },
  };
}
