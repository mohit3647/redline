# 03 — Build the 30-document labelled benchmark set

Status: ready-for-human

PRD §4 names this as the first piece of work, before any analysis is tuned,
because all ten acceptance criteria are measured against it. Without it none of
them are testable and "the analysis can be trusted" is not falsifiable.

30 real freelance agreements, labelled independently by a contracts lawyer who
marks every instance of the clause types in PRD §5 and gives each document an
overall verdict of acceptable or not.

The labelling also settles PRD §8 gap 1, which is the sharpest admission in the
brief: two of the three anchor clauses (over-broad IP assignment, termination
without a kill fee) had no citable evidence in the research at all, and the
third (uncapped indemnity) sits at rank 8 of 8 supported only by contract-vendor
commentary. If the lawyer's labels show these three are rare or usually benign in
real agreements, ADR 0003's severity ladder needs reopening before code is
written against it.

Needs a human because it requires engaging a lawyer and sourcing real
agreements, neither of which an agent can do.
