/** Why a cited sentence was not shown. Holds no document text, so it is safe to log. */
export interface AskDropped {
  reason: "empty-quote" | "not-verbatim" | "duplicate" | "malformed";
  detail: string;
}

export type AskFailureReason = "missing-key" | "provider-error" | "malformed-output";

/**
 * What the question box shows. A cited answer always has at least one sentence that is an exact
 * substring of the document. Anything else is either "the document does not say" or a named failure.
 */
export type Answer =
  | { kind: "cited"; answer: string; sourceSentences: string[]; dropped: AskDropped[] }
  | { kind: "not-in-document"; note?: string; dropped: AskDropped[] }
  | { kind: "failed"; reason: AskFailureReason; message: string };

export type RawAnswerPayload = unknown;

export interface AskModel {
  ask(input: { documentText: string; question: string }): Promise<RawAnswerPayload>;
}
