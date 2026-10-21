import { ANALYSIS_JSON_SCHEMA } from "../analyse/schema";
import { ModelConfigError, ModelOutputError, ModelProviderError } from "../analyse/run";
import type { AnalysisModel, RawAnalysisPayload } from "../analyse/types";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";

export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const TIMEOUT_MS = 120_000;

export interface OpenRouterEnv {
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
}

export type ChatMessage = { role: "system" | "user"; content: string };

/** The one request shape for every Redline model call. The model id comes from the environment only. */
export function buildChatBody(model: string, messages: ChatMessage[], schemaName: string, schema: unknown) {
  return {
    model,
    messages,
    // ADR 0005: zero-data-retention routes only, pinned provider, no fallback to an unpinned route.
    provider: { order: ["fireworks"], allow_fallbacks: false, require_parameters: true, zdr: true },
    reasoning: { effort: "low" },
    response_format: { type: "json_schema", json_schema: { name: schemaName, strict: true, schema } },
  };
}

/** Builds the analysis request body. */
export function buildRequestBody(model: string, input: Parameters<AnalysisModel["analyse"]>[0]) {
  return buildChatBody(
    model,
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(input) },
    ],
    "redline_analysis",
    ANALYSIS_JSON_SCHEMA,
  );
}

export function readOpenRouterEnv(): OpenRouterEnv {
  return { OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY, OPENROUTER_MODEL: process.env.OPENROUTER_MODEL };
}

/**
 * Server-side only. Posts one structured-output request and returns the parsed JSON content.
 * Throws the named errors the seams map to failure states.
 */
export async function callOpenRouter(env: OpenRouterEnv, messages: ChatMessage[], schemaName: string, schema: unknown): Promise<unknown> {
  const key = env.OPENROUTER_API_KEY?.trim();
  const model = env.OPENROUTER_MODEL?.trim();
  if (!key) throw new ModelConfigError("OPENROUTER_API_KEY is not set");
  if (!model) throw new ModelConfigError("OPENROUTER_MODEL is not set");

  let res: Response;
  try {
    res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(buildChatBody(model, messages, schemaName, schema)),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    throw new ModelProviderError(`request to OpenRouter failed: ${e instanceof Error ? e.name : "unknown"}`);
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    if (!res.ok) throw new ModelProviderError(`OpenRouter returned HTTP ${res.status}`, res.status);
    throw new ModelOutputError("OpenRouter response was not JSON");
  }
  const errorMessage = readError(body);
  if (!res.ok || errorMessage) {
    throw new ModelProviderError(errorMessage ?? `OpenRouter returned HTTP ${res.status}`, res.ok ? undefined : res.status);
  }

  const content = readContent(body);
  if (content === undefined) throw new ModelOutputError("OpenRouter response had no message content");
  try {
    return JSON.parse(content) as unknown;
  } catch {
    throw new ModelOutputError("model content was not valid JSON");
  }
}

/** Server-side only: reads the key and model at call time. */
export function createOpenRouterModel(readEnv: () => OpenRouterEnv = readOpenRouterEnv): AnalysisModel {
  return {
    async analyse(input): Promise<RawAnalysisPayload> {
      return callOpenRouter(
        readEnv(),
        [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(input) },
        ],
        "redline_analysis",
        ANALYSIS_JSON_SCHEMA,
      );
    },
  };
}

function readError(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const err = (body as { error?: unknown }).error;
  if (err === undefined || err === null) return undefined;
  const msg = typeof err === "object" ? (err as { message?: unknown }).message : err;
  return typeof msg === "string" ? msg.slice(0, 300) : "OpenRouter returned an error";
}

function readContent(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const choices = (body as { choices?: unknown }).choices;
  if (!Array.isArray(choices)) return undefined;
  const message = (choices[0] as { message?: { content?: unknown } } | undefined)?.message;
  return typeof message?.content === "string" ? message.content : undefined;
}
