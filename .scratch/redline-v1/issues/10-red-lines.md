# 10 — Red lines

Status: ready-for-agent
Blocked by: 04

**What to build:** the signer keeps an editable list of their own red lines —
"I never assign IP I created before the engagement" — and re-running the
analysis changes what is flagged and how severely.

PRD §5's list is the default. Red lines belong to the signer, not to Redline.

- [ ] A signer can add, edit and remove red lines, which persist to their account only
- [ ] Red lines reach the analysis through the `redLines` parameter of 03's seam
- [ ] A clause that breaches a red line is flagged even when the defaults would clear it, and the flag says it was the signer's red line that triggered it
- [ ] A red line can raise a flag's tier; it never removes a Critical anchor flag
- [ ] Every flag a red line triggers still carries its source sentence
