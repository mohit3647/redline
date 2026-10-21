/**
 * The one JSON schema for the analysis payload. The model client sends it as the strict
 * `response_format`; the seam's validator (analyse.ts) enforces the same required fields, and a
 * test keeps the two in step. Strict mode needs every property listed in `required` and
 * `additionalProperties: false`, so optional values are nullable instead.
 */
const nullableString = { type: ["string", "null"] } as const;

export const ANALYSIS_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "fee", "flags", "cleared"],
  properties: {
    summary: { type: "string" },
    fee: {
      anyOf: [
        {
          type: "object",
          additionalProperties: false,
          required: ["amount", "currency", "sourceSentence"],
          properties: {
            amount: { type: "number" },
            currency: { type: "string" },
            sourceSentence: { type: "string" },
          },
        },
        { type: "null" },
      ],
    },
    flags: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "kind",
          "clauseType",
          "severity",
          "sourceSentence",
          "claim",
          "consequence",
          "counterOffer",
          "triggeredByRedLine",
        ],
        properties: {
          id: { type: "string" },
          kind: { type: "string", enum: ["risk", "confidentiality"] },
          clauseType: { type: "string" },
          severity: { type: ["string", "null"], enum: ["critical", "serious", "minor", null] },
          sourceSentence: { type: "string" },
          claim: { type: "string" },
          consequence: {
            type: "object",
            additionalProperties: false,
            required: ["low", "high", "basis"],
            properties: {
              low: { type: "string" },
              high: { type: "string" },
              basis: { type: "string" },
            },
          },
          counterOffer: { type: "string" },
          triggeredByRedLine: nullableString,
        },
      },
    },
    cleared: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["clauseType", "finding", "sourceSentence"],
        properties: {
          clauseType: { type: "string" },
          finding: { type: "string" },
          sourceSentence: { type: "string" },
        },
      },
    },
  },
} as const;
