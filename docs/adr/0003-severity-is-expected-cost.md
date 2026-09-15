# 3. Severity is expected cost, and danger is absolute rather than relative

Date: 2026-09-14 · Status: Accepted

Severity ranks flags by **expected cost to the signer** — roughly, how likely a
clause is to be invoked multiplied by what it costs them when it is — and a
clause is **dangerous** when it can cause serious harm on its own terms, whether
or not it is standard for the work. v1's severity ladder is anchored on three
clause types: **uncapped or unlimited indemnity**, **IP assignment broader than
the deliverable**, and **termination for convenience with no kill fee**.

## Why these choices rather than the obvious ones

**Expected cost over asymmetry.** The alternative ordering — how much unilateral
power a clause hands the other side — produces a nearly opposite list. Under it,
mandatory arbitration ranks at the top; under expected cost it ranks near the
bottom, because the research found roughly 411 consumer filings a year against
826M agreements in force. Expected cost won because a freelancer's question at
signing is economic: can I absorb this if it goes wrong? A severity number that
does not answer that question is decoration.

**Absolute harm over deviation from market standard.** Uncapped indemnity is
standard in a great many client agreements and still potentially ruinous, so a
deviation test misses it completely. "Everyone's contract says this" is how such
clauses became normal, and a tool that ratifies the market's worst habits is
worse than no tool.

**The three anchors are the invisible ones, not the best-evidenced one.**
Payment terms are deliberately *not* an anchor, despite being the only hard
freelance datum in the research (71% of freelancers have struggled to collect;
~$6,000/year lost on average). A freelancer reads "net 90" and understands it
immediately. The three anchors are unbounded and read like boilerplate. Redline
should earn its keep on what the signer cannot see unaided.

## What we are giving up

- The clause types the research ranked #1 and #4 — arbitration and unilateral
  amendment — fall down the list. A sophisticated reader may call the ranking
  naive, and they will have a point that we have chosen to accept.
- Outrage as a growth mechanic. Asymmetry is what people feel betrayed by;
  arithmetic is what they can act on.
- Fewer flags withheld: absolute harm produces *more* flags per document than a
  deviation test would, which raises the cry-wolf risk directly.
