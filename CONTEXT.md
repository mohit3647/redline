# Redline

Redline reads a document someone is about to sign and tells them what they are
actually agreeing to. This file is the glossary: the words this project uses
precisely, and the ones it refuses to use.

## The reader and the moment

**Signer**:
The person Redline is for: someone reading a document they are being asked to
sign, on their own behalf, without a lawyer.
_Avoid_: User, customer, client (in this project "client" means the signer's
counterparty, which is the opposite of what it sounds like)

**Counterparty**:
The other side of the document — the party who drafted it and who can accept or
refuse a change to it.
_Avoid_: Client, the other party, vendor

**Negotiable counterparty**:
A counterparty with the authority and willingness to say yes to a change. This
is the test that decides whether a document belongs in Redline at all: a
freelance client is one, a gym is not.

**Pre-signature**:
The moment Redline serves — before the signer has signed, while the terms can
still change. Redline is not a tool for understanding a document you already
signed.
_Avoid_: Review time, upfront

## What Redline produces

**Flag**:
One risk Redline raises about one clause, inseparable from the source sentence
it came from. A flag that cannot show its source sentence does not exist.
_Avoid_: Issue, warning, finding, alert

**Source sentence**:
The exact, verbatim sentence from the uploaded document that a flag came from,
shown to the signer alongside the flag.
_Avoid_: Citation, reference, excerpt, snippet

**Counter-offer**:
Replacement language Redline drafts for a flagged clause, written for the signer
to send to the counterparty.
_Avoid_: Suggestion, redline (as a noun — it collides with the product name),
rewrite, fix

**Red line**:
A standing objection the signer has declared in advance — a term they will not
accept in any document. Red lines are the signer's own, editable, and they
change what Redline flags and how severely.
_Avoid_: Preference, rule, setting, filter

**Plain-English summary**:
What the document does, in the signer's language rather than the drafter's.

**Document question**:
A question the signer asks about their own uploaded document, answered only from
that document's text.
_Avoid_: Chat, query, prompt

## Judging a clause

**Severity**:
A flag's rank, measured as expected cost to the signer: roughly how likely the
clause is to be invoked, multiplied by how much it costs them when it is.
_Avoid_: Risk score, priority, criticality

**Dangerous**:
A clause that can cause the signer serious harm on its own terms, whether or not
it is common. Danger is what Redline flags.

**Unusual**:
A clause that deviates from what is typical for this kind of work. Unusual is
not the same as dangerous and never triggers a flag on its own — it belongs in
the counter-offer, where "most clients accept a cap at fees paid" is a stronger
ask than "this is dangerous."
_Avoid_: Non-standard, off-market, aggressive

## Presenting the analysis

**Cleared list**:
The clauses Redline checked and found acceptable, named individually with what
it found. This is what a clean document looks like — never an empty state,
because silence cannot be told apart from failure.
_Avoid_: Green list, all-clear, passed, no issues found

**Consequence**:
What a clause would cost the signer if it were invoked — distinct from what the
clause says. Redline is certain about text and uncertain about consequence, and
says so differently.
_Avoid_: Impact, implication, exposure

