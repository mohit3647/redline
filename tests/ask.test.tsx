import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ModelConfigError, ModelOutputError, ModelProviderError } from "../src/lib/analyse";
import { answerQuestion, ANSWER_JSON_SCHEMA } from "../src/lib/ask";
import type { Answer, AskModel } from "../src/lib/ask";
import { createOpenRouterAskModel } from "../src/lib/ask/openrouter";
import { handleAsk } from "../src/lib/ask/handler";
import { AnswerView, NOT_IN_DOCUMENT } from "../src/components/question-box";
import { nearMisses, loadFixture } from "./helpers/stub-model";

const adhesion = loadFixture("adhesion-contract");
const real = adhesion.sidecar.flags[0].sourceSentence;
const real2 = adhesion.sidecar.cleared[0].sourceSentence;
const stub = (payload: unknown): AskModel => ({ ask: async () => payload });
const throwing = (e: Error): AskModel => ({ ask: async () => { throw e; } });
const ask = (m: AskModel, q = "What happens?") => answerQuestion(adhesion.text, q, m, { logger: () => {} });
const html = (a: Answer) => renderToStaticMarkup(<AnswerView answer={a} />);

beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw new Error("network access attempted"); })));
afterEach(() => vi.unstubAllGlobals());

describe("answerQuestion citations (criterion 4)", () => {
  it("shows a cited answer with a real fixture sentence as cited, in a quotation", async () => {
    const a = await ask(stub({ kind: "cited", answer: "The clause covers it.", sourceSentences: [real] }));
    expect(a).toMatchObject({ kind: "cited", sourceSentences: [real] });
    const out = html(a);
    expect(out).toContain("From the document");
    expect(out).toContain("<blockquote");
    expect(out).toContain("The clause covers it.");
  });

  it("downgrades a hallucinated citation and never shows it as cited", async () => {
    const a = await ask(stub({ kind: "cited", answer: "Yes.", sourceSentences: ["The client owes the signer a pony."] }));
    expect(a.kind).toBe("not-in-document");
    expect((a as { dropped: unknown[] }).dropped).toHaveLength(1);
    const out = html(a);
    expect(out).toContain(NOT_IN_DOCUMENT);
    expect(out).not.toContain("<blockquote");
    expect(out).not.toContain("Yes.");
  });

  it.each(Object.entries(nearMisses(real)))("downgrades a near-miss citation (%s)", async (_n, miss) => {
    if (adhesion.text.includes(miss)) return; // a variant that is genuinely in the text is not a miss
    const a = await ask(stub({ kind: "cited", answer: "Yes.", sourceSentences: [miss] }));
    expect(a.kind).toBe("not-in-document");
  });

  it("drops a failed citation, keeps a verified one, and says how many were dropped", async () => {
    const a = await ask(stub({ kind: "cited", answer: "Both apply.", sourceSentences: [real, "Invented sentence.", real2, real] }));
    expect(a).toMatchObject({ kind: "cited", sourceSentences: [real, real2] });
    expect((a as { dropped: unknown[] }).dropped).toHaveLength(2);
    expect(html(a)).toContain("2 cited sentences could not be found");
  });

  it.each([
    ["no citations", { kind: "cited", answer: "Yes.", sourceSentences: [] }],
    ["missing citations", { kind: "cited", answer: "Yes." }],
    ["blank answer", { kind: "cited", answer: " ", sourceSentences: [real] }],
    ["empty citation", { kind: "cited", answer: "Yes.", sourceSentences: [""] }],
    ["unknown kind", { kind: "maybe", answer: "Yes.", sourceSentences: [real] }],
    ["non-string citation", { kind: "cited", answer: "Yes.", sourceSentences: [7] }],
  ])("downgrades an uncited payload: %s", async (_n, payload) => {
    const a = await ask(stub(payload));
    expect(a.kind).toBe("not-in-document");
    expect(html(a)).not.toContain("<blockquote");
  });

  it("renders the plain statement for an enforceability question when the model says not-in-document", async () => {
    const a = await ask(stub({ kind: "not-in-document", answer: null, sourceSentences: [] }), "Is this indemnity enforceable?");
    expect(a).toEqual({ kind: "not-in-document", dropped: [] });
    expect(html(a)).toContain("The document does not say.");
  });

  it("ignores citations and answer text that accompany a not-in-document verdict", async () => {
    const a = await ask(stub({ kind: "not-in-document", answer: "Courts usually enforce it.", sourceSentences: [real] }));
    expect(html(a)).not.toContain("Courts usually");
    expect(html(a)).not.toContain("<blockquote");
  });

  it("every outcome is cited with a verified sentence or the plain statement", async () => {
    const payloads = [
      { kind: "cited", answer: "A", sourceSentences: [real] },
      { kind: "cited", answer: "A", sourceSentences: ["nope"] },
      { kind: "not-in-document", answer: null, sourceSentences: [] },
      { kind: "cited" },
      { kind: 3 },
    ];
    for (const p of payloads) {
      const a = await ask(stub(p));
      if (a.kind === "cited") {
        expect(a.sourceSentences.length).toBeGreaterThan(0);
        for (const s of a.sourceSentences) expect(adhesion.text.includes(s)).toBe(true);
      } else expect(a.kind).toBe("not-in-document");
    }
  });
});

describe("answerQuestion failures", () => {
  it.each([
    ["missing-key", new ModelConfigError("x")],
    ["provider-error", new ModelProviderError("x", 500)],
    ["malformed-output", new ModelOutputError("x")],
    ["provider-error", new Error("boom")],
  ])("maps to %s", async (reason, err) => {
    const a = await ask(throwing(err));
    expect(a).toMatchObject({ kind: "failed", reason });
    expect(html(a)).toContain((a as { message: string }).message);
  });

  it("maps a non-object payload to malformed-output", async () => {
    expect(await ask(stub("text"))).toMatchObject({ kind: "failed", reason: "malformed-output" });
    expect(await ask(stub(null))).toMatchObject({ kind: "failed", reason: "malformed-output" });
  });
});

describe("OpenRouter ask model", () => {
  const ENV = { OPENROUTER_API_KEY: "test-key", OPENROUTER_MODEL: "test/model-from-env" };
  it("sends the pinned zdr provider, low reasoning, strict json_schema and the question and document", async () => {
    const f = vi.fn(async (_u: unknown, _i?: RequestInit) =>
      new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ kind: "not-in-document", answer: null, sourceSentences: [] }) } }] })));
    vi.stubGlobal("fetch", f);
    const a = await answerQuestion(adhesion.text, "Is it typical?", createOpenRouterAskModel(() => ENV), { logger: () => {} });
    expect(a.kind).toBe("not-in-document");
    const [url, init] = f.mock.calls[0];
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect((init!.headers as Record<string, string>).Authorization).toBe("Bearer test-key");
    const body = JSON.parse(init!.body as string);
    expect(body.model).toBe("test/model-from-env");
    expect(body.provider).toEqual({ order: ["fireworks"], allow_fallbacks: false, require_parameters: true, zdr: true });
    expect(body.reasoning).toEqual({ effort: "low" });
    expect(body.response_format).toEqual({ type: "json_schema", json_schema: { name: "redline_answer", strict: true, schema: ANSWER_JSON_SCHEMA } });
    const user = body.messages.find((m: { role: string }) => m.role === "user").content as string;
    expect(user).toContain("Is it typical?");
    expect(user).toContain(adhesion.text);
    const system = body.messages.find((m: { role: string }) => m.role === "system").content as string;
    expect(system).toMatch(/enforceable/);
    expect(system).toMatch(/not-in-document/);
  });

  it("names a missing key without calling the network", async () => {
    const a = await answerQuestion("t", "q", createOpenRouterAskModel(() => ({ OPENROUTER_MODEL: "m" })), { logger: () => {} });
    expect(a).toMatchObject({ kind: "failed", reason: "missing-key" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("maps a provider HTTP error and non-JSON content", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: { message: "no route" } }), { status: 404 })));
    expect(await answerQuestion("t", "q", createOpenRouterAskModel(() => ENV), { logger: () => {} })).toMatchObject({ reason: "provider-error" });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: "not json" } }] }))));
    expect(await answerQuestion("t", "q", createOpenRouterAskModel(() => ENV), { logger: () => {} })).toMatchObject({ reason: "malformed-output" });
  });
});

describe("POST /api/ask handler", () => {
  const model = stub({ kind: "cited", answer: "A", sourceSentences: [real] });
  const deps = (over = {}) => ({ configured: false, getUser: async () => null, model, ...over });
  const post = (body: unknown, d = deps()) =>
    handleAsk(new Request("http://x/api/ask", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) }), d);

  it("answers a valid request", async () => {
    const res = await post({ text: adhesion.text, question: "Who pays?" });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ kind: "cited", sourceSentences: [real] });
  });
  it("requires sign-in when Supabase is configured", async () => {
    const res = await post({ text: "t", question: "q" }, deps({ configured: true }));
    expect(res.status).toBe(401);
    expect((await res.json()).reason).toBe("signed-out");
    expect((await post({ text: adhesion.text, question: "q" }, deps({ configured: true, getUser: async () => ({ id: "u" }) }))).status).toBe(200);
  });
  it.each([
    ["not json", "{"],
    ["no text", { question: "q" }],
    ["blank text", { text: "  ", question: "q" }],
    ["no question", { text: "t" }],
    ["blank question", { text: "t", question: "   " }],
    ["long question", { text: "t", question: "a".repeat(1001) }],
    ["non-string question", { text: "t", question: 5 }],
  ])("rejects %s with 400", async (_n, body) => {
    const res = await post(body);
    expect(res.status).toBe(400);
    expect((await res.json()).kind).toBe("failed");
  });
  it("accepts a 1000 character question", async () => {
    expect((await post({ text: adhesion.text, question: "a".repeat(1000) })).status).toBe(200);
  });
  it("maps failures to 503 and 502", async () => {
    expect((await post({ text: "t", question: "q" }, deps({ model: throwing(new ModelConfigError("k")) }))).status).toBe(503);
    expect((await post({ text: "t", question: "q" }, deps({ model: throwing(new ModelProviderError("p")) }))).status).toBe(502);
  });
  it("does not log the document or the question", async () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    await post({ text: adhesion.text, question: "SECRETQUESTION" }, deps({ model: stub({ kind: "cited", answer: "A", sourceSentences: ["Invented SECRETQUOTE."] }) }));
    expect(JSON.stringify(spy.mock.calls)).not.toMatch(/SECRET/);
    spy.mockRestore();
  });
});
