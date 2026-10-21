import { callOpenRouter, readOpenRouterEnv } from "../model/openrouter";
import type { OpenRouterEnv } from "../model/openrouter";
import { ANSWER_JSON_SCHEMA } from "./schema";
import { ASK_SYSTEM_PROMPT, buildAskUserPrompt } from "./prompt";
import type { AskModel } from "./types";

/** Same endpoint, pinned zero-data-retention provider and model as the analysis. */
export function createOpenRouterAskModel(readEnv: () => OpenRouterEnv = readOpenRouterEnv): AskModel {
  return {
    ask: (input) =>
      callOpenRouter(
        readEnv(),
        [
          { role: "system", content: ASK_SYSTEM_PROMPT },
          { role: "user", content: buildAskUserPrompt(input) },
        ],
        "redline_answer",
        ANSWER_JSON_SCHEMA,
      ),
  };
}
