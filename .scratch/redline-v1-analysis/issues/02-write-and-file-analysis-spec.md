# 02 — Write the analysis spec and file it

Status: wontfix
Blocked by: 01

Once the seam and fee handling are confirmed, write the spec to
`.scratch/redline-v1-analysis/spec.md` using the `/to-spec` template (problem,
solution, user stories, implementation decisions, testing decisions, out of
scope, further notes) and set it to `ready-for-agent`.

Constraints it must respect, all already recorded:

- ADR 0001 — every flag carries its exact source sentence; a flag that cannot
  is dropped, never shown bare
- ADR 0003 — severity is expected cost; danger is absolute, not relative to
  market; the three anchors are uncapped indemnity, over-broad IP assignment,
  and termination for convenience without a kill fee
- ADR 0004 — flag freely, split the voice (certain about text, ranged about
  consequence), and show a cleared list rather than an empty state
- ADR 0005 — the document's own confidentiality clause is flagged whenever
  present, for a different reason than harm to the signer
- PRD §4 — the ten acceptance criteria are what the test suite must measure
- `CONTEXT.md` — use signer, flag, source sentence, counter-offer, red line,
  cleared list, severity, consequence; do not drift to synonyms

## Comments

**2026-09-16 — superseded; no separate spec was written.** Tickets were cut
straight from PRD.md and ADRs 0001–0005 into `.scratch/redline-v1/`, covering
all of v1 rather than only the analysis. Every constraint listed above is
carried into those tickets' acceptance criteria.
