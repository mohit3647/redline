import { runAnalysis } from "./run";
import type { AnalysisOutcome } from "./run";
import type { AnalysisModel, ContractValue, RedLine } from "./types";

export interface HandlerDeps {
  /** True when Supabase is configured: a signed-in user is then required. */
  configured: boolean;
  getUser: () => Promise<{ id: string } | null>;
  model: AnalysisModel;
}

const MAX_TEXT = 400_000;

function json(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function parseRedLines(v: unknown): RedLine[] | null {
  if (v === undefined) return [];
  if (!Array.isArray(v)) return null;
  const out: RedLine[] = [];
  for (const r of v) {
    if (typeof r !== "object" || r === null || typeof (r as { text?: unknown }).text !== "string") return null;
    out.push({ text: (r as { text: string }).text });
  }
  return out;
}

function parseValue(v: unknown): ContractValue | undefined | null {
  if (v === undefined || v === null) return undefined;
  const o = v as { amount?: unknown; currency?: unknown };
  if (typeof o.amount !== "number" || !Number.isFinite(o.amount) || o.amount < 0) return null;
  if (typeof o.currency !== "string" || o.currency.trim() === "") return null;
  return { amount: o.amount, currency: o.currency };
}

/**
 * POST {text, redLines?, contractValue?} -> AnalysisOutcome. Document text is never logged.
 * Failures are returned as {status:"failed", reason, message} with a matching HTTP status.
 */
export async function handleAnalyse(request: Request, deps: HandlerDeps): Promise<Response> {
  if (deps.configured && !(await deps.getUser())) {
    return json({ status: "failed", reason: "signed-out", message: "Sign in to analyse an agreement." }, 401);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ status: "failed", reason: "bad-request", message: "The request was not valid JSON." }, 400);
  }
  const b = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const redLines = parseRedLines(b.redLines);
  const contractValue = parseValue(b.contractValue);
  if (typeof b.text !== "string" || b.text.trim() === "" || b.text.length > MAX_TEXT || !redLines || contractValue === null) {
    return json({ status: "failed", reason: "bad-request", message: "The request needs the agreement text." }, 400);
  }

  const outcome: AnalysisOutcome = await runAnalysis({ text: b.text, redLines, contractValue }, deps.model);
  if (outcome.status === "ok") return json(outcome, 200);
  const status = outcome.reason === "missing-key" ? 503 : 502;
  return json(outcome, status);
}

