import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { analyse, countBudgetFlags } from "../src/lib/analyse";
import type { Analysis } from "../src/lib/analyse";
import { StoredDocument } from "../src/components/stored-document";
import { isDocumentId, shapeLibrary, verifyAnalysis } from "../src/lib/library/logic";
import { saveAnalysis } from "../src/lib/library/actions";
import { loadFixture, stubModel } from "./helpers/stub-model";

const adhesion = loadFixture("adhesion-contract");
const clean = loadFixture("clean-contract");
const quiet = { logger: () => {} };
let result: Analysis;
let cleanResult: Analysis;

beforeEach(async () => {
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("network access attempted"); }));
  result = await analyse(adhesion.text, [], stubModel("adhesion-contract"), undefined, quiet);
  cleanResult = await analyse(clean.text, [], stubModel("clean-contract"), undefined, quiet);
});
afterEach(() => vi.unstubAllGlobals());

describe("save guard", () => {
  it("accepts a result the seam produced from this document", () => {
    expect(verifyAnalysis(adhesion.text, result)).toEqual({ ok: true });
    expect(verifyAnalysis(clean.text, cleanResult)).toEqual({ ok: true });
  });

  it("refuses a result checked against a different document", () => {
    expect(verifyAnalysis(clean.text, result).ok).toBe(false);
  });

  it("refuses a tampered flag sentence, cleared sentence, fee sentence or demoted sentence", () => {
    const flag = structuredClone(result);
    flag.flags[0].sourceSentence += " (edited)";
    expect(verifyAnalysis(adhesion.text, flag).ok).toBe(false);

    const cleared = structuredClone(result);
    cleared.cleared[0].sourceSentence = "Not in the document at all.";
    expect(verifyAnalysis(adhesion.text, cleared).ok).toBe(false);

    const fee = structuredClone(result);
    if (fee.fee.state === "extracted") fee.fee.sourceSentence = "The fee is one dollar.";
    expect(verifyAnalysis(adhesion.text, fee).ok).toBe(false);

    const demoted = structuredClone(result);
    demoted.demoted = [{ ...result.flags[0], sourceSentence: "Invented." }];
    expect(verifyAnalysis(adhesion.text, demoted).ok).toBe(false);
  });

  it("refuses an empty quote and a malformed result", () => {
    const empty = structuredClone(result);
    empty.flags[0].sourceSentence = "  ";
    expect(verifyAnalysis(adhesion.text, empty).ok).toBe(false);
    expect(verifyAnalysis(adhesion.text, null).ok).toBe(false);
    expect(verifyAnalysis(adhesion.text, { summary: "s" }).ok).toBe(false);
  });

  it("the save action stores nothing and reports unconfigured when Supabase is absent", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const out = await saveAnalysis("0b2f2c1e-5f5e-4c53-9d51-0e7e6c1e1a11", result);
    vi.unstubAllEnvs();
    expect(out.status).toBe("unconfigured");
  });

  it("the save action refuses a malformed document id before asking the database", async () => {
    expect((await saveAnalysis("not-a-uuid", result)).status).toBe("refused");
  });
});

describe("library list shaping", () => {
  const docs = [
    { id: "a", title: "Old", created_at: "2026-09-01T10:00:00Z" },
    { id: "b", title: "New", created_at: "2026-10-01T10:00:00Z" },
    { id: "c", title: "Unanalysed", created_at: "2026-09-15T10:00:00Z" },
  ];

  it("lists newest first and counts risk flags only, excluding the confidentiality notice", () => {
    const flags = result.flags;
    const risk = countBudgetFlags({ flags });
    expect(flags.some((f) => f.kind === "confidentiality")).toBe(true);
    expect(risk).toBeLessThan(flags.length);
    const out = shapeLibrary(docs, [{ document_id: "b", created_at: "2026-10-02T00:00:00Z", flags }]);
    expect(out.map((e) => e.id)).toEqual(["b", "c", "a"]);
    expect(out[0]).toMatchObject({ analysed: true, flagCount: risk });
  });

  it("reports an unanalysed document as unanalysed, not as zero flags", () => {
    const c = shapeLibrary(docs, []).find((e) => e.id === "c")!;
    expect(c).toMatchObject({ analysed: false, flagCount: null });
  });

  it("counts from the most recent analysis when there are several", () => {
    const out = shapeLibrary(docs, [
      { document_id: "a", created_at: "2026-09-05T00:00:00Z", flags: result.flags },
      { document_id: "a", created_at: "2026-09-06T00:00:00Z", flags: [] },
    ]);
    expect(out.find((e) => e.id === "a")!.flagCount).toBe(0);
  });

  it("recognises uuids and nothing else", () => {
    expect(isDocumentId("0b2f2c1e-5f5e-4c53-9d51-0e7e6c1e1a11")).toBe(true);
    for (const bad of ["", "1", "../x", "0b2f2c1e-5f5e-4c53-9d51-0e7e6c1e1a11x", "<script>"]) expect(isDocumentId(bad)).toBe(false);
  });
});

describe("opening a stored analysis", () => {
  const props = () => ({
    documentId: "0b2f2c1e-5f5e-4c53-9d51-0e7e6c1e1a11",
    title: "Adhesion agreement",
    text: adhesion.text,
    savedAt: "2026-10-01T10:00:00Z",
    stored: { analysis: result, createdAt: "2026-10-01T10:05:00Z" },
    withheld: false,
  });

  it("renders the summary, every flag sentence and the cleared list from stored data with zero fetch calls", () => {
    const html = renderToStaticMarkup(<StoredDocument {...props()} />);
    expect(html).toContain("What this agreement does");
    for (const f of result.flags) expect(html).toContain(f.sourceSentence.replace(/&/g, "&amp;").replace(/'/g, "&#x27;").replace(/"/g, "&quot;").replace(/</g, "&lt;"));
    expect(html).toContain("Cleared list");
    expect(html).toContain("Run analysis again");
    expect(html).not.toContain("Analyse this agreement");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("offers an explicit run, and no automatic one, when nothing is stored", () => {
    const html = renderToStaticMarkup(<StoredDocument {...props()} stored={null} />);
    expect(html).toContain("has not been analysed yet");
    expect(html).toContain("Analyse this agreement");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("says a withheld analysis is withheld instead of showing it", () => {
    const html = renderToStaticMarkup(<StoredDocument {...props()} stored={null} withheld />);
    expect(html).toContain("is not shown because one of its quotations");
    expect(html).not.toContain("What this agreement does");
  });
});

describe("analyses migration (static check)", () => {
  // Supplementary only. This reads SQL text; RLS behaviour is UNVERIFIED until the migration runs on a Supabase database.
  const dir = join(__dirname, "..", "supabase", "migrations");
  const file = readdirSync(dir).find((f) => f.endsWith("_analyses.sql"));
  const sql = file ? readFileSync(join(dir, file), "utf8") : "";
  const docsFile = readdirSync(dir).find((f) => f.endsWith("_documents.sql"))!;

  it("sorts after the documents migration and creates the table", () => {
    expect(file).toBeDefined();
    expect(file! > docsFile).toBe(true);
    expect(sql).toMatch(/document_id uuid not null references public\.documents on delete cascade/);
    expect(sql).toMatch(/user_id uuid not null default auth\.uid\(\) references auth\.users on delete cascade/);
    expect(sql).toMatch(/result jsonb not null/);
    expect(sql).toMatch(/contract_value jsonb/);
    expect(sql).toMatch(/\(document_id, created_at desc\)/);
  });

  it("enables RLS with own-row select and insert and a document ownership check", () => {
    expect(sql).toMatch(/alter table public\.analyses enable row level security/);
    expect(sql).toMatch(/for select[\s\S]*?using \(user_id = \(select auth\.uid\(\)\)\)/);
    expect(sql).toMatch(/for insert[\s\S]*?with check \([\s\S]*?exists \([\s\S]*?from public\.documents d[\s\S]*?d\.id = document_id and d\.user_id = \(select auth\.uid\(\)\)/);
  });

  it("defines no update or delete policy", () => {
    expect(sql).not.toMatch(/for (update|delete|all)/);
  });
});
