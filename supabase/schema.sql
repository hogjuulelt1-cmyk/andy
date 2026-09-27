-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.

create table if not exists public.docs (
  path text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.docs enable row level security;

-- Only signed-in family members (accounts created by the owner) can read or write.
drop policy if exists "family read" on public.docs;
drop policy if exists "family write" on public.docs;
create policy "family read" on public.docs for select to authenticated using (true);
create policy "family write" on public.docs for all to authenticated using (true) with check (true);

-- Private bucket for files saved in the library.
insert into storage.buckets (id, name, public, file_size_limit)
values ('library', 'library', false, 20971520)
on conflict (id) do nothing;

drop policy if exists "family files" on storage.objects;
create policy "family files" on storage.objects for all to authenticated
  using (bucket_id = 'library') with check (bucket_id = 'library');
