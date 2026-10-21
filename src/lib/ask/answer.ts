import { checkQuote } from "../analyse/analyse";
import { ModelConfigError, ModelOutputError } from "../analyse/run";
import type { Answer, AskDropped, AskFailureReason, AskModel } from "./types";

const MESSAGES: Record<AskFailureReason, string> = {
  "missing-key": "Questions are not set up on this deployment. The model key or model name is missing.",
  "provider-error": "The model provider did not return an answer. Nothing was answered. Try again in a moment.",
  "malformed-output": "The model answered in a form Redline could not read. Nothing was answered. Try again.",
};

export function askFailure(reason: AskFailureReason): Answer {
  return { kind: "failed", reason, message: MESSAGES[reason] };
}

export const NOTE_UNVERIFIED =
  "The model gave an answer, but none of the sentences it cited could be found in your document, so Redline does not show it.";
export const NOTE_UNCITED = "The model gave an answer without a sentence from your document to rest it on, so Redline does not show it.";

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Asks the model and returns what the signer may see. A cited answer carries at least one sentence
 * that is an exact substring of the document (the same check as flags, ADR 0001). A citation that
 * fails is dropped and recorded; if none survive, the answer is not shown as cited. Every failure is
 * a named state. Document and question text are never logged.
 */
export async function answerQuestion(
  documentText: string,
  question: string,
  model: AskModel,
  options: { logger?: (message: string) => void } = {},
): Promise<Answer> {
  const log = options.logger ?? ((m: string) => console.warn(m));
  let raw: unknown;
  try {
    raw = await model.ask({ documentText, question });
  } catch (e) {
    if (e instanceof ModelConfigError) return askFailure("missing-key");
    if (e instanceof ModelOutputError) return askFailure("malformed-output");
    return askFailure("provider-error");
  }
  if (!isObj(raw)) return askFailure("malformed-output");

  const dropped: AskDropped[] = [];
  const drop = (d: AskDropped) => {
    dropped.push(d);
    log(`[redline] dropped answer citation (${d.reason}): ${d.detail}`);
  };

  if (raw.kind === "not-in-document") return { kind: "not-in-document", dropped };

  if (raw.kind !== "cited") {
    drop({ reason: "malformed", detail: "kind is neither cited nor not-in-document" });
    return { kind: "not-in-document", note: NOTE_UNCITED, dropped };
  }
  const answer = typeof raw.answer === "string" ? raw.answer.trim() : "";
  if (answer === "") {
    drop({ reason: "malformed", detail: "cited answer has no answer text" });
    return { kind: "not-in-document", note: NOTE_UNCITED, dropped };
  }
  if (!Array.isArray(raw.sourceSentences) || raw.sourceSentences.length === 0) {
    drop({ reason: "malformed", detail: "cited answer has no source sentences" });
    return { kind: "not-in-document", note: NOTE_UNCITED, dropped };
  }

  const sourceSentences: string[] = [];
  for (const s of raw.sourceSentences) {
    if (typeof s !== "string") {
      drop({ reason: "malformed", detail: "source sentence is not a string" });
      continue;
    }
    const check = checkQuote(documentText, s);
    if (!check.ok) {
      drop({
        reason: check.reason,
        detail: check.reason === "empty-quote" ? "source sentence is empty" : "source sentence is not an exact substring of the document",
      });
      continue;
    }
    if (sourceSentences.includes(s)) {
      drop({ reason: "duplicate", detail: "source sentence repeated" });
      continue;
    }
    sourceSentences.push(s);
  }
  if (sourceSentences.length === 0) return { kind: "not-in-document", note: NOTE_UNVERIFIED, dropped };
  return { kind: "cited", answer, sourceSentences, dropped };
}
