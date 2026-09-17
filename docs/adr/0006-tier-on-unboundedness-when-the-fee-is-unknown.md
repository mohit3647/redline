# 6. Extract the fee, accept it as input, and tier on unboundedness when it is unknown

Date: 2026-09-16 · Status: Accepted

ADR 0003 and PRD §5 draw the line between Serious and Minor at the fee for the
job, but many freelance agreements do not state one: hourly work, retainers,
and rates kept in a separate schedule. Redline will **extract the fee when the
document states it**, citing its source sentence like any flag; **accept it as
input from the signer when it does not**; and, **when the fee is genuinely
unknown, tier on unboundedness alone**. Critical is unaffected, and any flag
whose Serious-or-Minor tier depends on the fee says so instead of guessing.

## Alternatives

- **Refuse to tier without a fee.** The cleanest rule. Rejected: a large share
  of real agreements would get an untiered analysis, which fails the signer
  exactly where the fee is least obvious.
- **Absolute money bands.** Simple to build and test. Rejected: it removes the
  fee from the definition, so severity stops being measured against what the
  signer is being paid, which reopens ADR 0003.

## What we are giving up

- **A definite answer on every flag.** Sometimes the Serious/Minor line is a
  note rather than a tier, and the signer does the last step themselves.
- **Simplicity in the seam.** The analysis now carries the fee's provenance
  (extracted, supplied, unknown), and the interface has to show which one was
  used.

## Consequences

- ADR 0003's tiers are relative to the fee only when a fee is known. This
  changes what they mean in practice, which is why this is an ADR rather than
  an implementation detail.
- An extracted fee is a claim about the document and goes through the same
  verbatim-substring check as a flag (ADR 0001).
- Implemented in `.scratch/redline-v1/` tickets 03 and 06.
