# 7. The landing page is a front door, and its proof is a written sample

Date: 2026-09-16 · Status: Accepted

Redline gets a landing page, the ninth v1 capability. It is a **front door**:
it tells a signed-out visitor what Redline does and who it is for, shows the
disclosure that analysis leaves the browser (ADR 0005), states that Redline is
not legal advice, and leads to sign-in. Its proof is **one sample agreement,
written for the purpose and labelled as a sample**, shown with Redline's real
output.

The two halves are one decision. A front door with no upload has nothing to
show except a sample, and a written sample is only honest if what is shown
about it is real.

## Alternatives

- **A waitlist page before the app exists.** Would have tested demand (PRD §8
  gaps 3 and 4). Rejected: it adds stored personal data and a consent surface
  to a product whose premise is trust.
- **Analysis for signed-out visitors.** The strongest demo. Rejected: it sends
  confidential documents to the model from people who skipped the intake flow,
  and it needs abuse limits on unauthenticated model calls.
- **A real agreement, published with consent.** More convincing. Rejected:
  real client agreements are usually confidential, and removing identifying
  details must not change any quoted sentence, or the citations stop matching.

## What we are giving up

- **The visitor who wants to try Redline on their own contract** before
  creating an account.
- **Demand evidence.** The landing page answers none of the open questions
  about whether freelancers want this or would pay.
- **The sceptical visitor's trust in the sample.** A staged document built to
  contain the three anchors shows how the mechanism works, not that real
  contracts look like this.
- **A comparative pitch.** The page describes Redline and claims nothing about
  other tools until the free-chatbot test supports a claim.

## Consequences

- The sample's analysis is captured from the real pipeline and never edited by
  hand. The benchmark lawyer labels the sample, and it ships only when the real
  output matches those labels; the sample is never rewritten to suit the
  output. This blocks the sample on the lawyer-labelled set.
- "Sample" must be visible wherever the sample appears. Presenting it as a real
  client's contract would be invented evidence.
- A privacy policy and terms of service must exist before the page is public.
- Implemented in `.scratch/redline-v1/` tickets 13, 14 and 15.
