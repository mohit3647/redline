# 14 — Landing page: sample analysis

Status: ready-for-agent
Blocked by: 13, 04, 05, 06, 07, 08, 09; `.scratch/pre-build-validation/` issue 03 (the benchmark lawyer)

**What to build:** on the landing page, a visitor sees one sample freelance
agreement analysed the way a signer would see their own: the plain-English
summary, flags ranked by severity beside their source sentences, a
counter-offer for each flag, and the cleared list.

Decided 2026-09-16 (ADR 0007): the agreement is **written for the
purpose** and labelled as a sample. It is not a real client's contract. What
is shown about it must be Redline's actual output, captured from the real
pipeline. Hand-written flags would be invented evidence.

- [ ] A sample agreement is written containing all three anchor clauses, at least one clause that should be cleared, a confidentiality clause, and a stated fee so the Serious and Minor tiers are real (ticket 06). The human reviews it before it is used
- [ ] The benchmark lawyer labels the sample the same way as the benchmark set, and those labels are its expected flags and cleared entries
- [ ] The sample is shown only when the real output matches those labels. If it does not, the analysis is fixed; the sample is never rewritten to suit the output
- [ ] The analysis shown is produced by running that agreement through the real `analyse` pipeline and stored as a fixed snapshot, not edited by hand afterwards
- [ ] Every quoted sentence in the snapshot passes the same exactness check as live flags, run against the sample agreement's text in a test
- [ ] "Sample" is visible next to the analysis, not only in small print
- [ ] The visitor can read the full sample agreement, so the quotes can be checked against it
- [ ] Because the snapshot is fixed, it is re-captured whenever the prompt or model changes, and a test fails if the snapshot no longer matches the current output shape
- [ ] The sample's confidentiality-clause flag (ticket 09) is shown, since it demonstrates the disclosure in action
