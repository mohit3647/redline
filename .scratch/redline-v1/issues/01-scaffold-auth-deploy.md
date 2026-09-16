# 01 — Scaffold, sign-in, and a deployed URL

Status: ready-for-agent
Blocked by: None (can start immediately)

**What to build:** a signer opens a deployed Redline URL, signs in, and lands on
an empty signed-in page. Nothing else: this ticket exists so every later slice
has an app, a database and a deploy to cut through.

Stack, settled 2026-09-16 (CLAUDE.md listed these three as open until now):

- **pnpm.** Rejected npm (looser tree) and bun (least proven against Next.js
  and Supabase tooling). pnpm's strictness makes an undeclared dependency fail
  loudly, which suits the ask-before-adding-a-dependency rule.
- **Supabase run locally through its CLI, schema as version-controlled
  migrations.** Rejected a hosted dev project: real contract text would land in
  a hosted database during testing, and schema changes would be clicks rather
  than reviewable diffs. Cost: Docker is a prerequisite for every contributor.
- Next.js, Supabase auth, Vercel — already settled in CLAUDE.md.

- [ ] Next.js app, managed with pnpm, deploys to Vercel
- [ ] Supabase runs locally via its CLI; the schema exists only as committed migrations
- [ ] A signer can sign in by email magic link and sign out
- [ ] Every credential lives in `.env.local`; nothing secret is committed (the repo is public)
- [ ] Every dependency beyond Next.js and the Supabase client is raised with the human before it is added
