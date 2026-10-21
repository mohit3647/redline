import { existsSync } from "node:fs";
import { join } from "node:path";
import { analyse } from "../src/lib/analyse";
import { orderFlags } from "../src/lib/analyse/order";
import { createOpenRouterModel } from "../src/lib/model/openrouter";
import { loadFixture, stubModel } from "../tests/helpers/stub-model";

const envFile = join(process.cwd(), ".env.local");
if (existsSync(envFile)) process.loadEnvFile(envFile);

async function main() {
  const { text, sidecar } = loadFixture("adhesion-contract");
  const live = Boolean(process.env.OPENROUTER_API_KEY?.trim() && process.env.OPENROUTER_MODEL?.trim());
  if (live) console.log("Using the real OpenRouter model.\n");
  else console.log("NO KEY: using the sidecar stub, this does not exercise the model\n");
  const model = live ? createOpenRouterModel() : stubModel("adhesion-contract");

  const analysis = await analyse(text, [], model, undefined, {
    logger: (_m, d) => console.warn(`dropped ${d.kind} (${d.reason}): ${d.detail}`),
  });

  const { ranked, confidentiality } = orderFlags(analysis.flags);
  console.log(`SUMMARY: ${analysis.summary}\n`);
  for (const f of [...ranked, ...confidentiality]) {
    console.log(`[${f.severity ?? "none"}] ${f.clauseType} (${f.kind})\n  claim: ${f.claim}\n  source: ${f.sourceSentence}\n`);
  }
  console.log(`dropped: ${analysis.dropped.length}`);
  console.log(`cleared (${analysis.cleared.length}):`);
  for (const c of analysis.cleared) console.log(`  - ${c.clauseType}: ${c.finding}\n    source: ${c.sourceSentence}`);

  console.log("\nCOMPARISON WITH SIDECAR");
  for (const e of sidecar.flags) {
    const hit = analysis.flags.find((f) => f.sourceSentence === e.sourceSentence);
    if (!hit) console.log(`  MISSED ${e.id} (expected ${e.expectedSeverityBand ?? "confidentiality"})`);
    else console.log(`  found  ${e.id}: severity ${hit.severity ?? "none"} (expected ${e.expectedSeverityBand ?? "none"})${hit.severity === e.expectedSeverityBand ? "" : "  BAND DIFFERS"}`);
  }
  for (const e of sidecar.cleared) {
    console.log(`  ${analysis.cleared.some((c) => c.sourceSentence === e.sourceSentence) ? "found " : "MISSED"} cleared ${e.id}`);
  }
  const extra = analysis.flags.filter((f) => !sidecar.flags.some((e) => e.sourceSentence === f.sourceSentence));
  for (const f of extra) console.log(`  EXTRA flag not in sidecar: ${f.clauseType} [${f.severity}]`);

  const quotes = [...analysis.flags.map((f) => f.sourceSentence), ...analysis.cleared.map((c) => c.sourceSentence)];
  const bad = quotes.filter((q) => !text.includes(q));
  if (bad.length) {
    console.error(`FAIL: ${bad.length} returned quote(s) are not exact substrings`);
    process.exit(1);
  }
  console.log("\nAll returned quotes are exact substrings.");
}

main().catch((e) => {
  console.error(`smoke failed: ${e instanceof Error ? `${e.name}: ${e.message}` : e}`);
  process.exit(1);
});
