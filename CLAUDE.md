# Redline

A web app that reads a contract, lease, freelance agreement, or terms of service and tells the
reader what they are actually signing.

## Capabilities in scope

Build these and stop:

- Plain-English summary of the document
- Risky clauses ranked by severity, each showing the exact source sentence
- A drafted counter-offer for each flagged clause
- A question box that answers only from the document
- An editable list of the user's own red lines, which drives the analysis
- A saved library of past documents

## Settled decisions — do not reopen

- Next.js. Supabase for auth and database. Deployed on Vercel.
- The uploaded file is parsed in the browser. Only text is stored, never the file.
- The model is called through OpenRouter.
- Every risk flag cites the exact sentence it came from. A flag whose source sentence cannot be
  shown is a bug, not a degraded result.

## Deliberately excluded

Payments, billing, OCR for scanned documents, and sharing a document between users are out of scope
on purpose. This version exists to prove the analysis can be trusted, and none of them make it more
trustworthy. OCR would actively undermine it: a citation is worthless when the text it points at
was misread.

## Ask before

- Adding any dependency.
- Anything that looks like the obvious next step but is not in the capability list above.
- Choosing the OpenRouter model, the package manager, or the Supabase development setup. All three
  are deliberately undecided until the PRD is written. Do not pick one silently.

## Standing rules

- Keep credentials in `.env.local`, which is gitignored. Never commit a secret: this repo is
  public, so a key is exposed the moment it is pushed and has to be rotated.
- State only what the document says. Where the text does not support a claim, the product does not
  make it — in the summary, the severity ranking, the counter-offers, and the question box alike.

## Read before you work

- `research/summary.md` — the user research, including the evidence that cuts against the original
  hypothesis. Read it before deciding what the product should do.
- `PRD.md` — the brief, once it exists. Read it before building.

## Agent skills

- **Issue tracker** — local markdown under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.
- **Triage labels** — the default five-role vocabulary. See `docs/agents/triage-labels.md`.
- **Domain docs** — single-context. See `docs/agents/domain.md`.
