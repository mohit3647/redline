-- Red lines: the signer's own standing objections (PRD section 5). They belong to the signer, not to Redline.
create table public.red_lines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  text text not null check (length(btrim(text)) between 1 and 500),
  position int,
  created_at timestamptz default now()
);

create index red_lines_user_id_position_idx on public.red_lines (user_id, position, created_at);

alter table public.red_lines enable row level security;

-- A signer reads, adds, edits and removes only their own rows.
create policy "red_lines_select_own" on public.red_lines
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "red_lines_insert_own" on public.red_lines
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "red_lines_update_own" on public.red_lines
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "red_lines_delete_own" on public.red_lines
  for delete to authenticated
  using (user_id = (select auth.uid()));
