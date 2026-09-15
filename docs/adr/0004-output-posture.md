# 4. Output posture: flag freely, split the voice, show what was cleared

Date: 2026-09-14 · Status: Accepted

Three decisions that only work together. Redline **errs toward flagging** rather
than staying silent; it speaks with **total confidence about what a document
says and an explicit range about what that means**; and a clean document gets a
**cleared list** of what was checked and found acceptable, never an empty state.

## Why they are one decision

Tolerating false positives is only survivable because of the other two. A false
negative is invisible — the signer never learns Redline missed the indemnity
clause that later cost them $40,000 — while a false positive is visible every
time and compounds: eleven flags on a normal contract and the signer stops
opening the tool. What makes the trade acceptable is ADR 0001. Because every
flag carries its source sentence, a signer reads the quote, sees it does not
apply, and moves on in seconds; a false positive becomes "that one's not me"
rather than "this tool is wrong". Without the citation guarantee, this ADR would
say the opposite.

The cleared list is what stops "flag freely" from meaning "eleven alarms". Low
severity items live there with a one-line note instead of inflating the flag
count. It also fixes a real ambiguity: "no flags found" is indistinguishable
from a failed upload, so a null result has to be shown as work done —
"Indemnity: capped at fees paid. IP: assigned on payment, limited to the
deliverable." — to be believable or actionable.

The split voice keeps both honest. Redline has standing to be certain about text
and none to be certain about consequence: whether a court would enforce a clause
and what it would actually cost are genuinely unknown. So the text is stated
flatly and the consequence carries a stated range. What it must never do is let
uncertainty about consequence soften the description of the text, or collapse
into "may potentially expose you to certain risks", which tells the signer
nothing and teaches them the tool has no spine.

## Consequences

- **The cleared list is a promise, and a costlier one than it looks.** Writing
  "indemnity: capped at fees paid" when it is not actively tells the signer not
  to look. Cleared entries therefore need the same source-sentence discipline as
  flags, which is scope added by this decision, not saved.
- The UI has to distinguish quotation from inference visually, so there is no
  single confidence score per flag.
- Redline will sometimes read as paranoid to a careful reader. Accepted: a
  missed uncapped indemnity is not survivable, and looking cautious is.
