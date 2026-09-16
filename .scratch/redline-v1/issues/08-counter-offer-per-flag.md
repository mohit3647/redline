# 08 — Counter-offer for each flag

Status: ready-for-agent
Blocked by: 04

**What to build:** every flag carries replacement language the signer can send
to the client as written. This is the differentiator the whole segment decision
rests on (ADR 0002).

A counter-offer that is legally sound but socially unsendable passes every
mechanical check and still fails the product. PRD §4 names this as the
criterion most likely to be quietly failed.

- [ ] Every displayed flag has a counter-offer shown beside the source sentence it replaces
- [ ] The signer can copy a counter-offer in one action
- [ ] Where a clause is merely unusual, the counter-offer may say so ("most clients accept a cap at fees paid") — unusual belongs here, never as a reason to flag (`CONTEXT.md`)
- [ ] The counter-offer claims nothing about the document that its text does not support
- [ ] Sendability (PRD criterion 9, ≥70% sendable unedited) is recorded as unmeasured until the labelled set exists — not claimed as passing
