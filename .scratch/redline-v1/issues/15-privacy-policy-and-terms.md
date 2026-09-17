# 15 — Privacy policy and terms of service

Status: ready-for-human
Blocked by: None (can start immediately)

**What to build:** a privacy policy and terms of service, written by a human
(likely with legal help) and published so the landing page can link them.
This blocks making Redline public. It does not block the build.

Decided 2026-09-16 (PRD §8 gap 6). Sign-in stores email addresses and the app
stores contract text, and nothing yet tells a visitor what happens to either.
An agent should not author legal text.

- [ ] The privacy policy states what is stored (email address, extracted document text, red lines), that the uploaded file is not stored, and that the text is sent to a third-party model provider through OpenRouter on zero-data-retention routes (ADR 0005)
- [ ] It makes no privacy claim the architecture does not support
- [ ] The terms state that Redline is not legal advice, consistent with the in-product statement (PRD §3)
- [ ] Both are published and linked from the landing page (ticket 13) before the site is public
