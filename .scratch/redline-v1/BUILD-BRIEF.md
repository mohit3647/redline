# Build brief shared by every implementation subagent

Written by the orchestrator for the unattended build. Read this, then your ticket, then do only that ticket.

## Read first
CLAUDE.md, PRD.md, CONTEXT.md, PRODUCT.md, DESIGN.md, docs/adr/*, `.impeccable/surfaces/*`, your ticket in `.scratch/redline-v1/issues/`. There is no spec.md: the tickets are the spec. The glossary in CONTEXT.md governs wording ("client" = counterparty; never use "redline" as a noun for a counter-offer).

## Answers to the two "ask first" items (settled, do not reopen)
1. Model: whatever `OPENROUTER_MODEL` says, called through OpenRouter's OpenAI-compatible endpoint (`https://openrouter.ai/api/v1/chat/completions`) with `OPENROUTER_API_KEY`. Pin the provider: `provider: { order: ["fireworks"], allow_fallbacks: false, require_parameters: true }`, set reasoning effort low (`reasoning: { effort: "low" }`), and request structured JSON output (`response_format` json_schema) for every analysis and answer call. NEVER write a model id into code. Server-side only. ADR 0005 also requires zero-data-retention routing: include `provider.zdr: true` in the request body and cover it with a test.
2. Supabase: no project exists. Build sign-in, library and red lines against the Supabase client, reading `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Every table and policy is a SQL file under `supabase/migrations/` (the human runs them by hand later). The app must start and analyse a pasted/uploaded document with those two variables ABSENT; only library and red lines need an account. Do not mock auth in the product; when the variables are absent, account features show a plain "needs account setup" state.

## Dependencies
The human is away and cannot answer the ask-before-adding-a-dependency rule. Add the minimum needed, with pnpm, and list each in your final report with the reason. Pre-approved: vitest, tsx, @supabase/supabase-js, @supabase/ssr. Anything else: choose the smallest well-known option and report it.

## Definition of done (what does NOT count)
A function returning a fixed value; a TODO or "not implemented" error; a test that only checks a file exists or a function is defined; a test that mocks the thing it is meant to test. A ticket containing one is still open. Do not stub; implement.

## Fixtures and the model in tests
`tests/fixtures/adhesion-contract.txt` + `.expected.json` (planted clauses: fee, flags with exact sourceSentence, cleared entries) and `clean-contract.txt` + `.expected.json` (no flags). Every test needing a document uses these. In tests the model client is a stub returning payloads built from the sidecar JSON; the suite must run offline with no key. The stub replaces only the network model client, never the logic under test (exactness check, tiering, parsing, etc.).

## Design and copy
Every screen obeys DESIGN.md, PRODUCT.md and `.impeccable/surfaces/app-app-layout-tsx.md` (world "Tagged": white sheet, tags on a rail, quotation visually different from interpretation, not by colour alone, WCAG 2.2 AA, keyboard path). Do NOT start an impeccable direction round (it opens a browser and waits). All reader-visible copy must be run through the humanizer skill before you finish. Voice per ADR 0004: flat about text, ranged about consequence, never "may potentially expose you to certain risks". State only what the document says. Not-legal-advice statement beside every analysis.

## Commands
Package manager pnpm. Scripts: `pnpm typecheck` (tsc --noEmit), `pnpm test` (vitest run), `pnpm build`, `pnpm smoke`. Add the scripts if missing. Do not commit; the orchestrator verifies and commits. Never put a secret in a committed file; `.env.local` is gitignored and holds OPENROUTER_API_KEY / OPENROUTER_MODEL.

## Final report format
Files changed, dependencies added (with why), tests added and what each proves, anything you could not verify, any decision you made in place of asking.
