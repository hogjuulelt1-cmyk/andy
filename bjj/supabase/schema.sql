-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run: it only adds what is missing.

create table if not exists public.docs (
  path text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Who wrote the row. Personal docs (bjj/u/<uid>/…) are only readable by their owner;
-- club docs (clubs/…, club/…) are shared by every signed-in member.
alter table public.docs add column if not exists owner uuid default auth.uid();

alter table public.docs enable row level security;

drop policy if exists "family read" on public.docs;
drop policy if exists "family write" on public.docs;
drop policy if exists "docs read" on public.docs;
drop policy if exists "docs write" on public.docs;

create policy "docs read" on public.docs for select to authenticated
  using (path not like 'bjj/u/%' or owner = auth.uid());
create policy "docs write" on public.docs for all to authenticated
  using (path not like 'bjj/u/%' or owner = auth.uid())
  with check (path not like 'bjj/u/%' or owner = auth.uid());

-- Private bucket for files saved in the library (used by the diary app on the same project).
insert into storage.buckets (id, name, public, file_size_limit)
values ('library', 'library', false, 20971520)
on conflict (id) do nothing;

drop policy if exists "family files" on storage.objects;
create policy "family files" on storage.objects for all to authenticated
  using (bucket_id = 'library') with check (bucket_id = 'library');
