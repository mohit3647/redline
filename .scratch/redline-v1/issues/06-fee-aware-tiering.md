# 06 — Fee-aware tiering

Status: done
Blocked by: 04, 05

**What to build:** Redline finds the fee for the job and uses it to split
Serious from Minor. When the document does not state it, the signer can supply
it. When nobody knows it, the split degrades to a note instead of a guessed
number.

Settled 2026-09-16: **extract when stated, accept as input when not, degrade
when unknown.** Rejected: refusing to tier without a fee (too many real
agreements are hourly or reference a separate rate card) and absolute money
bands (they drop the fee from ADR 0003's definition). What this costs: the
Serious/Minor line is sometimes a note rather than an answer, and ADR 0003's
tiers now mean something slightly different in practice. Recorded in ADR 0006.

- [x] When the document states a fee, it is extracted and shown with its source sentence, under the same exactness check
- [x] When it does not, the signer can enter a contract value and the analysis re-tiers
- [x] When the fee is unknown, Critical tiering is unchanged, and any flag whose Serious-or-Minor tier depends on the fee says so explicitly
- [x] The signer can always see which of the three states — extracted, supplied, unknown — the tiering used
- [x] Minor items move to the cleared list with a note (PRD §5)
