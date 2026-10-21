-- Analyses: the result the analysis seam returned for a stored document, kept so the library can
-- reopen it without calling the model again. Re-runs append a row; the most recent created_at wins.
create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  result jsonb not null,
  contract_value jsonb,
  created_at timestamptz default now()
);

create index analyses_document_id_created_at_idx on public.analyses (document_id, created_at desc);

alter table public.analyses enable row level security;

-- A signer reads and adds only their own rows, and only against a document that is theirs.
-- There is deliberately no update or delete policy: deleting is not in the v1 capability list.
create policy "analyses_select_own" on public.analyses
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "analyses_insert_own" on public.analyses
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.documents d
      where d.id = document_id and d.user_id = (select auth.uid())
    )
  );
