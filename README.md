# Redline

Production: https://redline-teal-omega.vercel.app

Redline reads a freelance client agreement and tells you what you are actually signing.

Upload the agreement before you sign it. Redline returns:

- a plain-English summary of the document
- risky clauses ranked by severity, each showing the exact sentence it came from
- a drafted counter-offer for each flagged clause
- a list of the clauses it checked and found acceptable
- a question box that answers only from the document
- a flag on the document's own confidentiality clause

You can also keep an editable list of your own red lines, which drives the analysis, and a library of past documents.

## Who it is for

Version 1 is for freelancers and independent contractors who are about to sign a negotiable client agreement and have no lawyer. It is not for documents you cannot negotiate (a gym contract, a bank's terms, a software vendor's terms of service) or for agreements you have already signed. See [ADR 0002](docs/adr/0002-freelancers-pre-signature-negotiable-documents.md).

## Principles

- **Every flag cites its source.** A flag whose source sentence cannot be shown is a bug, not a degraded result ([ADR 0001](docs/adr/0001-every-flag-cites-its-source.md)).
- **The document is the only source of claims.** Where the text does not support a statement, Redline does not make it, in the summary, the ranking, the counter-offers and the question box alike.
- **Severity is expected cost to the signer.** Danger is absolute, not relative to market ([ADR 0003](docs/adr/0003-severity-is-expected-cost.md)).
- **Analysis leaves your browser.** The file is parsed in the browser and only its text is stored, never the file. The text is sent to the model for analysis, and the app says so before you upload ([ADR 0005](docs/adr/0005-disclose-that-analysis-leaves-the-browser.md)).

## Stack

- [Next.js](https://nextjs.org/) 16 and React 19
- [Supabase](https://supabase.com/) for auth and the database, run locally through its CLI in development
- Claude Sonnet 5 through [OpenRouter](https://openrouter.ai/), on zero-data-retention routes only
- Deployed on Vercel
- [pnpm](https://pnpm.io/) as the package manager, [Vitest](https://vitest.dev/) for tests

## Getting started

You need Node, Docker (running), and the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).

```sh
pnpm install
supabase start          # Postgres, auth and a local mail catcher, in Docker
supabase status         # prints the API URL and anon key
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | API URL from `supabase status` (usually `http://127.0.0.1:54321`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key from `supabase status` |
| `OPENROUTER_API_KEY` | your OpenRouter key |
| `OPENROUTER_MODEL` | the model slug to call |

`.env.local` is gitignored. This repo is public, so never commit a key. If one is pushed, rotate it.

```sh
pnpm dev
```

Open http://localhost:3000. Sign-in uses magic links. Locally the emails never leave your machine; open the mail catcher at http://127.0.0.1:54324 to click the link.

If `pnpm` is not on your PATH, run it as `corepack pnpm`.

Without the two Supabase variables the app still starts: the landing page renders and `/app` works without sign-in so you can try the analysis locally, but nothing can be saved. More detail is in [docs/dev-setup.md](docs/dev-setup.md).

## Production settings

The live app needs four settings. Each is set on Vercel (production) and in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm typecheck` | Type-check with `tsc --noEmit` |
| `pnpm test` | Run the test suite once |
| `pnpm smoke` | Run `scripts/smoke.ts` |

## Database

The schema lives only in `supabase/migrations/`. Create a migration with `supabase migration new <name>`, write the SQL, then run `supabase db reset` to confirm it applies from scratch. Do not edit tables in Studio (http://127.0.0.1:54323).

## Project layout

```
app/          Next.js routes: landing page, sign-in, the app, API routes
src/          components and library code
supabase/     config.toml and migrations
tests/        Vitest suites and fixtures
docs/         dev setup, measurement status, ADRs (docs/adr/)
research/     user research
```

## Documentation

- [PRD.md](PRD.md): the product brief
- [CONTEXT.md](CONTEXT.md): the project's vocabulary
- [docs/adr/](docs/adr/): the reasoning behind each decision
- [research/summary.md](research/summary.md): the user research, including evidence against the original hypothesis
- [BUILD-REPORT.md](BUILD-REPORT.md): what the unattended build did, decided and could not verify

## Out of scope

Payments, billing, OCR for scanned documents, and sharing a document between users are excluded on purpose. This version exists to prove the analysis can be trusted. OCR would undermine that, because a citation is worthless when the text it points at was misread.

## Status

Version 1 is in progress. Several paths have never run against a real Supabase or the real model, and the landing page sample is an illustration until it can be captured from the real pipeline. [BUILD-REPORT.md](BUILD-REPORT.md) lists exactly what is unverified.
