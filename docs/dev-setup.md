# Dev setup

Prerequisites: Node, Docker running, and the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).
Run pnpm as `corepack pnpm` if bare `pnpm` is not on your PATH.

## Local Supabase

```sh
supabase start        # starts Postgres, auth and a local mail catcher in Docker
supabase status       # prints the API URL and anon key
supabase db reset     # re-applies everything in supabase/migrations/
supabase stop
```

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL` to the API URL from `supabase status` (usually `http://127.0.0.1:54321`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the anon key from `supabase status`

Magic-link emails do not leave your machine. Open the local mail catcher at http://127.0.0.1:54324 to
click the link.

## Schema changes

The schema lives only in `supabase/migrations/`. Create a file with `supabase migration new <name>`,
write the SQL, then run `supabase db reset` to check it applies from scratch. Do not edit tables in Studio.

## Without Supabase

With both `NEXT_PUBLIC_SUPABASE_*` variables unset the app still starts. `/` renders, and `/sign-in` and
`/app` show a "not set up" message instead of a form.

## App

```sh
corepack pnpm dev
corepack pnpm typecheck && corepack pnpm test && corepack pnpm build
```
