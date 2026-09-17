# 01 — Confirm the analysis seam and how severity handles an unknown fee

Status: wontfix

Blocked on the user. `/to-spec` reached its seam checkpoint and stopped; the
spec cannot be written until these three are confirmed.

**Proposed scope for the first spec:** PRD §3 capabilities 3–6 — summary, flags
with source sentences, cleared list, and the per-clause counter-offer. Counter-
offer is included because it is a field on a flag, not a separate pass, so
excluding it would mean revising the return type immediately.

**Proposed seam, one, as high as it goes:**
`analyse(documentText, redLines, model) → Analysis`, where `Analysis` is
`{ summary, flags[], cleared[] }` and the seam's contract is that nothing
escapes it whose quote is not a verbatim substring of `documentText`. ADR 0001's
invariant is enforced inside, before anything is returned. The model is a
parameter rather than a second seam, so the same function serves fast
deterministic tests (fake model returning a hallucinated quote — assert the flag
is dropped) and real eval runs against the labelled set.

**The open question the PRD leaves underdetermined.** PRD §5 defines the
Serious/Minor line relative to "the fee for the job", but the fee is not always
in the document (hourly work, retainers, a rate card in a separate schedule).
Options: `analyse` takes an optional `contractValue`; or it extracts the fee and
treats absence as a hard stop on tiering; or tiers become absolute money bands
and the fee leaves the definition. Recommended: the first — extract when stated,
accept as input when not, and when genuinely unknown tier on unboundedness alone
so Critical still works and the Serious/Minor line degrades to a note rather
than a wrong number.

Whichever way this goes probably wants recording as an ADR, since it changes
what ADR 0003's tiers mean in practice.

## Comments

**2026-09-16 — answered and superseded by `.scratch/redline-v1/`.**

All three points confirmed as proposed: the scope (capabilities 3–6), the single
`analyse` seam with the model as a parameter, and the recommended fee handling
(extract when stated, accept as input when not, tier on unboundedness alone when
unknown). The seam is now `.scratch/redline-v1/` ticket 03; fee handling is
ticket 06.

Still outstanding: the fee decision changes what ADR 0003's tiers mean in
practice and has not yet been recorded as an ADR.

**2026-09-16 — the fee decision is now recorded as ADR 0006.**
