# 01 — Test whether a free chatbot already does this well enough

Status: ready-for-agent

PRD §8 gap 3, which states this "should be tested before the first line of
application code". It is the largest unexamined threat to the product and the
research ran out of budget before reaching it.

Three of the eight v1 capabilities — plain-English summary, flagged clauses with
quotes, document-grounded Q&A — are things a general-purpose model does
acceptably from a file upload, free. If freelancers are choosing between Redline
and a free chatbot rather than between Redline and a $390 lawyer, every
willingness-to-pay figure in PRD §1 stops transferring.

The test: take 5 real freelance agreements, upload each to a general chatbot
with a naive prompt, and score the output against PRD §4's criteria 1, 5 and 9 —
citation exactness, recall on the three anchor clauses, and counter-offer
sendability. Criterion 1 is where a general chatbot should fail, because nothing
forces it to quote verbatim; if it passes anyway, that is the finding.
