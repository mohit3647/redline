# 10 — Red lines

Status: done-code-unverified-supabase
Blocked by: 04

**What to build:** the signer keeps an editable list of their own red lines —
"I never assign IP I created before the engagement" — and re-running the
analysis changes what is flagged and how severely.

PRD §5's list is the default. Red lines belong to the signer, not to Redline.

- [x] A signer can add, edit and remove red lines, which persist to their account only
- [x] Red lines reach the analysis through the `redLines` parameter of 03's seam
- [x] A clause that breaches a red line is flagged even when the defaults would clear it, and the flag says it was the signer's red line that triggered it
- [x] A red line can raise a flag's tier; it never removes a Critical anchor flag
- [x] Every flag a red line triggers still carries its source sentence
