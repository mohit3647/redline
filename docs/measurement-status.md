# Measurement status

Criteria 5 to 10 in PRD section 4 are unmeasured. They are measured against a set of 30 real freelance
agreements labelled by a contracts lawyer, and that set does not exist yet. Until it does, nothing in the
product or its documentation claims that any of them passes.

| # | Criterion | Status |
|---|---|---|
| 5 | Recall on the three anchor clauses | Unmeasured |
| 6 | Cleared-list correctness | Unmeasured |
| 7 | False-positive budget (median 2 flags or fewer) | Unmeasured. The pipeline provides `countBudgetFlags`, which leaves out the confidentiality flag, so the count is ready when the set exists |
| 8 | Recall on non-anchor dangerous clauses | Unmeasured |
| 9 | Counter-offer sendability (70% or more sendable unedited) | Unmeasured. The product shows no sendability score, badge or claim |
| 10 | Voice discipline | Unmeasured |

Criteria 1 to 4 are mechanical and covered by tests against the two fixtures.

The summary has no source sentence, so code cannot check that it is true. Code checks only that a summary
exists, and the view says "Summary unavailable" when it does not. Whether the summary states only what the
document says is a prompt rule and a matter for human review, not a guarantee.
