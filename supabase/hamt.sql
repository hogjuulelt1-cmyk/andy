-- "Хамт" group habit app. Run once in a SEPARATE Supabase project (sign-ups must be on
-- for friends to join, and the family app's `docs` table lets every signed-in user read it).
-- SQL Editor -> New query -> paste -> Run.

create table if not exists public.profiles (
  id uuid primary key default auth.uid() references auth.users on delete cascade,
  name text not null default '',
  color text not null default '#3b4cca',
  created_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique default upper(substr(md5(random()::text), 1, 6)),
  stake text not null default '',
  created_by uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.members (
  group_id uuid not null references public.groups on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  group_id uuid references public.groups on delete set null,
  title text not null,
  why text not null default '',
  due date,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  group_id uuid references public.groups on delete set null,
  goal_id uuid references public.goals on delete set null,
  title text not null,
  cue text not null default '',
  days smallint[] not null default '{0,1,2,3,4,5,6}',
  reward text not null default '',
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.checkins (
  habit_id uuid not null references public.habits on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  day date not null,
  created_at timestamptz not null default now(),
  primary key (habit_id, day)
);

-- Group feed: weekly reports and cheers ("high five") between members.
create table if not exists public.feed (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  to_user uuid references auth.users on delete cascade,
  kind text not null check (kind in ('report', 'cheer')),
  body text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists checkins_user_day on public.checkins (user_id, day);
create index if not exists feed_group_time on public.feed (group_id, created_at desc);

-- Helpers (security definer so policies can look at members without recursion).
create or replace function public.is_member(g uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members where group_id = g and user_id = auth.uid());
$$;

create or replace function public.shares_group(u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from members a join members b on a.group_id = b.group_id
    where a.user_id = auth.uid() and b.user_id = u
  );
$$;

create or replace function public.create_group(p_name text, p_stake text default '')
returns uuid language plpgsql security definer set search_path = public as $$
declare g uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  insert into groups (name, stake, created_by) values (p_name, coalesce(p_stake, ''), auth.uid())
    returning id into g;
  insert into members (group_id, user_id) values (g, auth.uid());
  return g;
end $$;

create or replace function public.join_group(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare g uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select id into g from groups where code = upper(trim(p_code));
  if g is null then raise exception 'code not found'; end if;
  insert into members (group_id, user_id) values (g, auth.uid()) on conflict do nothing;
  return g;
end $$;

revoke execute on function public.create_group(text, text) from anon;
revoke execute on function public.join_group(text) from anon;

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.members enable row level security;
alter table public.goals enable row level security;
alter table public.habits enable row level security;
alter table public.checkins enable row level security;
alter table public.feed enable row level security;

drop policy if exists "profiles read" on public.profiles;
drop policy if exists "profiles write" on public.profiles;
create policy "profiles read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.shares_group(id));
create policy "profiles write" on public.profiles for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "groups read" on public.groups;
drop policy if exists "groups edit" on public.groups;
drop policy if exists "groups delete" on public.groups;
create policy "groups read" on public.groups for select to authenticated using (public.is_member(id));
create policy "groups edit" on public.groups for update to authenticated
  using (public.is_member(id)) with check (public.is_member(id));
create policy "groups delete" on public.groups for delete to authenticated using (created_by = auth.uid());

drop policy if exists "members read" on public.members;
drop policy if exists "members leave" on public.members;
create policy "members read" on public.members for select to authenticated using (public.is_member(group_id));
create policy "members leave" on public.members for delete to authenticated using (user_id = auth.uid());

drop policy if exists "goals read" on public.goals;
drop policy if exists "goals write" on public.goals;
create policy "goals read" on public.goals for select to authenticated
  using (user_id = auth.uid() or (group_id is not null and public.is_member(group_id)));
create policy "goals write" on public.goals for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and (group_id is null or public.is_member(group_id)));

drop policy if exists "habits read" on public.habits;
drop policy if exists "habits write" on public.habits;
create policy "habits read" on public.habits for select to authenticated
  using (user_id = auth.uid() or (group_id is not null and public.is_member(group_id)));
create policy "habits write" on public.habits for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and (group_id is null or public.is_member(group_id)));

drop policy if exists "checkins read" on public.checkins;
drop policy if exists "checkins write" on public.checkins;
create policy "checkins read" on public.checkins for select to authenticated
  using (user_id = auth.uid() or exists (
    select 1 from public.habits h
    where h.id = habit_id and h.group_id is not null and public.is_member(h.group_id)));
create policy "checkins write" on public.checkins for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (
    select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid()));

drop policy if exists "feed read" on public.feed;
drop policy if exists "feed post" on public.feed;
drop policy if exists "feed delete" on public.feed;
create policy "feed read" on public.feed for select to authenticated using (public.is_member(group_id));
create policy "feed post" on public.feed for insert to authenticated
  with check (user_id = auth.uid() and public.is_member(group_id)
    and (to_user is null or public.shares_group(to_user)));
create policy "feed delete" on public.feed for delete to authenticated using (user_id = auth.uid());
