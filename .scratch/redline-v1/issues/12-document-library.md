# 12 — Document library

Status: done-code-unverified-supabase
Blocked by: 04

**What to build:** a signed-in signer sees a list of their past documents and
reopens any one of them with its analysis.

Sharing between users is excluded on purpose (CLAUDE.md), and this ticket adds
nothing that would lead there.

- [x] The library lists only the signed-in signer's own documents
- [x] Opening an entry shows its stored text and its most recent analysis without calling the model again
- [x] No sharing, export-to-another-user or multi-user access
- [x] Deleting a document is not in the v1 capability list; raise it with the human rather than building it
