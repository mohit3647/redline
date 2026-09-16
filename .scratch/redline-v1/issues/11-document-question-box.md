# 11 — Document question box

Status: ready-for-agent
Blocked by: 02, 03

**What to build:** the signer asks a question about their uploaded document and
gets an answer drawn only from that document — with the sentence it came from,
or a plain statement that the document does not say.

- [ ] Every answer either cites a sentence from the document or states that the document does not say (PRD criterion 4: 100%)
- [ ] Cited sentences pass the same exactness check as flags; an answer whose citation fails is not shown as cited
- [ ] Questions the document cannot answer — enforceability, what's typical, legal advice — get "the document does not say", not general knowledge
- [ ] Calls use the same model and zero-data-retention routing as 04
