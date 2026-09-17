---
version: 1
slug: "app-app-layout-tsx"
primary_target: "app/(app)/layout.tsx"
related_targets: []
---

# Surface: app shell (behind sign-in)

Brief only; nothing is built yet. It will be the Next.js authenticated layout (tickets 02,
04–12). Mode: **Operate**. It inherits the "Tagged" world from the landing page and DESIGN.md.

- **User and task:** a signed-in signer uploads a freelance client agreement, reads what it does,
  works through the ranked flags, copies counter-offers, and comes back to past documents.
  Sessions are occasional but repeated (freelancers sign often), usually at a desk; the phone
  must work fully.
- **What the frame holds:**
  - Upload, with the pre-upload disclosure and the negotiable-counterparty question in the flow,
    before the file picker. Upload is the only input; there is no paste.
  - The result: the plain-English summary first; ranked flags, each tied to its source sentence
    and carrying its counter-offer; the confidentiality flag as a separate kind of flag; the
    **cleared list**, never an all-clear or a verdict on whether to sign; the fee state
    (extracted, supplied, or unknown); and the not-legal-advice statement beside the analysis.
  - The question box: answers cite a sentence or say the document does not say.
  - Red lines: the signer's own list, editable, re-running the analysis.
  - The library: the signer's past documents, reopened without a new model call.
- **Important states:** parsing; a scanned document refused; out of scope (no negotiable
  counterparty); analysing; analysis failed (named, never an empty list); flags dropped for lack
  of a source sentence (never shown bare); a clean document shown as a populated cleared list;
  fee unknown.
- **World translation:** the document stays a white sheet, and the flags hang as tags on a rail
  beside it, strings to their sentences on wide screens and numbers inline on narrow ones. Cleared
  items hang on their own ring. Red lines are the signer's own pre-printed tags. The library is a
  key ring of documents. The question box is a blank tag the signer writes on, and the answer is
  tied to its sentence.
- **Must stay:** quotation and interpretation look visibly different, and not by colour alone;
  one keyboard path through tags and sentences; WCAG 2.2 AA; the glossary in CONTEXT.md.

Unresolved: navigation structure between the result, red lines, and library; how the rail
behaves on a long agreement with many flags (the strings will tangle); deleting documents, which
is not in scope.
