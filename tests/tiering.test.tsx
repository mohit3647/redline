import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ANALYSIS_JSON_SCHEMA, FEE_UNKNOWN_NOTE, analyse, orderFlags, parseContractValue, retier } from "../src/lib/analyse";
import type { Analysis, ContractValue } from "../src/lib/analyse";
import { AnalysisView } from "../src/components/analysis-view";
import { SYSTEM_PROMPT } from "../src/lib/model/prompt";
import { BOUNDED_ID, FIXED_ID, loadFixture, stubModel } from "./helpers/stub-model";

type StubOpts = NonNullable<Parameters<typeof stubModel>[1]>;
const adhesion = loadFixture("adhesion-contract");
const FEE = adhesion.sidecar.fee.amount; // 24,000 USD, stated in the document
const capSentence = adhesion.sidecar.flags.find((f) => f.id === BOUNDED_ID)!.sourceSentence;
const fixedSentence = adhesion.sidecar.flags.find((f) => f.id === FIXED_ID)!.sourceSentence;
/** A stated cost bound of $2,000 on the bounded clause: under the $24,000 fee. */
const UNDER = { bounds: { [BOUNDED_ID]: { low: 0, high: 2000, currency: "USD" } } } satisfies StubOpts;

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

const run = (opts: StubOpts = {}, value?: ContractValue) =>
  analyse(adhesion.text, [], stubModel("adhesion-contract", opts), value, { logger: () => {} });
const byId = (a: Analysis, id: string) => [...a.flags, ...a.demoted].find((f) => f.id === id)!;
const usd = (high: number | null) => ({ low: high === null ? null : 0, high, currency: high === null ? null : "USD" });

describe("extracted fee: the rule", () => {
  it("moves a flag whose stated bound is under the fee to the cleared list, keeping its verified sentence and a note", async () => {
    const a = await run(UNDER);
    expect(a.fee).toEqual({ state: "extracted", ...adhesion.sidecar.fee });
    expect(a.flags.find((f) => f.id === BOUNDED_ID)).toBeUndefined();
    const entry = a.cleared.find((c) => c.fromFlagId === BOUNDED_ID)!;
    expect(entry.sourceSentence).toBe(capSentence);
    expect(adhesion.text.includes(entry.sourceSentence)).toBe(true);
    expect(entry.note).toContain("Listed here, not flagged.");
    expect(entry.note).toContain("$2,000");
    expect(entry.note).toContain("$24,000");
    expect(a.reclassified).toContainEqual({ id: BOUNDED_ID, clauseType: BOUNDED_ID, from: "flag", to: "cleared", reason: "below-fee" });
    expect(byId(a, BOUNDED_ID).severity).toBe("minor");
    expect(byId(a, BOUNDED_ID).tierBasis).toBe("fee-extracted");
  });

  it("leaves Critical as assigned, with the clause itself as the basis", async () => {
    const a = await run({ bounds: { "uncapped-indemnity": usd(1) } }); // even a tiny stated bound
    for (const id of ["uncapped-indemnity", "ip-assignment-overbroad"]) {
      expect(byId(a, id).severity).toBe("critical");
      expect(byId(a, id).tierBasis).toBe("unboundedness");
    }
  });

  it("keeps the termination anchor as assigned, whatever the bound", async () => {
    const a = await run({ bounds: { "termination-for-convenience": usd(100) } });
    expect(byId(a, "termination-for-convenience")).toMatchObject({ severity: "serious", tierBasis: "unboundedness" });
  });

  it("a bound equal to the fee is minor; one cent over stays serious", async () => {
    const at = await run({ bounds: { "non-compete": usd(FEE) } });
    expect(byId(at, "non-compete").severity).toBe("minor");
    expect(at.flags.find((f) => f.id === "non-compete")).toBeUndefined();
    const over = await run({ bounds: { "non-compete": usd(FEE + 0.01) } });
    expect(byId(over, "non-compete")).toMatchObject({ severity: "serious", tierBasis: "fee-extracted" });
    expect(byId(over, "non-compete").tierNote).toBeUndefined();
    expect(over.flags.some((f) => f.id === "non-compete")).toBe(true);
  });

  it("a null bound stays serious and says why", async () => {
    const a = await run();
    for (const id of ["non-compete", "unlimited-revisions", "unilateral-amendment"]) {
      const f = byId(a, id);
      expect(f.severity).toBe("serious");
      expect(f.tierBasis).toBe("fee-extracted");
      expect(f.tierNote).toMatch(/no figure/);
    }
  });

  it("does not use a bound stated in another currency", async () => {
    const a = await run({ bounds: { [BOUNDED_ID]: { low: 0, high: 2000, currency: "EUR" } } });
    expect(byId(a, BOUNDED_ID)).toMatchObject({ severity: "serious" });
    expect(byId(a, BOUNDED_ID).tierNote).toMatch(/EUR.*USD/);
  });

  it("treats unusable bounds as unknown: a low above the high, or a string", async () => {
    const lowAbove = await run({ bounds: { [BOUNDED_ID]: { low: 5000, high: 2000, currency: "USD" } } });
    expect(byId(lowAbove, BOUNDED_ID).severity).toBe("serious");
    expect(byId(lowAbove, BOUNDED_ID).consequence.highAmount).toBeNull();
    const asString = await run({ bounds: { [BOUNDED_ID]: { low: 0, high: "2000" as unknown as number, currency: "USD" } } });
    expect(byId(asString, BOUNDED_ID).severity).toBe("serious");
  });

  it("never lowers a flag the signer's red line raised", async () => {
    const withRedLine = {
      summary: "s",
      fee: adhesion.sidecar.fee,
      absent: [],
      cleared: [],
      flags: [
        {
          id: "cap", kind: "risk", clauseType: "non-compete", severity: "serious", sourceSentence: capSentence, claim: "c",
          consequence: { low: "a", high: "b", basis: "c", lowAmount: 0, highAmount: 2000, currency: "USD" },
          counterOffer: "o", triggeredByRedLine: "No liability caps",
        },
      ],
    };
    const a = await run({ rawPayload: withRedLine });
    expect(a.flags).toHaveLength(1);
    expect(a.flags[0]).toMatchObject({ severity: "serious", tierBasis: "fee-extracted" });
    expect(a.flags[0].tierNote).toMatch(/red line/);
  });
});

describe("fixed-tier clause types", () => {
  const cap = (a: Analysis) => a.flags.find((f) => f.id === FIXED_ID)!;
  // The cap's $2,000 limits what the signer recovers. A model that put it in highAmount must not move the flag.
  const withBound = { bounds: { [FIXED_ID]: { low: 0, high: 2000, currency: "USD" } } };

  it("liability cap below value stays serious under the $24,000 extracted fee, even with a bound under it", async () => {
    for (const opts of [{}, withBound]) {
      const a = await run(opts);
      expect(a.fee.state).toBe("extracted");
      expect(cap(a)).toMatchObject({ severity: "serious", tierBasis: "definition" });
      expect(a.cleared.some((c) => c.sourceSentence === fixedSentence)).toBe(false);
      expect(a.reclassified.some((r) => r.id === FIXED_ID)).toBe(false);
    }
  });

  it("stays serious, not fee-unknown, when the fee is unknown", async () => {
    for (const opts of [{ noFee: true }, { noFee: true, ...withBound }]) {
      const a = await run(opts);
      expect(a.fee).toEqual({ state: "unknown" });
      expect(cap(a)).toMatchObject({ severity: "serious", tierBasis: "definition" });
    }
  });

  it("stays serious under any supplied value, and through retier in both directions", async () => {
    const base = await run({ noFee: true, ...withBound });
    for (const amount of [500, 24000, 1_000_000]) {
      const r = retier(base, { amount, currency: "USD" });
      expect(cap(r)).toMatchObject({ severity: "serious", tierBasis: "definition" });
      expect(r.demoted.some((f) => f.id === FIXED_ID)).toBe(false);
    }
  });

  it("the view does not say the cap's tier depends on the fee", async () => {
    const html = renderToStaticMarkup(<AnalysisView analysis={await run({ noFee: true })} />);
    expect(html).toContain("a cap below the contract value is serious whatever the fee");
  });
});

describe("fee unknown", () => {
  it("leaves Critical unchanged and marks every other risk flag as depending on the fee", async () => {
    const a = await run({ noFee: true, ...UNDER });
    expect(a.fee).toEqual({ state: "unknown" });
    expect(a.extractedFee).toBeUndefined();
    expect(a.demoted).toEqual([]);
    expect(byId(a, "uncapped-indemnity")).toMatchObject({ severity: "critical", tierBasis: "unboundedness" });
    expect(byId(a, "ip-assignment-overbroad")).toMatchObject({ severity: "critical", tierBasis: "unboundedness" });
    for (const id of [BOUNDED_ID, "unlimited-revisions", "unilateral-amendment"]) {
      expect(byId(a, id)).toMatchObject({ severity: null, tierBasis: "fee-unknown" });
    }
    expect(a.flags.some((f) => f.id === BOUNDED_ID)).toBe(true); // nothing is guessed away
    expect(byId(a, "confidentiality").tierBasis).toBeUndefined();
  });

  it("still orders the undecided flags after Critical and before nothing is lost", async () => {
    const a = await run({ noFee: true });
    const { ranked } = orderFlags(a.flags);
    expect(ranked.map((f) => f.severity).slice(0, 2)).toEqual(["critical", "critical"]);
    expect(ranked).toHaveLength(adhesion.sidecar.flags.filter((f) => f.kind === "risk").length);
  });

  it("an extracted fee whose sentence fails the exactness check is not used", async () => {
    const a = await run({ mutateQuote: { fee: (q) => q.replace("$24,000", "$25,000") } });
    expect(a.fee).toEqual({ state: "unknown" });
    expect(byId(a, BOUNDED_ID).tierBasis).toBe("fee-unknown");
  });
});

describe("supplied fee", () => {
  it("overrides the extracted fee, which stays on the analysis", async () => {
    const a = await run(UNDER, { amount: 1000, currency: "USD" });
    expect(a.fee).toEqual({ state: "supplied", amount: 1000, currency: "USD" });
    expect(a.extractedFee).toEqual(adhesion.sidecar.fee);
    expect(byId(a, BOUNDED_ID)).toMatchObject({ severity: "serious", tierBasis: "fee-supplied" }); // 2,000 > 1,000
    expect(a.flags.some((f) => f.id === BOUNDED_ID)).toBe(true);
  });

  it("splits flags when the document states no fee", async () => {
    const a = await run({ noFee: true, ...UNDER }, { amount: 50000, currency: "usd" });
    expect(a.fee).toEqual({ state: "supplied", amount: 50000, currency: "USD" });
    expect(byId(a, BOUNDED_ID)).toMatchObject({ severity: "minor", tierBasis: "fee-supplied" });
    expect(a.cleared.some((c) => c.fromFlagId === BOUNDED_ID)).toBe(true);
  });
});

describe("retier: local, no model", () => {
  it("re-tiers as the contract value changes, in both directions, in the model's order", async () => {
    let calls = 0;
    const base = await run({ noFee: true, ...UNDER, onCall: () => calls++ });
    expect(calls).toBe(1);
    const snapshot = JSON.stringify(base);
    const ids = (a: Analysis) => a.flags.map((f) => f.id);

    const big = retier(base, { amount: 1_000_000, currency: "USD" });
    expect(big.fee.state).toBe("supplied");
    expect(ids(big)).not.toContain(BOUNDED_ID);
    expect(big.cleared.find((c) => c.fromFlagId === BOUNDED_ID)?.sourceSentence).toBe(capSentence);

    const small = retier(big, { amount: 500, currency: "USD" });
    expect(ids(small)).toEqual(ids(base)); // back, and in the original position
    expect(small.cleared.some((c) => c.fromFlagId)).toBe(false);
    expect(small.reclassified.some((r) => r.reason === "below-fee")).toBe(false);
    expect(byId(small, BOUNDED_ID)).toMatchObject({ severity: "serious", tierBasis: "fee-supplied" });

    const removed = retier(big);
    expect(removed.fee).toEqual({ state: "unknown" });
    expect(byId(removed, BOUNDED_ID).tierBasis).toBe("fee-unknown");

    expect(JSON.stringify(base)).toBe(snapshot); // pure
    expect(calls).toBe(1);
  });

  it("returns to the extracted fee when the supplied value is removed", async () => {
    const a = await run(UNDER);
    const overridden = retier(a, { amount: 1000, currency: "USD" });
    expect(overridden.fee.state).toBe("supplied");
    expect(overridden.extractedFee).toEqual(adhesion.sidecar.fee);
    const back = retier(overridden);
    expect(back.fee).toEqual({ state: "extracted", ...adhesion.sidecar.fee });
    expect(back.flags.map((f) => f.id)).toEqual(a.flags.map((f) => f.id));
    expect(back.cleared).toEqual(a.cleared);
  });

  it("ignores a supplied value that is not a positive number", async () => {
    const a = await run({ noFee: true });
    for (const amount of [0, -5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(retier(a, { amount, currency: "USD" }).fee).toEqual({ state: "unknown" });
    }
  });

  it("survives a round trip through JSON, as it does between server and browser", async () => {
    const a = await run({ noFee: true, ...UNDER });
    const wire = JSON.parse(JSON.stringify(a)) as Analysis;
    expect(retier(wire, { amount: 50000, currency: "USD" })).toEqual(retier(a, { amount: 50000, currency: "USD" }));
  });
});

describe("contract value input", () => {
  it("accepts a number above zero and a three-letter currency", () => {
    expect(parseContractValue("24,000", "usd")).toEqual({ ok: true, value: { amount: 24000, currency: "USD" } });
    expect(parseContractValue(" $1500.50 ", "EUR")).toEqual({ ok: true, value: { amount: 1500.5, currency: "EUR" } });
  });
  it("refuses zero, negatives, words, blanks and a bad currency", () => {
    for (const bad of ["0", "-3", "abc", "", "  ", "12abc", "1e5", "Infinity"]) {
      expect(parseContractValue(bad, "USD").ok, bad).toBe(false);
    }
    for (const bad of ["", "US", "USDD", "12$"]) expect(parseContractValue("100", bad).ok, bad).toBe(false);
  });
});

describe("the view shows which fee state was used", () => {
  const text = (a: Analysis) => renderToStaticMarkup(<AnalysisView analysis={a} onContractValue={() => {}} />).replace(/&#x27;/g, "'");

  it("extracted: names it, quotes the sentence, offers the input, and shows the moved entry", async () => {
    const html = text(await run(UNDER));
    expect(html).toContain("The fee behind the tiers");
    expect(html).toContain("From the document");
    expect(html).toContain("Fee: $24,000.");
    expect(html).toContain(adhesion.sidecar.fee.sourceSentence.replace(/"/g, "&quot;"));
    expect(html).toContain('id="fee-amount"');
    expect(html).toContain("Tier set against the fee the document states.");
    expect(html).toContain("Listed here, not flagged. The most this could cost is $2,000");
  });

  it("supplied: says so and keeps the extracted fee visible", async () => {
    const html = text(await run({}, { amount: 1000, currency: "USD" }));
    expect(html).toContain("Entered by you");
    expect(html).toContain("Contract value: $1,000.");
    expect(html).toContain("The document states a fee of $24,000. Your value is used instead.");
    expect(html).toContain(adhesion.sidecar.fee.sourceSentence.replace(/"/g, "&quot;"));
    expect(html).toContain("Remove my value");
  });

  it("unknown: says the split depends on the fee, per flag and at the top", async () => {
    const html = text(await run({ noFee: true }));
    expect(html).toContain(FEE_UNKNOWN_NOTE);
    expect(html).toContain("Fee unknown");
    expect(html).toContain("Serious or minor");
    expect(html.split(FEE_UNKNOWN_NOTE).length - 1).toBeGreaterThan(1);
    expect(html).toContain("USD");
  });

  it("hides the input when no handler is given", async () => {
    const html = renderToStaticMarkup(<AnalysisView analysis={await run()} />);
    expect(html).not.toContain('id="fee-amount"');
  });
});

describe("schema and prompt carry the bounds", () => {
  it("requires the three numeric fields on a consequence, nullable", () => {
    const c = ANALYSIS_JSON_SCHEMA.properties.flags.items.properties.consequence;
    for (const k of ["lowAmount", "highAmount", "currency"]) expect(c.required).toContain(k);
    expect(c.properties.highAmount.type).toEqual(["number", "null"]);
    expect([...c.required].sort()).toEqual(Object.keys(c.properties).sort());
  });
  it("tells the model to state bounds only from the text and never to invent a number", () => {
    expect(SYSTEM_PROMPT).toContain("CONSEQUENCE BOUNDS");
    expect(SYSTEM_PROMPT).toMatch(/Set all three to null when the loss is unbounded/);
    expect(SYSTEM_PROMPT).toMatch(/Do not estimate/);
  });
});
