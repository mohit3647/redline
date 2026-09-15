# 2. v1 serves freelancers, pre-signature, on negotiable documents only

Date: 2026-09-14 · Status: Accepted

The research (`research/summary.md`) surfaced six candidate segments and put them
in direct conflict: the segment with the best-evidenced pain (renters) was not
the segment with any evidence of willingness to pay (freelancers), and the
moment with the best-evidenced pain (after signing, when collections calls) was
not the moment where the product can change an outcome (before signing). v1
picks **freelancers**, **pre-signature**, and **documents with a negotiable
counterparty** — which means terms of service are dropped from the four document
types `CLAUDE.md` originally promised.

All three choices follow from one mechanic. ADR 0001 makes the drafted
counter-offer Redline's differentiator, and a counter-offer only does anything
when there is someone who can say yes to it. A freelancer has a named client who
can accept a redline. A renter usually cannot move a landlord off a standard
lease, and a gym member never can — for them the counter-offer collapses into a
summary, which LeaseGuard already sells at $19.

## What we are giving up

- **Renters**, who produced nearly every verbatim pain quote in the research.
  This is the most uncomfortable part of the decision and should not be
  presented as an oversight.
- **The better-evidenced moment.** Every sourced pain case in the research
  arrived *after* signing, during a dispute. v1 deliberately serves the moment
  with weaker evidence, because pre-signature is where the outcome is still
  changeable and because a freelancer signs repeatedly, which makes it a habit
  rather than a one-off panic.
- **Terms of service** — the highest-volume document class in existence — and
  with it **mandatory arbitration**, the top-ranked clause type in the research
  (60M+ workers, 826M+ agreements in force). Arbitration lives almost entirely
  in adhesion contracts, where nothing is negotiable.

## Consequences

- "Does this document have a negotiable counterparty?" becomes an intake
  question, not an afterthought. Documents that fail it are out of scope rather
  than degraded.
- The clause severity model must be built for freelance agreements
  specifically. The research's clause ranking was drawn from consumer and
  employment data and does not transfer.
- Reopening any of the three reopens all three: they are one decision wearing
  three hats.
