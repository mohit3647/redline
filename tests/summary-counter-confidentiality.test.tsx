import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { analyse, countBudgetFlags, countMissingCounterOffers, orderFlags } from "../src/lib/analyse";
import { AnalysisView, CopyButton } from "../src/components/analysis-view";
import { COPIED_MESSAGE, COPY_FAILED_MESSAGE, copyText } from "../src/lib/copy";
import { SYSTEM_PROMPT } from "../src/lib/model/prompt";
import { loadFixture, stubModel } from "./helpers/stub-model";

type StubOpts = NonNullable<Parameters<typeof stubModel>[1]>;
const adhesion = loadFixture("adhesion-contract");
const clean = loadFixture("clean-contract");
const confSentence = adhesion.sidecar.flags.find((f) => f.kind === "confidentiality")!.sourceSentence;

beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw new Error("network access attempted"); })));
afterEach(() => vi.unstubAllGlobals());

const runAdhesion = (opts: StubOpts = {}) => analyse(adhesion.text, [], stubModel("adhesion-contract", opts), undefined, { logger: () => {} });
const runClean = (opts: StubOpts = {}) => analyse(clean.text, [], stubModel("clean-contract", opts), undefined, { logger: () => {} });
const html = (a: Awaited<ReturnType<typeof runAdhesion>>) => renderToStaticMarkup(<AnalysisView analysis={a} />);

describe("ticket 07: summary", () => {
  it("renders the summary first, before the fee, flags and cleared list", async () => {
    const out = html(await runAdhesion({ summary: "The signer builds a site for a fixed fee." }));
    const at = (s: string) => out.indexOf(s);
    expect(at("The signer builds a site for a fixed fee.")).toBeGreaterThan(-1);
    expect(at("What this agreement does")).toBeLessThan(at("The fee behind the tiers"));
    expect(at("What this agreement does")).toBeLessThan(at("Flags, most severe first"));
    expect(at("What this agreement does")).toBeLessThan(at("Cleared list"));
  });

  it.each([["empty", ""], ["whitespace", "  \n "], ["missing", undefined], ["not a string", 42]])(
    "turns a %s summary into an explicit failure of the summary section",
    async (_name, summary) => {
      const a = await runAdhesion({ summary });
      expect(a.summary).toBe("");
      expect(a.dropped.some((d) => d.kind === "summary")).toBe(true);
      const out = html(a);
      expect(out).toContain("Summary unavailable");
      expect(out).not.toMatch(/items? in the model/); // not reported as a missing quote
      expect(a.flags.length).toBe(adhesion.sidecar.flags.length); // the rest of the analysis stands
    },
  );

  it("tells the model the glossary and the no-unsupported-claims rules for the summary", () => {
    expect(SYSTEM_PROMPT).toContain('"The client" means the other side of the agreement');
    expect(SYSTEM_PROMPT).toContain('"The signer" means the freelancer');
    expect(SYSTEM_PROMPT).toContain("Describe only what is written");
    expect(SYSTEM_PROMPT).toContain("Never call a counter-offer a \"redline\"");
  });
});

describe("ticket 08: counter-offers", () => {
  it("shows each counter-offer in the same flag item as its source sentence", async () => {
    const a = await runAdhesion();
    const out = html(a);
    for (const f of orderFlags(a.flags).ranked) {
      const item = out.split('<li class="flag-item"').find((chunk) => chunk.includes(f.sourceSentence.replace(/"/g, "&quot;").replace(/'/g, "&#x27;")))!;
      expect(item, f.id).toBeDefined();
      expect(item).toContain(f.counterOffer);
    }
  });

  it.each([["empty", ""], ["whitespace", "   \n"], ["missing", undefined], ["null", null]])(
    "a flag with a %s counter-offer stays visible, says none was drafted, and is counted",
    async (_n, value) => {
      const a = await runAdhesion({ counterOffers: { "non-compete": value } });
      expect(a.flags.find((f) => f.id === "non-compete")).toBeDefined();
      expect(countMissingCounterOffers(a)).toBe(1);
      const out = html(a);
      expect(out).toContain("No counter-offer drafted");
      expect(out).toContain("1 flag has no counter-offer drafted");
      expect(out.match(/Copy counter-offer/g)).toHaveLength(a.flags.length - 1);
    },
  );

  it("drops nothing and shows no notice when every counter-offer is present", async () => {
    const a = await runAdhesion();
    expect(countMissingCounterOffers(a)).toBe(0);
    expect(html(a)).not.toContain("No counter-offer drafted");
  });

  it("makes no sendability claim anywhere in the view", async () => {
    expect(html(await runAdhesion()).toLowerCase()).not.toMatch(/sendable|ready to send|send as written|unedited/);
  });

  it("copyText uses the clipboard when it works", async () => {
    const writeText = vi.fn(async () => {});
    expect(await copyText("hello", { clipboard: { writeText } })).toBe(true);
    expect(writeText).toHaveBeenCalledWith("hello");
  });

  it("copyText falls back to a hidden textarea when the clipboard rejects", async () => {
    const area = { value: "", style: {} as Record<string, string>, setAttribute: vi.fn(), select: vi.fn() };
    const doc = {
      createElement: vi.fn(() => area),
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
      execCommand: vi.fn(() => true),
    };
    const ok = await copyText("fallback text", {
      clipboard: { writeText: async () => { throw new Error("blocked"); } },
      document: doc as never,
    });
    expect(ok).toBe(true);
    expect(area.value).toBe("fallback text");
    expect(doc.execCommand).toHaveBeenCalledWith("copy");
    expect(doc.body.removeChild).toHaveBeenCalled();
  });

  it("copyText reports failure when nothing can copy", async () => {
    expect(await copyText("x", {})).toBe(false);
    const doc = { createElement: () => ({ style: {}, setAttribute() {}, select() {} }), body: { appendChild() {}, removeChild() {} }, execCommand: () => false };
    expect(await copyText("x", { document: doc as never })).toBe(false);
  });

  it("the copy control is a button with a polite live status region, empty until used", () => {
    const out = renderToStaticMarkup(<CopyButton text="Cap indemnity at fees paid." />);
    expect(out).toContain("<button");
    expect(out).toContain("Copy counter-offer");
    expect(out).toMatch(/role="status"[^>]*aria-live="polite"|aria-live="polite"[^>]*role="status"/);
    expect(out).not.toContain(COPIED_MESSAGE);
    expect(COPY_FAILED_MESSAGE.length).toBeGreaterThan(0);
  });

  it("the prompt allows unusual framing only inside the counter-offer and bars unsupported claims", () => {
    expect(SYSTEM_PROMPT).toContain("You may call a clause unusual, and only inside the counter-offer");
    expect(SYSTEM_PROMPT).toContain("Say nothing about the document that its text does not support");
    expect(SYSTEM_PROMPT).toContain("Every flag, including a confidentiality flag, carries a counter-offer");
  });
});

describe("ticket 09: confidentiality flag", () => {
  it("shows the adhesion clause as a Disclosure notice with its sentence, outside the tiers", async () => {
    const a = await runAdhesion();
    const out = html(a);
    const section = out.slice(out.indexOf('aria-labelledby="conf-h"'), out.indexOf('aria-labelledby="clear-h"'));
    expect(section).toContain("Disclosure notice");
    expect(section).toContain("sent the text of this document to a third-party model provider");
    expect(section).toContain("may breach the clause");
    expect(section).toContain("Client&#x27;s prior written consent");
    expect(section).not.toMatch(/Critical|Serious|Minor/);
    const flagsSection = out.slice(out.indexOf('aria-labelledby="flags-h"'), out.indexOf('aria-labelledby="conf-h"'));
    expect(flagsSection).not.toContain("Disclosure notice");
    expect(flagsSection).not.toContain("Client&#x27;s prior written consent");
    expect(confSentence).toContain("prior written consent");
  });

  it("does not count it toward the false-positive budget", async () => {
    const a = await runAdhesion();
    expect(a.flags).toHaveLength(8);
    expect(countBudgetFlags(a)).toBe(7);
    expect(countBudgetFlags({ flags: [] })).toBe(0);
  });

  it("shows nothing for the clean document", async () => {
    const a = await runClean();
    const out = html(a);
    expect(a.flags).toEqual([]);
    expect(countBudgetFlags(a)).toBe(0);
    expect(out).not.toContain("Disclosure notice");
    expect(out).not.toContain("confidentiality clause");
  });

  it("normalises a confidentiality clause returned as a risk flag with a tier", async () => {
    const a = await runAdhesion({ flagOverrides: { confidentiality: { kind: "risk", severity: "serious" } } });
    const f = a.flags.find((x) => x.id === "confidentiality")!;
    expect(f.kind).toBe("confidentiality");
    expect(f.severity).toBeNull();
    expect(countBudgetFlags(a)).toBe(7);
    expect(html(a)).toContain("Disclosure notice");
  });

  it("normalises by clause type, whatever kind the model chose", async () => {
    for (const clauseType of ["non-disclosure", "NDA", "confidential-information"]) {
      const a = await runAdhesion({ flagOverrides: { confidentiality: { kind: "risk", severity: "critical", clauseType } } });
      const f = a.flags.find((x) => x.id === "confidentiality")!;
      expect([f.kind, f.severity], clauseType).toEqual(["confidentiality", null]);
    }
  });

  it("forces a null severity on a confidentiality-kind flag that carried a tier", async () => {
    const a = await runAdhesion({ flagOverrides: { confidentiality: { severity: "critical" } } });
    expect(a.flags.find((x) => x.id === "confidentiality")!.severity).toBeNull();
  });

  it("does not move a real risk flag into the notice", async () => {
    const a = await runAdhesion();
    expect(a.flags.filter((f) => f.kind === "risk").map((f) => f.clauseType)).not.toContain("confidentiality");
  });

  it("shows every verified instance and drops one whose sentence is not in the document", async () => {
    const second = adhesion.sidecar.fee.sourceSentence; // a real sentence, standing in for a second clause
    const a = await runAdhesion({
      extraFlags: [{ id: "confidentiality-2", clauseType: "confidentiality", sourceSentence: second }],
      hallucinatedQuote: "Contractor shall keep everything secret forever.",
      flagOverrides: { "confidentiality-2": {} },
    });
    // extraFlags are built as risk flags with a tier: the clause type pulls them into the notice.
    const conf = orderFlags(a.flags).confidentiality;
    expect(conf.map((f) => f.id)).toEqual(["confidentiality", "confidentiality-2"]);
    expect(conf.every((f) => f.severity === null)).toBe(true);
    const out = html(a);
    expect(out).toContain("Disclosure notice");
    expect(out.match(/Disclosure notice/g)).toHaveLength(1); // one notice heading, two quoted clauses
    expect(out).toContain("fixed fee of $24,000");
    expect(a.dropped.some((d) => d.label === "hallucinated")).toBe(true);
  });

  it("tells the model to return it as kind confidentiality with a null severity", () => {
    expect(SYSTEM_PROMPT).toContain('kind "confidentiality", clauseType "confidentiality", severity null');
  });
});
