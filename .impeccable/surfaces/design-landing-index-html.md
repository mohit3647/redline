---
version: 1
slug: "design-landing-index-html"
primary_target: "design/landing/index.html"
related_targets: []
---

# Surface: landing page

Scope: the signed-out front door (PRD §3 capability 9, ADR 0007). Static HTML/CSS prototype at
`design/landing/`, ported into Next.js when ticket 13 is built. Mode: **Persuade**.

- **Visitor:** the PRD reader — a freelancer about to sign a client agreement their client can
  still change.
- **What they must believe:** Redline shows exactly which sentence each risk came from, ranked by
  what it could cost them, with the change to ask for.
- **One action:** "Try it on your agreement", which leads to sign-in and then upload. There is no
  upload on this page.
- **Proof:** one written sample agreement, labelled as a sample, with a stand-in analysis whose
  quotes are verbatim substrings of the sample. Ticket 14 replaces it with real, lawyer-checked
  output before the page is public.
- **Must not claim:** a verdict on whether to sign, legal advice, scanned or photographed
  documents, document types beyond freelance client agreements, prices, customers, quotes,
  accuracy figures, or comparisons with other tools.
- **Memorable moment:** the strings from ranked tags crossing to sentences in document order.

Unresolved: sign-in route; the privacy policy and terms links (ticket 15); which file formats
are accepted (ticket 02); self-hosted fonts at port time.

## Direction contract

THESIS: A flag is a numbered tag tied by string to its exact sentence. Refuses the category's
split hero with a highlighted document screenshot and a risk sidebar.

OWN-WORLD: Ultramarine field (#1d2c86); white bond contract sheet; die-cut tag stock at full
saturation (vermilion for Critical, chrome yellow for Serious, kraft for cleared, white stock for
the confidentiality exception); reinforced eyelets, string, and stencil rubber stamps. Severity is
shown by punch marks as well as colour: two holes for Critical, one for Serious, none for cleared.
Condensed industrial caps on tags; the contract set in a document text face.

STORY: The visitor sees a real-looking agreement being tagged, understands that each risk is tied
to a sentence they can read, sees what was cleared and what leaves the browser, and clicks to try
it on their own agreement.

FIRST VIEWPORT: Ultramarine field. Top left, the tag wordmark. Left five columns: the headline,
one supporting sentence, the primary button, then a scope line. Right seven columns: the white
sample sheet, labelled SAMPLE, with the full agreement, and ranked tags hanging off its right edge
whose strings cross to underlined sentences.

FORM: "Tagged", position 7 of 7 on the ordered list; seed key ed9d85c8. Signature interaction:
tags tie one at a time on a single timeline, and hovering or focusing a tag lights its sentence
(and the reverse).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
