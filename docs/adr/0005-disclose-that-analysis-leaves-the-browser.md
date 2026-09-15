# 5. Disclose that analysis leaves the browser, and flag the document's own confidentiality clause

Date: 2026-09-14 · Status: Accepted

Using Redline may breach the very document it is reading. Freelance agreements
and client NDAs routinely prohibit disclosing their contents to third parties,
and `CLAUDE.md` settles that the model is called through OpenRouter — so the
text leaves the browser and goes on to whichever provider OpenRouter routes to.
Redline will **disclose this plainly in-product**, pin a **zero-data-retention
path** as a claim it can defend, and **flag the confidentiality clause in the
document being analysed**, telling the signer what uploading it implies.

## Why this was easy to miss

"The uploaded file is parsed in the browser, only text is stored" reads like a
privacy guarantee and is not one. The parsing is local; the analysis is not.
That gap is invisible in the architecture as written down, which is exactly why
it is recorded here.

## Why disclose rather than stay quiet

The product's entire premise is trustworthiness. A trust product that quietly
ships confidential client documents to a third-party inference provider has a
contradiction at its centre, and it is the kind that surfaces publicly rather
than fading. Processing locally would resolve it and remove the product.

Flagging the document's own confidentiality clause is the sharper half of the
decision: it is the most credible demonstration of Redline's thesis available —
the tool reads a clause, understands it applies to the act of reading it, and
says so.

## Consequences

- Zero-data-retention becomes a constraint on provider routing, not a
  preference. A cheaper route without it is not an available option.
- Confidentiality clauses need detection even though they are rarely
  *dangerous* under ADR 0003's expected-cost test — they are flagged for a
  different reason than harm to the signer, which is a genuine exception to the
  severity model and should be treated as one rather than smuggled in.
- The disclosure has to appear before upload to mean anything, which puts it in
  the intake flow rather than in settings or a footer.
