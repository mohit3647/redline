import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ANALYSIS_JSON_SCHEMA, ANCHOR_TYPES, analyse, runAnalysis } from "../src/lib/analyse";
import { AnalysisView } from "../src/components/analysis-view";
import { SYSTEM_PROMPT } from "../src/lib/model/prompt";
import { loadFixture, stubModel } from "./helpers/stub-model";

const adhesion = loadFixture("adhesion-contract");
const clean = loadFixture("clean-contract");
const net90 = adhesion.sidecar.cleared.find((c) => c.id === "payment-net-90")!;
const arb = adhesion.sidecar.cleared.find((c) => c.id === "mandatory-arbitration")!;

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("network access attempted"); }));
});
afterEach(() => vi.unstubAllGlobals());

const quiet = { logger: () => {} };
const runAdhesion = (o = {}) => analyse(adhesion.text, [], stubModel("adhesion-contract", o), undefined, quiet);
const runClean = (o = {}) => analyse(clean.text, [], stubModel("clean-contract", o), undefined, quiet);

describe("cleared entries", () => {
  it("each carries clause type, finding and a verbatim source sentence", async () => {
    for (const [a, f] of [[await runAdhesion(), adhesion], [await runClean(), clean]] as const) {
      expect(a.cleared.length).toBeGreaterThan(0);
      for (const c of a.cleared) {
        expect(c.clauseType).not.toBe("");
        expect(c.finding).not.toBe("");
        expect(f.text.includes(c.sourceSentence)).toBe(true);
      }
    }
  });

  it("the full pipeline drops a cleared entry whose sentence is not in the document", async () => {
    const model = stubModel("clean-contract", { mutateQuote: { indemnity: () => "Indemnity is capped at fees paid." } });
    const out = await runAnalysis({ text: clean.text, redLines: [] }, model);
    if (out.status !== "ok") throw new Error("expected ok");
    expect(out.analysis.cleared.find((c) => c.clauseType === "indemnity")).toBeUndefined();
    expect(out.analysis.dropped).toHaveLength(1);
  });
});

describe("payment terms and arbitration never reach the flags", () => {
  it("cleared payment and arbitration entries carry a note", async () => {
    const a = await runAdhesion();
    for (const t of ["payment-terms", "arbitration"]) {
      const c = a.cleared.find((x) => x.clauseType === t)!;
      expect(c.note).toMatch(/not flagged/);
    }
    expect(a.reclassified).toEqual([]);
  });

  it("moves model-returned flags of those types to cleared, keeping the verified sentence, and records it", async () => {
    const a = await runAdhesion({
      omitCleared: ["payment-net-90", "mandatory-arbitration"],
      extraFlags: [
        { id: "net-90", clauseType: "payment-terms", sourceSentence: net90.sourceSentence },
        { id: "arb", clauseType: "arbitration", sourceSentence: arb.sourceSentence },
      ],
    });
    expect(a.flags.map((f) => f.id)).toEqual(adhesion.sidecar.flags.map((f) => f.id));
    const moved = a.cleared.filter((c) => c.clauseType === "payment-terms" || c.clauseType === "arbitration");
    expect(moved.map((c) => c.sourceSentence).sort()).toEqual([net90.sourceSentence, arb.sourceSentence].sort());
    for (const c of moved) {
      expect(c.note).toMatch(/not flagged/);
      expect(c.finding).not.toBe("");
    }
    expect(a.reclassified).toEqual([
      { id: "net-90", clauseType: "payment-terms", from: "flag", to: "cleared" },
      { id: "arb", clauseType: "arbitration", from: "flag", to: "cleared" },
    ]);
    expect(a.dropped).toEqual([]);
  });

  it("a moved flag whose sentence is not verbatim is dropped, not cleared", async () => {
    const a = await runAdhesion({
      omitCleared: ["mandatory-arbitration"],
      extraFlags: [{ id: "arb", clauseType: "mandatory-arbitration", sourceSentence: "Disputes go to arbitration." }],
    });
    expect(a.cleared.find((c) => c.clauseType.includes("arbitration"))).toBeUndefined();
    expect(a.reclassified).toEqual([]);
    expect(a.dropped).toHaveLength(1);
    expect(a.dropped[0]).toMatchObject({ kind: "flag", reason: "not-verbatim" });
  });
});

describe("absent anchor types", () => {
  it("lists an anchor type the model found no clause for", async () => {
    const a = await runClean({ omitCleared: ["indemnity"], absent: ["uncapped-indemnity"] });
    expect(a.absent).toEqual(["uncapped-indemnity"]);
    expect(a.dropped).toEqual([]);
  });

  it("is empty when every anchor type appears (clean and adhesion scenarios)", async () => {
    expect((await runClean()).absent).toEqual([]);
    expect((await runAdhesion()).absent).toEqual([]);
  });

  it("rejects a claim of absence that the verified output contradicts", async () => {
    const c = await runClean({ absent: ["uncapped-indemnity", "ip-assignment"] });
    expect(c.absent).toEqual([]);
    expect(c.dropped.map((d) => d.reason)).toEqual(["contradicted", "contradicted"]);
    const a = await runAdhesion({ absent: ["termination-for-convenience"] });
    expect(a.absent).toEqual([]);
    expect(a.dropped[0]).toMatchObject({ kind: "absent", reason: "contradicted" });
  });

  it("rejects unknown types and a non-array, and de-duplicates", async () => {
    const a = await runClean({ omitCleared: ["ip-assignment"], absent: ["ip-assignment", "ip-assignment", "non-compete"] });
    expect(a.absent).toEqual(["ip-assignment"]);
    expect(a.dropped).toHaveLength(1);
    expect(a.dropped[0]).toMatchObject({ kind: "absent", reason: "malformed" });
    const b = await runClean({ rawPayload: { summary: "s", flags: [], cleared: [], absent: "ip-assignment" } });
    expect(b.absent).toEqual([]);
    expect(b.dropped[0]).toMatchObject({ reason: "malformed", label: "absent" });
  });
});

describe("schema and prompt stay in step", () => {
  it("requires absent, limited to the anchor types", () => {
    expect(ANALYSIS_JSON_SCHEMA.required).toContain("absent");
    expect(ANALYSIS_JSON_SCHEMA.properties.absent.items.enum).toEqual([...ANCHOR_TYPES]);
    for (const t of ANCHOR_TYPES) expect(SYSTEM_PROMPT).toContain(`"${t}"`);
  });

  it("does not tell the model to clear a termination clause for paying delivered work", () => {
    const rule = SYSTEM_PROMPT.split("\n").find((l) => l.startsWith('- "termination-for-convenience"'))!;
    expect(rule).not.toMatch(/payment for work done/);
    expect(rule).toMatch(/nothing beyond (fees|payment) for work already delivered/);
    expect(rule).toMatch(/kill fee/);
  });
});

describe("rendering", () => {
  it("a document with no flags shows a headed, populated cleared list and no verdict wording", async () => {
    const analysis = await runClean({ omitCleared: ["indemnity"], absent: ["uncapped-indemnity"] });
    const html = renderToStaticMarkup(<AnalysisView analysis={analysis} />);
    expect(html).toContain("Cleared list");
    expect(html).toContain("what Redline checked and found acceptable");
    for (const c of analysis.cleared) expect(html).toContain(c.finding.replace(/'/g, "&#x27;"));
    expect(html).toContain("No clause found for: uncapped indemnity.");
    expect(html).toContain("stated from the text Redline read");
    expect(html).not.toMatch(/all clear|passed|no issues found|safe to sign/i);
    expect(html).not.toContain("Nothing was cleared");
  });

  it("shows the note and the quoted sentence of a moved entry", async () => {
    const a = await runAdhesion();
    const html = renderToStaticMarkup(<AnalysisView analysis={a} />);
    expect(html).toContain("Listed here, not flagged.");
    expect(html).toContain("From the document");
    expect(html).not.toContain("No clause found for");
  });
});
