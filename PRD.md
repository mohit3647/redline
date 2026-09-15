# Redline — Product Brief

Redline reads a document someone is about to sign and tells them what they are
actually agreeing to.

This brief records decisions, not options. Where the research supports a claim
it is quoted and sourced; where nothing supports it, that is said plainly. The
vocabulary used here is defined in `CONTEXT.md`, and the reasoning behind each
decision is in `docs/adr/`.

---

## 1. Who this is for

**A freelancer or independent contractor about to sign a client agreement for
their own labour, without a lawyer.**

Three things must be true for someone to be in scope, and all three are load
bearing:

- They are the **signer** — the document binds them personally or through their
  one-person business, so the downside lands on them.
- There is a **negotiable counterparty** — a named client with the authority to
  accept a change. This is the intake test, not a preference. A freelance client
  passes it; a gym, a bank, and a software vendor's terms of service do not.
- They are **pre-signature** — the terms can still change. Someone who already
  signed and is now in a dispute is out of scope for v1.

### What they do today instead

Almost entirely: **they sign it.** The evidence for the adjacent segment is the
closest hard datum — "43% of small business owners sign contracts without any
legal review"
([source](https://kicksaaslegal.com/blogs/news/the-true-cost-of-contract-review-what-you-need-to-know)).

The alternatives they are choosing against, with real prices:

| What they could do | What it costs | Source |
|---|---|---|
| Hire a lawyer to review it | ~$390–400 average flat fee, range $300–$3,000 | [ContractsCounsel](https://www.contractscounsel.com/b/freelance-contract-review-cost) |
| Pay hourly | $150–$500/hr; $250–350/hr marketplace average | [UpCounsel](https://www.upcounsel.com/contract-review-attorney-fee) |
| Use an AI clause scanner | $4–$9 per contract (ClauseGuard, freemium) | [ClauseGuard](https://clauseguard.io/) |
| Use an AI review service | $99 flat per contract (QwickContractReview) | [press release](https://markets.financialcontent.com/pennwell.industriallaser/article/247pressrelease-2025-10-2-qwickcontractreviewcom-delivers-99-contract-reviews-in-48-hours-empowering-small-businesses-and-freelancers-nationwide) |
| Paste it into ChatGPT or Claude | Free | unexamined — see §8 |

The $390 lawyer fee against a $2,000 project is the whole reason this product
can exist. The free chatbot is the reason it might not.

---

## 2. The problem

A signer reads a document, understands the headline terms, and misses the
mechanic that actually costs them. They find out when a bill arrives.

The research found the same arc repeatedly. One signer, on a rate-escalation
clause in a personal line of credit that took them from 4.25% to 7.5% in under
four months:

> "This clause was not explained to me. and still hasn't. The clause is very
> hard to understand without some sort of explanation."
>
> — CFPB Consumer Complaint Database, Complaint ID 6147724, received
> 2022-10-31 ([source](https://www.consumerfinance.gov/data-research/consumer-complaints/))

That person had the document. They could not parse the clause. They were still
asking for an explanation years later.

**Be clear about what that quote is and is not.** It is a consumer credit
agreement, not a freelance contract. The research produced **no verbatim quote
from a freelancer** about a contract clause, because the database that yielded
the quotes above does not cover freelance service agreements and Reddit was
unreachable from the research environment (§8). What the research does have for
freelancers is survey data, not voices:

- **71%** of freelancers have struggled to collect payment at least once;
  unpaid freelancers lose **~$6,000/year**, about 13% of income
  ([Freelancers Union](https://blog.freelancersunion.org/2015/12/10/costs-nonpayment/))
- **62%** of New York freelance workers report never being paid for work
  performed ([Authors Guild](https://authorsguild.org/news/survey-finds-62-percent-of-ny-freelance-workers-have-lost-wages-due-to-nonpayment/))

The mechanism is documented and the segment is documented. They are documented
in different places, and nothing in the research joins them up.

---

## 3. What the first version does

Eight capabilities. Nothing beyond this list gets built without an explicit
decision to expand scope.

1. **Accept a document** — contract, lease, or freelance agreement — uploaded by
   the signer. The file is parsed in the browser; only the extracted text is
   stored, never the file.
2. **Disclose, before upload, that analysis leaves the browser.** Parsing is
   local; the model call is not. See §7 and ADR 0005.
3. **Produce a plain-English summary** of what the document does, in the
   signer's language rather than the drafter's.
4. **Flag dangerous clauses, ranked by severity**, each inseparable from the
   exact source sentence it came from. A flag that cannot show its source
   sentence is not displayed and is treated as a bug (ADR 0001).
5. **Show a cleared list** — the clauses Redline checked and found acceptable,
   named individually with what it found. A clean document never produces an
   empty screen (ADR 0004).
6. **Draft a counter-offer for each flagged clause** — replacement language
   written for the signer to send to the client.
7. **Answer questions about the document, only from the document.** Where the
   text does not support an answer, say the document does not say.
8. **Keep an editable list of the signer's red lines** — standing objections
   that change what gets flagged and how severely — and **a library of their
   past documents**.

One exception to the severity model, recorded here because it is a genuine
exception rather than a special case: **the document's own confidentiality
clause is flagged whenever present**, not because it is dangerous to the signer
under §5's test, but because uploading the document may breach it (ADR 0005).

---

## 4. What good looks like

The product's claim is that its analysis can be trusted. That has to be
falsifiable, so these are the tests.

**The benchmark set:** 30 real freelance agreements, labelled independently by a
contracts lawyer who marks each instance of the clause types in §5 and gives an
overall verdict of acceptable or not. Building this set is the first piece of
work, before any analysis is tuned, because every criterion below is measured
against it. Without it none of this is testable.

### Mechanical — pass or fail, no judgement

| # | Criterion | Target |
|---|---|---|
| 1 | Every quote shown with a flag is an exact substring of the stored document text | **100%.** Any failure is a bug, not a miss (ADR 0001) |
| 2 | Every quote shown in the cleared list is likewise exact | **100%** |
| 3 | No flag is displayed without a source sentence | **100%** — the fallback is to drop the flag, never to show it bare |
| 4 | Every answer in the question box either cites a sentence or states that the document does not say | **100%** |

### Measured against the labelled set

| # | Criterion | Target |
|---|---|---|
| 5 | **Recall on the three anchor clauses** (§5): every labelled instance of uncapped indemnity, over-broad IP assignment, or termination-for-convenience-without-kill-fee is flagged | **100%.** A miss here is the failure mode we deliberately chose to avoid; anything less invalidates the severity model |
| 6 | **Cleared-list correctness**: every clause characterised in the cleared list is characterised correctly | **100%.** A wrong "indemnity: capped at fees paid" actively tells the signer not to look, which is worse than silence (ADR 0004) |
| 7 | **False-positive budget** on documents the lawyer judged acceptable | Median **≤2** flags per document. Above that, the tool reads as paranoid and gets abandoned |
| 8 | **Recall on non-anchor dangerous clauses** (§5, Serious tier) | **≥90%** |

### Judged by a human, stated so it can still be scored

| # | Criterion | Target |
|---|---|---|
| 9 | **Counter-offer sendability**: a freelancer would send it to a real client without editing it | **≥70%** judged sendable unedited. This is the differentiating feature; if the language is unusable the feature is decorative |
| 10 | **Voice discipline** (ADR 0004): no flag hedges what the text says; no flag states a consequence as certain | Zero violations in a 50-flag sample. Hedged text descriptions and confident consequence claims are both failures |

Criterion 9 is the one most likely to be quietly failed, because a counter-offer
that is legally sound and socially unsendable still scores well on every other
line here.

---

## 5. My red lines — what gets flagged, how severely, and why

**Severity is expected cost to the signer**: roughly how likely a clause is to
be invoked, multiplied by what it costs them when it is. A clause is
**dangerous** when it can cause serious harm on its own terms, whether or not it
is standard for the work. Both definitions are decided and recorded in ADR 0003.

### The severity tiers

- **Critical** — the potential loss has no ceiling, or no ceiling that relates
  to the value of the work.
- **Serious** — the loss is bounded, but the bound is larger than the fee for
  the job.
- **Minor** — the loss is bounded and smaller than the fee. Minor items go to
  the cleared list with a note, not to the flag list.

### The three anchors

These three carry the top of the ladder. They were chosen because they are
**invisible and unbounded** — they read like boilerplate and their downside has
no natural limit.

**1. Uncapped or unlimited indemnity — Critical.**
The signer agrees to cover the client's losses and legal costs with no upper
limit. A single clause can exceed the contract value by orders of magnitude, and
it is *common*, which is exactly why a market-standard test would miss it. This
is the clause a freelancer is least equipped to price and least likely to read
twice.

**2. IP assignment broader than the deliverable — Critical.**
The signer assigns rights beyond what they were paid to make: pre-existing work,
tools and templates they reuse across clients, or anything created during the
engagement period regardless of relation to it. The cost is not a bill, it is
future income foreclosed, and it is unbounded in time.

**3. Termination for convenience with no kill fee — Serious.**
The client can end the agreement at any time for any reason and owes nothing
beyond work already delivered. Bounded in principle, but the real loss includes
the other work the signer turned down, which is why it clears the fee for the
job.

### Also flagged

| Clause | Tier | Why it matters |
|---|---|---|
| Liability cap set below the contract value | Serious | Caps the signer's recovery while leaving their own exposure open; asymmetric by construction |
| Non-compete or non-solicit | Serious | Forecloses named future income. The FTC estimated noncompetes cover ~18% of the US workforce, roughly 30M people, across all job levels ([FTC](https://www.ftc.gov/news-events/news/press-releases/2024/04/fact-sheet-ftcs-proposed-final-noncompete-rule)) |
| Undefined scope or unlimited revisions | Serious | Converts a fixed fee into unbounded labour — the one unbounded clause a freelancer can actually feel coming, but usually too late |
| Unilateral amendment | Serious | The client can change the terms after signing. The CFPB proposed banning these outright in consumer finance ([Venable](https://www.venable.com/insights/publications/2025/01/cfpbs-proposed-rule-targets-consumer-fin)) |
| Payment terms: net-60/90, no late interest | **Minor → cleared list with a note** | Deliberately not an anchor, despite being the only hard freelance datum in the research (71%, ~$6,000/yr). Net-90 is survivable and, crucially, *visible* — a freelancer reads it and understands it. Redline should earn its keep on what they cannot see unaided |
| Mandatory arbitration / class-action waiver | **Minor → cleared list with a note** | The research's #1 clause by evidence — 826M consumer agreements in force against ~411 consumer filings a year ([centerjd.org](https://centerjd.org/content/fact-sheet-forced-arbitration-clauses-and-class-actions-waivers-numbers)). Enormous asymmetry, near-zero probability of being invoked, so it ranks low on expected cost. This demotion is a deliberate consequence of ADR 0003 and the most likely thing a sophisticated reader will call wrong |
| The document's own confidentiality clause | Flagged, outside the tiers | Uploading the document may breach it (ADR 0005) |

**Red lines are the signer's, not ours.** The list above is the default. A
signer can declare their own standing objections — "I never assign IP I created
before the engagement" — and those change what gets flagged and at what tier.

---

## 6. The calls I made, and what they cost

Each row is a decision where both options were real. "Who is worse off" is not
rhetorical: these are people the product could have served and will not.

**1. Freelancers, not renters.** *(ADR 0002)*
Chosen against: renters, who produced nearly every verbatim pain quote in the
research. **Worse off: renters** — the best-evidenced sufferers in the entire
corpus, now unserved. Taken because a counter-offer only functions where someone
can say yes, and a renter cannot move a landlord off a standard lease. For them
the feature collapses into a summary, which LeaseGuard already sells at $19
([leaseguard.us](https://www.leaseguard.us/)).

**2. Pre-signature, not post-dispute.** *(ADR 0002)*
Chosen against: the moment the research actually documented — every sourced pain
case arrived *after* signing, when collections called. **Worse off: the person
already in a dispute**, holding a bill they think is wrong, with no tool in the
landscape serving them. Taken because pre-signature is where the outcome can
still change, and because a freelancer signs repeatedly, which makes it a habit
rather than a one-off panic.

**3. Negotiable documents only — terms of service dropped.** *(ADR 0002)*
Chosen against: the highest-volume document class in existence, and with it
mandatory arbitration, the top-ranked clause in the research. **Worse off:
anyone facing an adhesion contract** — every gym member, every app user, every
consumer signing something take-it-or-leave-it. Taken because a product whose
flagship feature is inert on a third of its inputs teaches users to distrust the
feature.

**4. Severity is expected cost, not asymmetry.** *(ADR 0003)*
Chosen against: ranking by how much unilateral power a clause hands the other
side, which would put arbitration and unilateral amendment at the top. **Worse
off: the signer who cares about power rather than money**, and the sophisticated
reader who will find the ranking naive and be partly right. Taken because a
freelancer's question at signing is economic — can I absorb this if it goes
wrong — and a severity number that does not answer it is decoration.

**5. Absolute harm, not deviation from market standard.** *(ADR 0003)*
Chosen against: flagging only what is worse than normal for the work. **Worse
off: the signer who now gets more flags**, including on clauses their whole
industry accepts. Taken because "everyone's contract says this" is precisely how
uncapped indemnity became normal, and a tool that ratifies the market's worst
habits is worse than no tool.

**6. Tolerate false positives, not false negatives.** *(ADR 0004)*
Chosen against: a quieter tool that misses things. **Worse off: the careful
reader**, who will dismiss flags that do not apply to them and may lose patience
with the product. Taken because a false negative is invisible — the signer never
learns Redline missed the indemnity clause that later cost them $40,000 — and
because ADR 0001 makes a false positive cheap to dismiss: read the quote, see it
does not apply, move on. **This trade is only valid while every flag carries its
source sentence.** If that guarantee ever weakens, this decision reverses.

**7. A cleared list, not an empty state.** *(ADR 0004)*
Chosen against: showing nothing when nothing is wrong. **Worse off: nobody
directly — the cost lands on us.** A cleared list is a promise, and it needs the
same source-sentence discipline as the flags, which is scope this adds rather
than saves. Taken because "no flags found" is indistinguishable from a failed
upload, and because it gives Minor items somewhere to live other than the alarm
list, which is what makes decision 6 survivable.

**8. Disclose that analysis leaves the browser, and flag the document's own
confidentiality clause.** *(ADR 0005)*
Chosen against: staying quiet, which is what most products do. **Worse off:
us** — zero-data-retention becomes a routing constraint rather than a
preference, and a cheaper route without it is no longer available. Taken because
a trust product that quietly ships confidential client documents to a
third-party inference provider has a contradiction at its centre.

---

## 7. What we are not building, and why

**Payments and billing.** This version exists to prove the analysis can be
trusted, and taking money does not make it more trustworthy. It also front-loads
a question the product has not earned the right to ask.

**OCR for scanned documents.** This one is not deferred, it is *ruled out*.
ADR 0001 requires every flag to quote its exact source sentence, and a citation
is worthless when the text it points at was misread. OCR would not merely add
risk, it would undermine the product's central claim while appearing to work.

**Sharing a document between users.** Multi-party access to a document that may
be under an NDA is a meaningful privacy surface, and the signer reading their own
contract does not need it.

**Terms of service and other adhesion contracts.** Dropped in decision 3. The
counter-offer has no recipient, so Redline would be selling a summary into a
market where free tools already grade known companies' terms
([ToS;DR](https://tosdr.org/)).

**A post-dispute mode.** Different verbs, different urgency, different UI. It is
the better-evidenced product and it is not this one; building both halves badly
is the failure mode.

**Anything else that looks like the obvious next step.** `CLAUDE.md` holds the
capability list and the instruction to ask before exceeding it.

---

## 8. What the research could not tell us

These are gaps, not findings. Each one is a place where this brief rests on
judgement rather than evidence, and each should be closed before the judgement
hardens.

**1. Two of the three anchor clauses have no supporting evidence in the
research at all.** This is the most important line in this document. The
research explicitly failed to source *any* citable data for IP assignment /
work-for-hire, kill fees, personal guarantees, exclusivity,
joint-and-several liability, or early termination fees as distinct categories —
they were dropped rather than guessed at. And the third anchor, uncapped
indemnity, sits at **rank 8 of 8** in the clause ranking, supported only by
industry commentary from contract-tech vendors, with no complaint-volume or
survey data behind it. **All three anchors in §5 are my judgement, not a
finding.** They may well be right. Nothing in `research/` says so.

**2. There is no first-person freelancer voice anywhere in the research.**
Reddit was unreachable — WebSearch rejected the domain and WebFetch could not
load it — so r/freelance, r/smallbusiness and r/legaladvice were never searched.
The segment this product is built for has survey statistics and no quotes. The
single cheapest, highest-value piece of remaining research is twenty freelancers
describing a contract that hurt them.

**3. Nobody checked whether a free chatbot already does this well enough.**
Three of the eight capabilities in §3 — summary, flagged clauses with quotes,
document-grounded Q&A — are things a general-purpose model does acceptably from
a file upload for free. The research flagged this and ran out of budget before
testing it. **Every willingness-to-pay number in §1 assumes people are choosing
between Redline and a lawyer. If they are actually choosing between Redline and
a free chatbot, those numbers do not transfer.** This should be tested before
the first line of application code.

**4. Willingness to pay for *this* product is inferred, not observed.** The
$4–$99 band comes from competitors' price pages, not from anyone paying us. No
freelancer has been asked what they would pay for a counter-offer they could
send.

**5. Counter-offer acceptance is completely unmeasured.** The entire product
rests on the counter-offer being the differentiator, and there is no evidence
anywhere in the research about whether clients accept AI-drafted redlines, or
how a freelancer is received when they send one. Criterion 9 in §4 tests whether
the language is *sendable*. It does not test what happens after it is sent.
