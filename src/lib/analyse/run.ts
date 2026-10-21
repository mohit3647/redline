import { analyse } from "./analyse";
import type { Analysis, AnalysisModel, ContractValue, RedLine } from "./types";

export type FailureReason = "missing-key" | "provider-error" | "malformed-output" | "no-valid-analysis";

export type AnalysisOutcome =
  | { status: "ok"; analysis: Analysis }
  | { status: "failed"; reason: FailureReason; message: string };

/** Named errors a model client throws, so failures map to explicit states and never to a blank result. */
export class ModelConfigError extends Error {
  override name = "ModelConfigError";
}
export class ModelProviderError extends Error {
  override name = "ModelProviderError";
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}
export class ModelOutputError extends Error {
  override name = "ModelOutputError";
}

const MESSAGES: Record<FailureReason, string> = {
  "missing-key": "Analysis is not set up on this deployment. The model key or model name is missing.",
  "provider-error": "The model provider did not return an answer. Nothing was analysed. Try again in a moment.",
  "malformed-output": "The model answered in a form Redline could not read. Nothing was analysed. Try again.",
  "no-valid-analysis":
    "The model's answer held no flag and no cleared clause that could be matched to a sentence in the document. Nothing is shown rather than a guess. Try again.",
};

export function failure(reason: FailureReason): AnalysisOutcome {
  return { status: "failed", reason, message: MESSAGES[reason] };
}

/**
 * Runs the seam and maps every failure to a named state. A result with zero valid flags AND zero
 * cleared entries is a failure: a clean document still yields a populated cleared list (ADR 0004).
 * Drops are logged without the quoted text, so document content never reaches logs.
 */
export async function runAnalysis(
  input: { text: string; redLines: RedLine[]; contractValue?: ContractValue },
  model: AnalysisModel,
): Promise<AnalysisOutcome> {
  let analysis: Analysis;
  try {
    analysis = await analyse(input.text, input.redLines, model, input.contractValue, {
      logger: (_message, d) =>
        console.warn(`[redline] dropped ${d.kind} (${d.reason}): ${d.detail}${d.label ? ` [${d.label}]` : ""}`),
    });
  } catch (e) {
    if (e instanceof ModelConfigError) return failure("missing-key");
    if (e instanceof ModelOutputError) return failure("malformed-output");
    return failure("provider-error");
  }
  if (analysis.flags.length === 0 && analysis.cleared.length === 0) return failure("no-valid-analysis");
  return { status: "ok", analysis };
}
