# 04 — Real flags with source sentences

Status: ready-for-agent
Blocked by: 02, 03

**What to build:** a signer uploads a real freelance agreement and sees its
dangerous clauses as flags ranked by severity, each shown beside its verbatim
source sentence. This is the first real model call.

Model, settled 2026-09-16: **Claude Sonnet 5 through OpenRouter.** Rejected
Opus 5 (a per-document cost that may not survive PRD §1's $4–9 competitor band)
and a Haiku-class model (lower recall on the anchors, where PRD criterion 5
demands 100%). Opus 5 should be benchmarked against it once the labelled set in
`.scratch/pre-build-validation/` issue 03 exists. Model choice cannot corrupt a
quote — 03's seam makes a weaker model yield fewer flags, never wrong ones.

Tiering here uses the degraded path settled for an unknown fee: tier on
unboundedness alone. Critical works fully. Serious and Minor are not split yet.
Ticket 06 adds the fee.

- [ ] Analysis runs through 03's seam, with Claude Sonnet 5 via OpenRouter as the model (confirm the exact model id)
- [ ] Every request routes only to zero-data-retention endpoints, configured per OpenRouter's current documentation, and a test asserts that configuration is present on every request (ADR 0005: a hard constraint, not a preference)
- [ ] The OpenRouter key lives in `.env.local` and is used only on the server
- [ ] The three anchors are detected: uncapped indemnity and over-broad IP assignment as Critical; termination for convenience without a kill fee as Serious (ADR 0003)
- [ ] The rest of PRD §5's "also flagged" table is detected
- [ ] Flags render in severity order, each showing its source sentence, visibly distinct from Redline's own interpretation (ADR 0004)
- [ ] Voice: the text is described flatly and the consequence carries a stated range; no hedged descriptions of the text, no certain claims about consequence (PRD criterion 10)
- [ ] A model response that yields no valid flags produces an explicit failure state, never a silent empty list
