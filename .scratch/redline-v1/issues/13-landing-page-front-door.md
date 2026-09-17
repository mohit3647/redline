# 13 — Landing page: the front door

Status: ready-for-agent
Blocked by: 01

**What to build:** a signed-out visitor arrives at Redline's root URL and
learns what it does and who it is for, reads the disclosure that analysis
leaves the browser, and signs in. A signed-in signer who visits the same URL
goes to the app.

Decided 2026-09-16 (PRD §3 capability 9, §6 decision 9): a front door, not a
waitlist and not a live demo (ADR 0007). Nothing is uploaded or analysed here.

- [ ] The page names the user precisely: a freelancer, before signing, with a client who can accept changes. It does not advertise renters, terms of service, or signed documents in dispute (ADR 0002)
- [ ] It states that the document's text is sent to a third-party model provider for analysis, and makes no privacy claim beyond that. "Parsed in your browser" must not be presented as meaning the text stays there (ADR 0005)
- [ ] It makes no claim the evidence cannot support: no testimonials, customers, usage numbers, accuracy figures or benchmark results (PRODUCT.md, Evidence on Hand)
- [ ] It describes what Redline does and makes no comparison with other tools, including free chatbots, until pre-build validation issue 01 supports one
- [ ] It states plainly that Redline is not legal advice
- [ ] It links the privacy policy and terms from ticket 15 once they exist; the page is not made public without them
- [ ] The only action is sign-in; there is no email capture, waitlist, pricing or payment
- [ ] Copy uses the glossary in `CONTEXT.md` and the split voice from ADR 0004
- [ ] Design is desktop-first, fully usable on a phone, and meets WCAG 2.2 AA
- [ ] Any analytics or tracking is raised with the human before being added; it is a new dependency and a new place visitor data goes
