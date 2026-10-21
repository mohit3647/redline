import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { analyse, retier } from "../src/lib/analyse";
import type { Analysis, RedLine } from "../src/lib/analyse";
import { handleAnalyse } from "../src/lib/analyse/handler";
import { AnalysisView } from "../src/components/analysis-view";
import { buildUserPrompt, SYSTEM_PROMPT } from "../src/lib/model/prompt";
import { checkRedLineText, DEFAULT_RED_LINES, MAX_RED_LINES } from "../src/lib/red-lines/rules";
import { loadFixture, stubModel } from "./helpers/stub-model";

const clean = loadFixture("clean-contract");
const terminationSentence = clean.sidecar.cleared.find((c) => c.id === "termination")!.sourceSentence;
const paymentSentence = clean.sidecar.cleared.find((c) => c.clauseType === "payment-terms")!.sourceSentence;
const RED_LINE = "I never accept a client ending the agreement for convenience, even with a kill fee";
const redLines: RedLine[] = [{ text: RED_LINE }];

const consequence = { low: "a", high: "b", basis: "c", lowAmount: null, highAmount: null, currency: null };
/** Clean-fixture payload (every clause cleared) plus one flag on a clause the defaults clear. */
function payload(extra: Record<string, unknown>) {
  return {
    summary: "s",
    fee: clean.sidecar.fee,
    absent: [],
    flags: [
      {
        id: "rl-1", kind: "risk", clauseType: "termination-for-convenience", severity: "serious",
        sourceSentence: terminationSentence, claim: "The client may terminate for convenience.",
        consequence, counterOffer: "Please remove the right to terminate for convenience.", ...extra,
      },
    ],
    cleared: clean.sidecar.cleared.map((c) => ({ clauseType: c.clauseType, finding: c.finding, sourceSentence: c.sourceSentence })),
  };
}
const run = (extra: Record<string, unknown>, lines: RedLine[] = redLines, fee?: { amount: number; currency: string }) =>
  analyse(clean.text, lines, stubModel("clean-contract", { rawPayload: payload(extra) }), fee, { logger: () => {} });

let fetchSpy: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchSpy = vi.fn(() => { throw new Error("network access attempted"); });
  vi.stubGlobal("fetch", fetchSpy);
});
afterEach(() => {
  expect(fetchSpy).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});

describe("a red line flags a clause the defaults clear", () => {
  it("the defaults alone flag nothing in the clean document", async () => {
    const a = await analyse(clean.text, [], stubModel("clean-contract"), undefined, { logger: () => {} });
    expect(a.flags).toHaveLength(0);
  });

  it("the flag survives the seam with its verified sentence and the exact red-line text", async () => {
    const a = await run({ triggeredByRedLine: RED_LINE });
    expect(a.flags).toHaveLength(1);
    expect(a.flags[0].triggeredByRedLine).toBe(RED_LINE);
    expect(a.flags[0].sourceSentence).toBe(terminationSentence);
    expect(clean.text.includes(a.flags[0].sourceSentence)).toBe(true);
    expect(a.dropped).toHaveLength(0);
  });

  it("a red-line flag whose sentence is not in the document is still dropped", async () => {
    const a = await run({ triggeredByRedLine: RED_LINE, sourceSentence: "The client may end this at will." });
    expect(a.flags).toHaveLength(0);
    expect(a.dropped[0]).toMatchObject({ kind: "flag", reason: "not-verbatim" });
  });

  it("cannot be moved to the cleared list by the fee, however small its stated bound", async () => {
    const small = { consequence: { ...consequence, lowAmount: 0, highAmount: 1, currency: "USD" }, clauseType: "non-compete" };
    for (const fee of [undefined, { amount: 5, currency: "USD" }]) {
      const a = await run({ ...small, triggeredByRedLine: RED_LINE }, redLines, fee);
      expect(a.flags.map((f) => f.id)).toEqual(["rl-1"]);
      expect(a.flags[0].severity).toBe("serious");
      expect(a.reclassified).toHaveLength(0);
      // the same flag without the red line is below the fee and is cleared
      if (fee) {
        const plain = await run(small, redLines, fee);
        expect(plain.flags).toHaveLength(0);
      }
    }
  });

  it("keeps its tier when the fee is unknown, instead of leaving the tier open", async () => {
    const a = await analyse(clean.text, redLines, stubModel("clean-contract", { rawPayload: { ...payload({ clauseType: "non-compete", triggeredByRedLine: RED_LINE }), fee: null } }), undefined, { logger: () => {} });
    expect(a.fee.state).toBe("unknown");
    expect(a.flags[0]).toMatchObject({ severity: "serious", tierBasis: "red-line" });
  });

  it("is not moved to the cleared list by clause type (payment terms), but is without the red line", async () => {
    const extra = { clauseType: "payment-terms", sourceSentence: paymentSentence, severity: "serious" };
    const withLine = await run({ ...extra, triggeredByRedLine: RED_LINE });
    expect(withLine.flags.map((f) => f.id)).toEqual(["rl-1"]);
    expect(withLine.reclassified).toHaveLength(0);
    const without = await run(extra);
    expect(without.flags).toHaveLength(0);
    expect(without.reclassified).toHaveLength(1);
  });

  it("never lowers or removes a Critical flag", async () => {
    const a = await run({ clauseType: "uncapped-indemnity", severity: "critical", triggeredByRedLine: RED_LINE }, redLines, { amount: 1e9, currency: "USD" });
    expect(a.flags[0].severity).toBe("critical");
    const r = retier(a, { amount: 1e9, currency: "USD" });
    expect(r.flags[0].severity).toBe("critical");
  });
});

describe("a triggeredByRedLine that names no supplied red line", () => {
  it("is cleared and recorded, and the flag stays because its sentence verified", async () => {
    const a = await run({ triggeredByRedLine: "I never work on weekends" });
    expect(a.flags).toHaveLength(1);
    expect(a.flags[0].triggeredByRedLine).toBeUndefined();
    expect(a.dropped).toHaveLength(1);
    expect(a.dropped[0]).toMatchObject({ kind: "red-line", reason: "unknown-red-line", label: "rl-1" });
  });

  it("is cleared when the signer supplied no red lines at all", async () => {
    const a = await run({ triggeredByRedLine: RED_LINE }, []);
    expect(a.flags[0].triggeredByRedLine).toBeUndefined();
    expect(a.dropped[0].reason).toBe("unknown-red-line");
  });

  it("does not count as an omitted item in the view", async () => {
    const a = await run({ triggeredByRedLine: "I never work on weekends" });
    expect(renderToStaticMarkup(<AnalysisView analysis={a} onContractValue={() => {}} />)).not.toMatch(/left out/);
  });

  it("is cleared when the model drifts from the exact text, and a padded copy matches after trimming", async () => {
    expect((await run({ triggeredByRedLine: RED_LINE.toLowerCase() })).flags[0].triggeredByRedLine).toBeUndefined();
    expect((await run({ triggeredByRedLine: `  ${RED_LINE} ` })).flags[0].triggeredByRedLine).toBe(RED_LINE);
  });
});

describe("the rendered view", () => {
  it("says the flag is there because of the signer's red line, next to its source sentence", async () => {
    const a = await run({ triggeredByRedLine: RED_LINE });
    const html = renderToStaticMarkup(<AnalysisView analysis={a} onContractValue={() => {}} />);
    expect(html).toContain(`Flagged because of your red line: “${RED_LINE}”`);
    expect(html).toContain("kill fee equal to 20 percent");
  });
  it("shows no attribution on a flag no red line triggered", async () => {
    const a = await run({});
    expect(renderToStaticMarkup(<AnalysisView analysis={a} onContractValue={() => {}} />)).not.toContain("your red line");
  });
});

describe("red lines reach the model", () => {
  it("are sent to the model client by the handler and listed in the prompt", async () => {
    let seen: RedLine[] | undefined;
    const model = { analyse: async (i: { redLines: RedLine[] }) => { seen = i.redLines; return payload({ triggeredByRedLine: RED_LINE }); } };
    const res = await handleAnalyse(
      new Request("http://x", { method: "POST", body: JSON.stringify({ text: clean.text, redLines: [{ text: `  ${RED_LINE} ` }] }) }),
      { configured: false, getUser: async () => null, model },
    );
    const body = await res.json();
    expect(seen).toEqual(redLines);
    expect(body.analysis.flags[0].triggeredByRedLine).toBe(RED_LINE);
    expect(buildUserPrompt({ documentText: "doc", redLines })).toContain(`1. ${RED_LINE}`);
    expect(SYSTEM_PROMPT).toMatch(/flag it even when the defaults/);
    expect(SYSTEM_PROMPT).toMatch(/never removes or downgrades/);
  });
});

describe("handler validation", () => {
  const post = (redLinesBody: unknown) =>
    handleAnalyse(new Request("http://x", { method: "POST", body: JSON.stringify({ text: "some text", redLines: redLinesBody }) }), {
      configured: false, getUser: async () => null, model: { analyse: async () => payload({}) },
    });
  const lines = (n: number) => Array.from({ length: n }, (_, i) => ({ text: `line ${i}` }));

  it("accepts 20 red lines of 500 characters and refuses 21", async () => {
    expect((await post(lines(MAX_RED_LINES))).status).not.toBe(400);
    expect((await post([{ text: "x".repeat(500) }])).status).not.toBe(400);
    expect((await post(lines(MAX_RED_LINES + 1))).status).toBe(400);
  });
  it("refuses a red line over 500 characters, a blank one, and one that is not text", async () => {
    expect((await post([{ text: "x".repeat(501) }])).status).toBe(400);
    expect((await post([{ text: "   " }])).status).toBe(400);
    expect((await post([{ text: 5 }])).status).toBe(400);
    expect((await post(["bare string"])).status).toBe(400);
    expect((await post(null)).status).toBe(400);
  });
  it("names the limits in the refusal", async () => {
    const body = await (await post(lines(21))).json();
    expect(body.message).toMatch(/20/);
    expect(body.message).toMatch(/500/);
  });
  it("shares its limits with the editor", () => {
    expect(checkRedLineText("x".repeat(501)).ok).toBe(false);
    expect(checkRedLineText("  ok  ")).toEqual({ ok: true, text: "ok" });
    expect(DEFAULT_RED_LINES.length).toBeGreaterThan(0);
  });
});

describe("red_lines migration (static check)", () => {
  // Reads the SQL text only. Row-level security behaviour is unverified until the migration runs on a real Supabase database.
  const dir = join(__dirname, "..", "supabase", "migrations");
  const file = readdirSync(dir).find((f) => f.endsWith("_red_lines.sql"));
  const sql = file ? readFileSync(join(dir, file), "utf8") : "";
  const docsFile = readdirSync(dir).find((f) => f.endsWith("_documents.sql"))!;

  it("sorts after the documents migration and creates the specified table", () => {
    expect(file).toBeDefined();
    expect(file! > docsFile).toBe(true);
    expect(sql).toMatch(/create table public\.red_lines/);
    expect(sql).toMatch(/user_id uuid not null references auth\.users on delete cascade default auth\.uid\(\)/);
    expect(sql).toMatch(/check \(length\(btrim\(text\)\) between 1 and 500\)/);
    expect(sql).toMatch(/position int/);
  });
  it("enables RLS with select, insert, update and delete policies scoped to the owner", () => {
    expect(sql).toMatch(/alter table public\.red_lines enable row level security/);
    for (const op of ["select", "insert", "update", "delete"]) expect(sql).toMatch(new RegExp(`for ${op} to authenticated`));
    expect(sql).toMatch(/for select[\s\S]*?using \(user_id = \(select auth\.uid\(\)\)\)/);
    expect(sql).toMatch(/for insert[\s\S]*?with check \(user_id = \(select auth\.uid\(\)\)\)/);
    expect(sql).toMatch(/for update[\s\S]*?using \(user_id = \(select auth\.uid\(\)\)\)[\s\S]*?with check \(user_id = \(select auth\.uid\(\)\)\)/);
    expect(sql).toMatch(/for delete[\s\S]*?using \(user_id = \(select auth\.uid\(\)\)\)/);
    expect(sql).not.toMatch(/for all|to anon|using \(true\)/);
  });
});
