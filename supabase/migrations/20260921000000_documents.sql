-- Documents: the extracted text of an uploaded agreement. The file itself is never stored (ADR 0002 / CLAUDE.md).
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  title text not null,
  text text not null,
  created_at timestamptz default now()
);

create index documents_user_id_created_at_idx on public.documents (user_id, created_at desc);

alter table public.documents enable row level security;

-- A signer reads and adds only their own rows. There is deliberately no update or
-- delete policy: deleting documents is out of scope (ticket 12).
create policy "documents_select_own" on public.documents
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "documents_insert_own" on public.documents
  for insert to authenticated
  with check (user_id = (select auth.uid()));
