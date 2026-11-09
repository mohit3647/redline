import { answerQuestion, askFailure } from "./answer";
import type { Answer, AskModel } from "./types";

export interface AskHandlerDeps {
  getUser: () => Promise<{ id: string } | null>;
  model: AskModel;
}

const MAX_TEXT = 400_000;
export const MAX_QUESTION = 1000;

function json(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

const bad = (message: string, reason: "signed-out" | "bad-request", status: number) =>
  json({ kind: "failed", reason, message }, status);

/** POST {text, question} -> Answer. Document text and question are never logged. */
export async function handleAsk(request: Request, deps: AskHandlerDeps): Promise<Response> {
  if (!(await deps.getUser())) return bad("Sign in to ask about an agreement.", "signed-out", 401);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return bad("The request was not valid JSON.", "bad-request", 400);
  }
  const b = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  if (typeof b.text !== "string" || b.text.trim() === "" || b.text.length > MAX_TEXT) {
    return bad("The request needs the agreement text.", "bad-request", 400);
  }
  const question = typeof b.question === "string" ? b.question.trim() : "";
  if (question.length < 1 || question.length > MAX_QUESTION) {
    return bad(`A question must be between 1 and ${MAX_QUESTION} characters.`, "bad-request", 400);
  }
  const answer: Answer = await answerQuestion(b.text, question, deps.model);
  if (answer.kind !== "failed") return json(answer, 200);
  return json(answer, answer.reason === "missing-key" ? 503 : 502);
}
