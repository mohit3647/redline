# 1. Every flag cites its source

Date: 2026-09-10 · Status: Accepted

## Decision

Every risk flag Redline produces carries the exact sentence from the uploaded document it came from, shown to the reader alongside the flag. A flag whose source sentence cannot be shown is a bug, not a formatting preference: it does not ship unquoted, degrade gracefully, or render with a placeholder.

## Alternatives

- **Let the model describe each risk in its own words, quoting nothing.** Simplest to build, and it reads fluently. Rejected: the reader cannot tell a real clause from a plausible-sounding one, so a wrong flag looks exactly like a right one.
- **Cite the clause or section number instead of the sentence.** Cheaper to extract. Rejected: numbering is unreliable across file formats, and it still leaves the reader hunting.
- **Quote when the model is confident, describe when it is not.** Rejected: the flags carrying least confidence are the ones a reader most needs to check.
- **Highlight the span in a rendered view of the document.** Same guarantee, more build cost. Deferred rather than rejected — the sentence is the guarantee, the highlight is presentation.

## Why

The reader can check our work without trusting us. For each flag they can read the sentence and see whether it says what we claim, find it in their own copy to confirm we did not invent it, carry the quote to a lawyer or landlord or client without re-reading the whole document, and judge a counter-offer against the exact language it replaces.

This is where existing tools fail. Reviewers say Robin AI "misunderstands phrasing of legal theory" and "misses subtle issues"; Spellbook "glitches and is prone to making mistakes" (`research/summary.md`). Quoting does not make the model more accurate. It makes the model's mistakes visible to a non-lawyer, which is the thing being sold.

## Consequences

- Any analysis that cannot point at a verbatim span is not an available design. Risks inferred from what a document omits, or spread across scattered clauses, must be reshaped or dropped.
- Parsing must preserve source text well enough to match byte-for-byte. That constrains the browser-side parser and rules out anything lossy.
- Verification becomes mechanical and belongs in tests: every quote must be an exact substring of the stored text, so a failed match is a failing test rather than a judgement call.
- When the model returns a flag without a usable quote, the system drops it or fails loudly. There is no silent path that shows the flag anyway.
- OCR stays out while this holds — a citation is worthless when the text it points at was misread. CLAUDE.md records that exclusion; this ADR is the reason for it.
