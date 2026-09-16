# 12 — Document library

Status: ready-for-agent
Blocked by: 04

**What to build:** a signed-in signer sees a list of their past documents and
reopens any one of them with its analysis.

Sharing between users is excluded on purpose (CLAUDE.md), and this ticket adds
nothing that would lead there.

- [ ] The library lists only the signed-in signer's own documents
- [ ] Opening an entry shows its stored text and its most recent analysis without calling the model again
- [ ] No sharing, export-to-another-user or multi-user access
- [ ] Deleting a document is not in the v1 capability list; raise it with the human rather than building it
