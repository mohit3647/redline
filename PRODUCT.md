# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js, managed with pnpm; Supabase for auth and database, run locally through its CLI with the
schema as committed migrations; deployed on Vercel. The model is Claude Sonnet 5 through OpenRouter,
routed only to zero-data-retention endpoints. Settled 2026-09-16. A minimal Next.js app serving the landing page exists; Supabase and sign-in
do not yet. Implementation tickets are in `.scratch/redline-v1/issues/`.

## Users

A freelancer or independent contractor about to sign a client agreement for their own labour,
without a lawyer. Three conditions define the user, and all three are required:

- **Signer** — the document binds them personally or through a one-person business.
- **Negotiable counterparty** — a named client who can accept a change. A gym, a bank, or a
  terms-of-service page fails this test and is out of scope.
- **Pre-signature** — the terms can still change. Someone already in a dispute is not served by v1.

Today they mostly just sign. The alternatives they weigh are a ~$390 lawyer review, $4–99 AI
scanners, and a free general-purpose chatbot (PRD §1).

## Product Purpose

Tell the signer what they are actually agreeing to, before they sign, and give them language to
change it. This version exists to prove that the analysis can be trusted. Success is measured
against the ten acceptance criteria in PRD §4, scored on a 30-document benchmark set labelled by a
lawyer.

## Positioning

Every flag is inseparable from the verbatim source sentence it came from, so the signer can check
the work without trusting the tool (ADR 0001). A flag that cannot show its sentence is a bug and is
never displayed. On top of that, each flag carries a counter-offer written to be sent to the client
as-is. That counter-offer only works when someone can say yes to it, which is why the scope is
negotiable documents only (ADR 0002).

## Operating Context

A signed-out visitor first meets Redline on a landing page. It explains what the product does
and who it is for, shows the disclosure that analysis leaves the browser, and leads to sign-in.
Visitors cannot upload or analyse anything there. Instead they see one sample agreement analysed
by the real pipeline (PRD §3, capability 9).

A contract usually arrives by email and is read at a desk before signing. **Design desktop-first;
the phone must work fully**, since signers come back to it to recheck a flag. The signer uploads a
document, which is parsed in the browser (only the text is stored, never the file). Before upload
they are told that the analysis leaves the browser. They then read:

- a plain-English summary
- flags ranked by severity, each with its source sentence and counter-offer
- a cleared list of the clauses checked and found acceptable

They can also ask questions answered only from the document, keep their own red lines, and return
to past documents in a library. Freelancers sign repeatedly, so this is meant to become a habit
rather than a one-off panic.

## Capabilities and Constraints

- The nine capabilities in PRD §3 are the whole scope. Anything else needs an explicit decision.
- Severity is expected cost to the signer. Danger is absolute, not relative to market norms
  (ADR 0003). There are three tiers: Critical, Serious, Minor. Minor items go to the cleared list.
- Anchor clauses: uncapped indemnity and IP assignment broader than the deliverable (both Critical),
  and termination for convenience without a kill fee (Serious).
- Flag freely. A clean document shows a populated cleared list, never an empty state (ADR 0004).
- The document's own confidentiality clause is always flagged, outside the tiers (ADR 0005).
- The fee sets the line between Serious and Minor. It is extracted when stated, entered by the
  signer when not, and when unknown the tier says so rather than guessing.
- **Excluded:** payments, billing, sharing documents between users, terms of service and other
  adhesion contracts, a post-dispute mode. OCR is ruled out entirely: a citation to misread text
  is worthless.
- Terminology is fixed in `CONTEXT.md`. Use signer, counterparty, flag, source sentence,
  counter-offer, red line, cleared list, severity, consequence. "Client" means the counterparty.

## Brand Commitments

- **Name:** Redline. Do not use "redline" as a noun for a counter-offer; it collides with the
  product name.
- **Voice (ADR 0004):** flat and certain about what the text says; an explicit, stated range about
  what it would cost. Never hedge the description of the text. Never state a consequence as
  certain. Never collapse into "may potentially expose you to certain risks".
- **What the product claims:** only what the document says, in every surface (CLAUDE.md).
- **Not legal advice:** said plainly on the landing page and beside every analysis, as a statement
  of fact that does not soften the analysis.
- **No comparisons:** the landing page describes what Redline does and claims nothing about other
  tools until the free-chatbot test supports it (PRD §8, gap 3).
- **Interface requirement:** quotation and inference must be visually distinguishable. There is no
  single confidence score per flag.
- **Assets:** no logo, visual identity, or design system exists yet.

## Evidence on Hand

- `research/` holds survey statistics on freelancers: 71% have struggled to collect payment, and
  unpaid freelancers lose ~$6,000/year. It also has competitor pricing and one CFPB consumer-credit
  complaint quote (not a freelancer's).
- **Absent, and must not be invented:** first-person freelancer quotes, testimonials, customers,
  usage numbers, benchmark results, accuracy claims, and any evidence that clients accept
  AI-drafted counter-offers (PRD §8).
- The landing page's sample agreement was written for the purpose. It must be labelled as a
  sample everywhere it appears, and everything shown about it must be Redline's actual output
  (ADR 0007).
- No privacy policy or terms of service exist yet (PRD §8, gap 6).
- The three anchor clauses rest on judgement, not research findings (PRD §8, gap 1).

## Product Principles

1. **Checkable over convincing.** Every claim the signer sees points at text they can verify
   themselves.
2. **Silence is not a result.** Show the work done (the cleared list, a stated absence, a named
   failure), never an empty screen.
3. **Certain about text, honest about consequence.** Split the voice rather than softening both.
4. **Actionable before signing.** Every flag ends in language the signer can send.
5. **The signer's red lines outrank our defaults.**

## Accessibility & Inclusion

WCAG 2.2 AA. The product's job is making dense legal text readable, so long verbatim quotes must
stay legible and navigable by keyboard and screen reader. The visual distinction between quotation
and inference must not rely on color alone.
