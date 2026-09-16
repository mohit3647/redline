# 09 — Flag the document's own confidentiality clause

Status: ready-for-agent
Blocked by: 04

**What to build:** when the uploaded document restricts disclosing its
contents, Redline flags that clause and tells the signer that uploading it for
analysis may itself breach the clause.

This is the sharper half of ADR 0005, and a deliberate exception to the
severity model: the clause is flagged because of what uploading implies, not
because it is dangerous under ADR 0003. It must look like an exception, not be
smuggled into a tier.

- [ ] A confidentiality or non-disclosure clause is flagged whenever it is present, with its source sentence
- [ ] The flag sits outside the severity tiers and is labelled as a different kind of flag
- [ ] It states plainly that the text was sent to a third-party model provider to produce this analysis
- [ ] It does not count toward the false-positive budget in PRD criterion 7
