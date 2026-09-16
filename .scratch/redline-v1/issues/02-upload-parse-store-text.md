# 02 — Upload, parse in the browser, store only the text

Status: ready-for-agent
Blocked by: 01

**What to build:** a signed-in signer is told before upload that the analysis
will leave the browser, confirms the document has a negotiable counterparty,
picks a file, and sees the text Redline extracted from it. Only the text is
stored; the file never leaves the browser.

This is the intake half of ADR 0005 and the intake test from ADR 0002. The
disclosure has to come *before* upload to mean anything, which is why it lives
here and not in settings.

- [ ] Before the file picker is usable, the signer sees plainly that the document's text will be sent to a third-party model provider for analysis
- [ ] The signer confirms there is a counterparty who can accept changes; a document that fails this is refused as out of scope, not analysed in a degraded form (ADR 0002)
- [ ] The file is parsed in the browser; only extracted text is sent to and stored in Supabase — never the file
- [ ] The extracted text renders back to the signer exactly as stored
- [ ] The parser preserves text well enough for byte-exact substring matching (ADR 0001); anything lossy is ruled out. The parser choice is raised with the human before the dependency is added
- [ ] A scanned or image-only document that yields no usable text is refused with a clear message. There is no OCR fallback (CLAUDE.md)
- [ ] Row-level security: a signer can read only their own documents' text
