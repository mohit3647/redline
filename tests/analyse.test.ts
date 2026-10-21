import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { analyse } from "../src/lib/analyse";
import type { Dropped } from "../src/lib/analyse";
import { loadFixture, nearMisses, stubModel } from "./helpers/stub-model";

const adhesion = loadFixture("adhesion-contract");
const clean = loadFixture("clean-contract");

let fetchSpy: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchSpy = vi.fn(() => {
    throw new Error("network access attempted");
  });
  vi.stubGlobal("fetch", fetchSpy);
});
afterEach(() => {
  expect(fetchSpy).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});

function run(
  fixture: typeof adhesion,
  name: "adhesion-contract" | "clean-contract",
  opts: Parameters<typeof stubModel>[1] = {},
  contractValue?: { amount: number; currency: string },
) {
  const logger = vi.fn();
  const p = analyse(fixture.text, [], stubModel(name, opts), contractValue, { logger });
  return p.then((analysis) => ({ analysis, logger }));
}

describe("fixtures are consistent with their sidecars", () => {
  it("every sidecar quote is a verbatim substring of its document", () => {
    for (const f of [adhesion, clean]) {
      const quotes = [f.sidecar.fee.sourceSentence, ...f.sidecar.flags.map((x) => x.sourceSentence), ...f.sidecar.cleared.map((x) => x.sourceSentence)];
      for (const q of quotes) expect(f.text.includes(q)).toBe(true);
    }
  });
});

describe("analyse with correct quotes", () => {
  it("returns all flags, cleared entries and the extracted fee for the adhesion contract", async () => {
    const { analysis, logger } = await run(adhesion, "adhesion-contract");
    expect(analysis.flags.map((f) => f.id)).toEqual(adhesion.sidecar.flags.map((f) => f.id));
    expect(analysis.flags.map((f) => f.sourceSentence)).toEqual(adhesion.sidecar.flags.map((f) => f.sourceSentence));
    expect(analysis.cleared.map((c) => c.sourceSentence)).toEqual(adhesion.sidecar.cleared.map((c) => c.sourceSentence));
    expect(analysis.fee).toEqual({ state: "extracted", ...adhesion.sidecar.fee });
    expect(analysis.dropped).toEqual([]);
    expect(logger).not.toHaveBeenCalled();
    expect(analysis.flags.find((f) => f.kind === "confidentiality")?.severity).toBeNull();
  });

  it("returns no flags and a full cleared list for the clean contract", async () => {
    const { analysis } = await run(clean, "clean-contract");
    expect(analysis.flags).toEqual([]);
    expect(analysis.cleared).toHaveLength(clean.sidecar.cleared.length);
    expect(analysis.dropped).toEqual([]);
  });
});

describe("hallucinated quotes", () => {
  it("drops the flag, records it in dropped[], and calls the logger", async () => {
    const fake = "Contractor shall pay Client a penalty of $50,000 for any delay.";
    const { analysis, logger } = await run(adhesion, "adhesion-contract", { hallucinatedQuote: fake });
    expect(analysis.flags.find((f) => f.id === "hallucinated")).toBeUndefined();
    expect(analysis.flags).toHaveLength(adhesion.sidecar.flags.length);
    expect(analysis.dropped).toHaveLength(1);
    expect(analysis.dropped[0]).toMatchObject({ kind: "flag", reason: "not-verbatim", label: "hallucinated", sourceSentence: fake });
    expect(logger).toHaveBeenCalledTimes(1);
    expect(logger.mock.calls[0][0]).toContain("hallucinated");
  });

  it("defaults the logger to console.warn", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const analysis = await analyse(adhesion.text, [], stubModel("adhesion-contract", { hallucinatedQuote: "Not in the document." }));
    expect(analysis.dropped).toHaveLength(1);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it("rejects empty and whitespace-only quotes", async () => {
    for (const quote of ["", "   ", "\n\t"]) {
      const { analysis, logger } = await run(adhesion, "adhesion-contract", { hallucinatedQuote: quote });
      expect(analysis.flags.find((f) => f.id === "hallucinated")).toBeUndefined();
      expect(analysis.dropped[0]).toMatchObject({ reason: "empty-quote" });
      expect(logger).toHaveBeenCalledTimes(1);
    }
  });
});

describe("near-miss quotes are failures", () => {
  const flagId = "uncapped-indemnity";
  const flagQuote = adhesion.sidecar.flags.find((f) => f.id === flagId)!.sourceSentence;
  const variants = nearMisses(flagQuote);

  it("generates distinct variants that really differ from the original", () => {
    expect(Object.keys(variants)).toEqual(expect.arrayContaining(["extraSpace", "changedCase", "droppedInnerPunctuation", "swappedPunctuation", "curlyApostrophe"]));
    for (const v of Object.values(variants)) expect(v).not.toBe(flagQuote);
  });

  for (const name of Object.keys(variants)) {
    it(`drops a flag with a ${name} variant`, async () => {
      const { analysis, logger } = await run(adhesion, "adhesion-contract", { mutateQuote: { [flagId]: (q) => nearMisses(q)[name] } });
      expect(analysis.flags.find((f) => f.id === flagId)).toBeUndefined();
      expect(analysis.dropped).toHaveLength(1);
      expect(analysis.dropped[0]).toMatchObject({ kind: "flag", label: flagId, reason: "not-verbatim" });
      expect(logger).toHaveBeenCalledTimes(1);
    });
  }
});

describe("cleared entries and fee", () => {
  it("drops a cleared entry whose quote is a near miss", async () => {
    const id = "mandatory-arbitration";
    for (const [name, mutate] of Object.entries(nearMisses(adhesion.sidecar.cleared[1].sourceSentence))) {
      const { analysis, logger } = await run(adhesion, "adhesion-contract", { mutateQuote: { [id]: () => mutate } });
      expect(analysis.cleared.map((c) => c.clauseType), name).toEqual(["payment-terms"]);
      expect(analysis.dropped, name).toHaveLength(1);
      expect(analysis.dropped[0], name).toMatchObject({ kind: "cleared", reason: "not-verbatim" });
      expect(logger).toHaveBeenCalledTimes(1);
    }
  });

  it("drops a cleared entry with a hallucinated or empty quote", async () => {
    for (const [quote, reason] of [["Invented sentence.", "not-verbatim"], [" ", "empty-quote"]] as const) {
      const { analysis } = await run(clean, "clean-contract", { mutateQuote: { indemnity: () => quote } });
      expect(analysis.cleared.find((c) => c.clauseType === "indemnity")).toBeUndefined();
      expect(analysis.cleared).toHaveLength(clean.sidecar.cleared.length - 1);
      expect(analysis.dropped[0]).toMatchObject({ kind: "cleared", reason });
    }
  });

  it("falls back to unknown when the extracted fee's sentence does not verify", async () => {
    const { analysis, logger } = await run(adhesion, "adhesion-contract", { mutateQuote: { fee: () => "Client will pay Contractor a fixed fee of $25,000 for the Services." } });
    expect(analysis.fee).toEqual({ state: "unknown" });
    expect(analysis.dropped).toHaveLength(1);
    expect(analysis.dropped[0]).toMatchObject({ kind: "fee", reason: "not-verbatim" });
    expect(logger).toHaveBeenCalledTimes(1);
  });

  it("falls back to unknown for each near-miss fee sentence", async () => {
    for (const [name, v] of Object.entries(nearMisses(adhesion.sidecar.fee.sourceSentence))) {
      const { analysis } = await run(adhesion, "adhesion-contract", { mutateQuote: { fee: () => v } });
      expect(analysis.fee, name).toEqual({ state: "unknown" });
    }
  });

  it("uses a supplied contract value and ignores the model's fee, even a verified one", async () => {
    const { analysis } = await run(adhesion, "adhesion-contract", {}, { amount: 30000, currency: "EUR" });
    expect(analysis.fee).toEqual({ state: "supplied", amount: 30000, currency: "EUR" });
    expect(analysis.dropped).toEqual([]);
  });

  it("is unknown when no value is supplied and the model returns no fee", async () => {
    const { analysis } = await run(adhesion, "adhesion-contract", { rawPayload: { summary: "s", flags: [], cleared: [] } });
    expect(analysis.fee).toEqual({ state: "unknown" });
  });
});

describe("malformed payloads", () => {
  const cases: Array<[string, unknown]> = [
    ["null", null],
    ["a string", "not json"],
    ["an array", []],
    ["flags is not an array", { summary: "s", flags: "nope", cleared: [] }],
    ["cleared is an object", { summary: "s", flags: [], cleared: {} }],
  ];
  for (const [name, rawPayload] of cases) {
    it(`does not crash on ${name} and returns no flags`, async () => {
      const { analysis, logger } = await run(adhesion, "adhesion-contract", { rawPayload });
      expect(analysis.flags).toEqual([]);
      expect(analysis.cleared).toEqual([]);
      expect(analysis.dropped.length).toBeGreaterThan(0);
      expect(logger).toHaveBeenCalled();
    });
  }

  it("drops flags missing required fields instead of returning them bare", async () => {
    const q = adhesion.sidecar.flags[0].sourceSentence;
    const good = {
      id: "ok", kind: "risk", clauseType: "x", severity: "critical", sourceSentence: q,
      claim: "c", consequence: { low: "a", high: "b", basis: "c" }, counterOffer: "o",
    };
    const rawPayload = {
      summary: "s",
      flags: [
        good,
        { id: "no-quote", kind: "risk", clauseType: "x", severity: "critical", claim: "c", consequence: good.consequence, counterOffer: "o" },
        { ...good, id: "bad-severity", severity: "catastrophic" },
        { ...good, id: "no-consequence", consequence: undefined },
        { ...good, id: "no-counter", counterOffer: "" },
        { ...good, id: "numeric-quote", sourceSentence: 42 },
        "just a string",
        null,
      ],
      cleared: [{ clauseType: "x", finding: "f" }, { clauseType: "x", finding: "f", sourceSentence: 7 }],
    };
    const { analysis, logger } = await run(adhesion, "adhesion-contract", { rawPayload });
    expect(analysis.flags.map((f) => f.id)).toEqual(["ok"]);
    expect(analysis.cleared).toEqual([]);
    expect(analysis.dropped).toHaveLength(9);
    expect(analysis.dropped.every((d: Dropped) => d.reason === "malformed")).toBe(true);
    expect(logger).toHaveBeenCalledTimes(9);
  });

  it("drops a malformed fee without throwing", async () => {
    const { analysis } = await run(adhesion, "adhesion-contract", { rawPayload: { summary: "s", flags: [], cleared: [], fee: { amount: "lots", currency: "USD", sourceSentence: adhesion.sidecar.fee.sourceSentence } } });
    expect(analysis.fee).toEqual({ state: "unknown" });
    expect(analysis.dropped[0]).toMatchObject({ kind: "fee", reason: "malformed" });
  });
});

describe("offline", () => {
  it("never calls fetch during analysis", async () => {
    await run(adhesion, "adhesion-contract", { hallucinatedQuote: "nope" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
