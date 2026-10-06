-- Лангуу: database for the multi-user version. Run in a NEW Supabase project
-- (not the family tracker's), with public sign-ups on and phone OTP login.

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null check (role in ('buyer', 'seller', 'driver', 'admin')),
  name text not null,
  phone text not null,
  address text,
  stall int,                      -- sellers only: stall number in the market
  approved boolean not null default false,  -- sellers and drivers are approved by admin
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id serial primary key,
  name text not null,
  category text not null,
  unit text not null,
  icon text
);

create table if not exists public.offers (
  id serial primary key,
  product_id int not null references public.products,
  seller_id uuid not null references public.profiles,
  price int not null check (price > 0),
  in_stock boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (product_id, seller_id)
);

create table if not exists public.orders (
  id bigserial primary key,
  buyer_id uuid not null references public.profiles,
  driver_id uuid references public.profiles,
  slot text not null,
  pay text not null,
  address text not null,
  note text,
  fee int not null default 0,
  status text not null default 'open' check (status in ('open', 'onway', 'done', 'cancel')),
  created_at timestamptz not null default now(),
  done_at timestamptz
);

create table if not exists public.order_items (
  id bigserial primary key,
  order_id bigint not null references public.orders on delete cascade,
  offer_id int references public.offers,
  product_id int not null references public.products,
  seller_id uuid not null references public.profiles,
  qty numeric not null check (qty > 0),
  price int not null,
  status text not null default 'new' check (status in ('new', 'ok', 'out')),
  picked boolean not null default false
);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.offers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create or replace function public.my_role() returns text language sql stable as
$$ select role from public.profiles where id = auth.uid() and (approved or role = 'buyer') $$;

-- Everyone signed in sees the catalogue and prices; sellers edit only their own offers.
create policy "catalogue read" on public.products for select to authenticated using (true);
create policy "offers read" on public.offers for select to authenticated using (true);
create policy "offers own" on public.offers for all to authenticated
  using (seller_id = auth.uid() and public.my_role() = 'seller')
  with check (seller_id = auth.uid() and public.my_role() = 'seller');

create policy "profile own" on public.profiles for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "profile read for orders" on public.profiles for select to authenticated using (true);

-- Buyers see and create their orders; sellers see orders that contain their items; drivers see all open ones.
create policy "orders buyer" on public.orders for all to authenticated
  using (buyer_id = auth.uid()) with check (buyer_id = auth.uid());
create policy "orders seller read" on public.orders for select to authenticated
  using (exists (select 1 from public.order_items i where i.order_id = id and i.seller_id = auth.uid()));
create policy "orders driver" on public.orders for all to authenticated
  using (public.my_role() = 'driver') with check (public.my_role() = 'driver');

create policy "items buyer" on public.order_items for all to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid()))
  with check (exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid()));
create policy "items seller" on public.order_items for all to authenticated
  using (seller_id = auth.uid()) with check (seller_id = auth.uid());
create policy "items driver" on public.order_items for all to authenticated
  using (public.my_role() = 'driver') with check (public.my_role() = 'driver');
