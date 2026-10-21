/** Strict json_schema for the model's answer. Every property is required; unused ones are null or empty. */
export const ANSWER_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["kind", "answer", "sourceSentences"],
  properties: {
    kind: { type: "string", enum: ["cited", "not-in-document"] },
    answer: { type: ["string", "null"] },
    sourceSentences: { type: "array", items: { type: "string" } },
  },
} as const;
