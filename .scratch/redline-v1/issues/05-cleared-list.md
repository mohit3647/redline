# 05 — Cleared list

Status: ready-for-agent
Blocked by: 04

**What to build:** alongside the flags, the signer sees the clauses Redline
checked and found acceptable, each named with what was found — "Indemnity:
capped at fees paid." A clean document shows this list, never an empty screen.

ADR 0004 calls the cleared list a promise costlier than it looks: a wrong
cleared entry tells the signer not to look, which is worse than silence.

- [ ] Each cleared entry names the clause type, what Redline found, and the source sentence it found it in
- [ ] Cleared entries pass through the same exactness check as flags (PRD criterion 2)
- [ ] Mandatory arbitration and net-60/90 payment terms land here with a note, not in the flag list (PRD §5)
- [ ] A document with no flags shows a populated cleared list, visibly different from a failed or empty analysis
- [ ] An anchor clause type that does not appear in the document is stated as absent, not silently omitted
