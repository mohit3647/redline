# 03 — The `analyse` seam and the exactness harness

Status: ready-for-agent
Blocked by: None (can start immediately)

**What to build:** the one function every analysis goes through, and the tests
that make ADR 0001 mechanical — before any real model is called. Runs in
parallel with 01 and 02.

The seam, as proposed at the checkpoint in `.scratch/redline-v1-analysis/`
issue 01 and confirmed 2026-09-16:

    analyse(documentText, redLines, model, contractValue?) → Analysis
    Analysis = { summary, fee, flags[], cleared[] }
    flag     = { severity, sourceSentence, text claim, consequence range, counterOffer }
    fee      = extracted (with its source sentence) | supplied | unknown

Its contract: nothing leaves `analyse` whose quoted sentence is not a verbatim
substring of `documentText`. The check is enforced inside, before return. The
model is a parameter, so the same function serves fake-model tests here and
real evaluation runs later.

The whole type is defined now — including `fee` and `counterOffer` — so tickets
04–10 fill in fields rather than revising the return type.

- [ ] `analyse` exists with the signature and return shape above
- [ ] A fake model returning a flag whose quote is not in the document: the flag is dropped, never returned bare (PRD §4 criteria 1, 3)
- [ ] The same guarantee holds for cleared-list entries (criterion 2) and for an extracted fee's source sentence
- [ ] A dropped flag is reported loudly (logged or surfaced to tests), never silently swallowed
- [ ] A near-miss quote — changed whitespace, punctuation or case — counts as a failure, not a match
- [ ] These tests run offline and deterministically with no network access
