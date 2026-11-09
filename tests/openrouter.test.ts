import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ANALYSIS_JSON_SCHEMA, ModelConfigError, ModelOutputError, ModelProviderError, orderFlags, runAnalysis } from "../src/lib/analyse";
import type { Flag } from "../src/lib/analyse";
import { handleAnalyse } from "../src/lib/analyse/handler";
import { createOpenRouterModel } from "../src/lib/model/openrouter";
import { loadFixture, stubModel } from "./helpers/stub-model";

const adhesion = loadFixture("adhesion-contract");
const clean = loadFixture("clean-contract");
const ENV = { OPENROUTER_API_KEY: "test-key", OPENROUTER_MODEL: "test/model-from-env" };
const model = () => createOpenRouterModel(() => ENV);

async function payloadFor(name: "adhesion-contract" | "clean-contract", opts = {}) {
  return stubModel(name, opts).analyse({ documentText: "", redLines: [] });
}
const orResponse = (content: unknown, status = 200) =>
  new Response(JSON.stringify(typeof content === "string" ? { choices: [{ message: { content } }] } : content), { status });

function stubFetch(res: () => Response | Promise<Response>) {
  const f = vi.fn(async (_url: unknown, _init?: RequestInit) => res());
  vi.stubGlobal("fetch", f);
  return f;
}
afterEach(() => vi.unstubAllGlobals());

describe("request body", () => {
  it("pins the provider, zdr, reasoning effort, strict json_schema and the bearer header", async () => {
    const f = stubFetch(async () => orResponse(JSON.stringify(await payloadFor("adhesion-contract"))));
    await model().analyse({ documentText: adhesion.text, redLines: [{ text: "No IP before the engagement" }], contractValue: { amount: 5, currency: "USD" } });
    expect(f).toHaveBeenCalledTimes(1);
    const [url, init] = f.mock.calls[0];
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect((init!.headers as Record<string, string>).Authorization).toBe("Bearer test-key");
    const body = JSON.parse(init!.body as string);
    expect(body.model).toBe("test/model-from-env");
    expect(body.provider).toEqual({ order: ["fireworks"], allow_fallbacks: false, require_parameters: true, zdr: true });
    expect(body.reasoning).toEqual({ effort: "low" });
    expect(body.response_format).toEqual({
      type: "json_schema",
      json_schema: { name: "redline_analysis", strict: true, schema: ANALYSIS_JSON_SCHEMA },
    });
    const user = body.messages.find((m: { role: string }) => m.role === "user").content as string;
    expect(user).toContain(adhesion.text);
    expect(user).toContain("No IP before the engagement");
  });

  it("throws a named config error when the key or model is missing, without calling the network", async () => {
    const f = stubFetch(() => orResponse("{}"));
    const input = { documentText: "x", redLines: [] };
    await expect(createOpenRouterModel(() => ({ OPENROUTER_MODEL: "m" })).analyse(input)).rejects.toBeInstanceOf(ModelConfigError);
    await expect(createOpenRouterModel(() => ({ OPENROUTER_API_KEY: "k" })).analyse(input)).rejects.toBeInstanceOf(ModelConfigError);
    expect(f).not.toHaveBeenCalled();
  });

  it("writes no model id literal anywhere in src", () => {
    const files: string[] = [];
    const walk = (d: string) => {
      for (const n of readdirSync(d)) {
        const p = join(d, n);
        statSync(p).isDirectory() ? walk(p) : /\.(tsx?|css)$/.test(n) && files.push(p);
      }
    };
    walk(join(__dirname, "..", "src"));
    walk(join(__dirname, "..", "app"));
    const idLike = /\b(anthropic|openai|google|meta-llama|mistralai|deepseek|qwen|x-ai)\/[\w.:-]+|claude-[\w.-]+|\bgpt-[\w.-]+|sonnet-?\d|haiku|opus-?\d/i;
    for (const f of files) expect(readFileSync(f, "utf8"), f).not.toMatch(idLike);
  });
});

describe("schema stays in step with the seam", () => {
  it("lists every field the seam's validator requires on a flag", () => {
    const flag = ANALYSIS_JSON_SCHEMA.properties.flags.items;
    for (const k of ["id", "kind", "clauseType", "severity", "sourceSentence", "claim", "consequence", "counterOffer"]) {
      expect(flag.required).toContain(k);
    }
    expect(ANALYSIS_JSON_SCHEMA.required).toEqual(["summary", "fee", "flags", "cleared", "absent"]);
  });
});

describe("full pipeline through the real analyse", () => {
  it("yields every expected flag, in severity order, with the right bands", async () => {
    stubFetch(async () => orResponse(JSON.stringify(await payloadFor("adhesion-contract"))));
    const out = await runAnalysis({ text: adhesion.text, redLines: [] }, model());
    if (out.status !== "ok") throw new Error("expected ok");
    const { ranked, confidentiality } = orderFlags(out.analysis.flags);
    const expectedRisk = adhesion.sidecar.flags.filter((f) => f.kind === "risk");
    expect(ranked.map((f) => f.sourceSentence).sort()).toEqual(expectedRisk.map((f) => f.sourceSentence).sort());
    for (const f of ranked) expect(f.severity).toBe(expectedRisk.find((e) => e.sourceSentence === f.sourceSentence)!.expectedSeverityBand);
    expect(ranked.map((f) => f.severity)).toEqual(["critical", "critical", "serious", "serious", "serious", "serious", "serious"]);
    expect(confidentiality).toHaveLength(1);
    expect(out.analysis.cleared).toHaveLength(2);
    expect(out.analysis.dropped).toEqual([]);
  });

  it("drops a hallucinated quote and counts it", async () => {
    stubFetch(async () => orResponse(JSON.stringify(await payloadFor("adhesion-contract", { hallucinatedQuote: "Contractor owes a $50,000 penalty." }))));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const out = await runAnalysis({ text: adhesion.text, redLines: [] }, model());
    if (out.status !== "ok") throw new Error("expected ok");
    expect(out.analysis.dropped).toHaveLength(1);
    expect(out.analysis.flags.find((f) => f.id === "hallucinated")).toBeUndefined();
    // Document text and quotes are never logged.
    expect(JSON.stringify(warn.mock.calls)).not.toContain("50,000");
    warn.mockRestore();
  });

  it("a clean document is ok with a cleared list and no flags", async () => {
    stubFetch(async () => orResponse(JSON.stringify(await payloadFor("clean-contract"))));
    const out = await runAnalysis({ text: clean.text, redLines: [] }, model());
    if (out.status !== "ok") throw new Error("expected ok");
    expect(out.analysis.flags).toEqual([]);
    expect(out.analysis.cleared.length).toBeGreaterThan(0);
  });
});

describe("explicit failure states", () => {
  const run = (res: () => Response) => {
    stubFetch(async () => res());
    return runAnalysis({ text: adhesion.text, redLines: [] }, model());
  };
  it("non-JSON content is malformed-output", async () => {
    expect(await run(() => orResponse("here is your analysis!"))).toMatchObject({ status: "failed", reason: "malformed-output" });
  });
  it("a response with no choices is malformed-output", async () => {
    expect(await run(() => orResponse({ choices: [] }))).toMatchObject({ status: "failed", reason: "malformed-output" });
  });
  it("empty flags and empty cleared is 'no valid analysis'", async () => {
    expect(await run(() => orResponse(JSON.stringify({ summary: "s", fee: null, flags: [], cleared: [] })))).toMatchObject({ status: "failed", reason: "no-valid-analysis" });
  });
  it("only hallucinated flags and no cleared is 'no valid analysis'", async () => {
    const payload = await payloadFor("adhesion-contract", { hallucinatedQuote: "Not in the text." });
    const p = payload as { flags: unknown[]; cleared: unknown[] };
    const out = await run(() => orResponse(JSON.stringify({ ...p, flags: p.flags.slice(-1), cleared: [] })));
    expect(out).toMatchObject({ status: "failed", reason: "no-valid-analysis" });
  });
  it("HTTP errors and 200-with-error bodies are provider-error", async () => {
    expect(await run(() => orResponse({ error: { message: "no zdr route" } }, 404))).toMatchObject({ reason: "provider-error" });
    expect(await run(() => orResponse({ error: { message: "rate" } }, 200))).toMatchObject({ reason: "provider-error" });
  });
  it("a network failure is provider-error", async () => {
    stubFetch(() => { throw new TypeError("fetch failed"); });
    expect(await runAnalysis({ text: "x", redLines: [] }, model())).toMatchObject({ reason: "provider-error" });
  });
  it("retries once after a 503 on the same request and returns the answer", async () => {
    const good = JSON.stringify(await payloadFor("adhesion-contract"));
    let n = 0;
    const f = stubFetch(() => (++n === 1 ? orResponse({ error: { message: "upstream" } }, 503) : orResponse(good)));
    const out = await runAnalysis({ text: adhesion.text, redLines: [] }, model());
    expect(out).toMatchObject({ status: "ok" });
    expect(f).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(f.mock.calls[1][1]?.body)).provider).toEqual(JSON.parse(String(f.mock.calls[0][1]?.body)).provider);
  });
  it("retries a network failure once, then gives up as provider-error after two calls", async () => {
    const f = stubFetch(() => { throw new TypeError("fetch failed"); });
    expect(await runAnalysis({ text: "x", redLines: [] }, model())).toMatchObject({ reason: "provider-error" });
    expect(f).toHaveBeenCalledTimes(2);
  });
  it("does not retry a refusal that a second try cannot change (404, 401)", async () => {
    for (const status of [404, 401]) {
      const f = stubFetch(() => orResponse({ error: { message: "no" } }, status));
      await runAnalysis({ text: "x", redLines: [] }, model());
      expect(f).toHaveBeenCalledTimes(1);
    }
  });
  it("missing key is missing-key", async () => {
    const out = await runAnalysis({ text: "x", redLines: [] }, createOpenRouterModel(() => ({})));
    expect(out).toMatchObject({ status: "failed", reason: "missing-key" });
  });
  it("named errors are distinguishable", () => {
    expect(new ModelProviderError("x").name).toBe("ModelProviderError");
    expect(new ModelOutputError("x").name).toBe("ModelOutputError");
  });
});

describe("API handler", () => {
  const req = (body: unknown) => new Request("http://x/api/analyse", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) });
  const okModel = stubModel("adhesion-contract");
  const deps = (over = {}) => ({ getUser: async () => ({ id: "u" }), model: okModel, ...over });

  it("returns 401 to a signed-out caller even when Supabase is not configured, and never calls the model", async () => {
    const analyse = vi.fn(okModel.analyse);
    const res = await handleAnalyse(req({ text: adhesion.text }), deps({ configured: false, getUser: async () => null, model: { analyse } }));
    expect(res.status).toBe(401);
    expect((await res.json()).reason).toBe("signed-out");
    expect(analyse).not.toHaveBeenCalled();
  });
  it("returns the analysis to a signed-in user", async () => {
    const res = await handleAnalyse(req({ text: adhesion.text }), deps());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.analysis.flags.length).toBeGreaterThan(0);
  });
  it("requires a signed-in user", async () => {
    expect((await handleAnalyse(req({ text: adhesion.text }), deps({ getUser: async () => null }))).status).toBe(401);
  });
  it("rejects bad requests", async () => {
    expect((await handleAnalyse(req("not json"), deps())).status).toBe(400);
    expect((await handleAnalyse(req({ text: "  " }), deps())).status).toBe(400);
    expect((await handleAnalyse(req({ text: "a", redLines: "x" }), deps())).status).toBe(400);
  });
  it("maps failures to named states and statuses", async () => {
    const thrower = (e: Error) => ({ analyse: async () => { throw e; } });
    const call = async (e: Error) => {
      const res = await handleAnalyse(req({ text: "some text" }), deps({ model: thrower(e) }));
      return [res.status, (await res.json()).reason];
    };
    expect(await call(new ModelConfigError("k"))).toEqual([503, "missing-key"]);
    expect(await call(new ModelProviderError("p"))).toEqual([502, "provider-error"]);
    expect(await call(new ModelOutputError("o"))).toEqual([502, "malformed-output"]);
    const empty = { analyse: async () => ({ summary: "", fee: null, flags: [], cleared: [] }) };
    const res = await handleAnalyse(req({ text: "some text" }), deps({ model: empty }));
    expect([res.status, (await res.json()).reason]).toEqual([502, "no-valid-analysis"]);
  });
});

describe("orderFlags", () => {
  const f = (id: string, severity: Flag["severity"], kind: Flag["kind"] = "risk"): Flag => ({
    id, kind, clauseType: id, severity, sourceSentence: id, claim: "c", consequence: { low: "l", high: "h", basis: "b", lowAmount: null, highAmount: null, currency: null }, counterOffer: "o",
  });
  it("orders critical, serious, minor, stable within a tier, and separates confidentiality", () => {
    const { ranked, confidentiality } = orderFlags([f("s1", "serious"), f("conf", null, "confidentiality"), f("m", "minor"), f("c1", "critical"), f("s2", "serious"), f("c2", "critical")]);
    expect(ranked.map((x) => x.id)).toEqual(["c1", "c2", "s1", "s2", "m"]);
    expect(confidentiality.map((x) => x.id)).toEqual(["conf"]);
  });
});
