-- BarcodeGen database schema for Supabase (Postgres).
-- Run once: Supabase dashboard -> SQL Editor -> New query -> paste this file -> Run.
-- Safe to re-run: everything uses IF NOT EXISTS / CREATE OR REPLACE.
--
-- The app talks to these tables only from the server, with the service_role key.
-- Row Level Security is enabled with no policies, so the public "anon" key cannot
-- read or write anything.

-- gen_random_uuid() is built into Postgres 13+ (Supabase runs 15+).

-- Users -----------------------------------------------------------------------
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  password_hash text not null,
  name          text not null,
  role          text not null default 'user' check (role in ('user', 'admin')),
  created_at    timestamptz not null default now()
);
create unique index if not exists users_email_lower_key on public.users (lower(email));

-- Credit balances (one row per user) ------------------------------------------
create table if not exists public.balances (
  user_id uuid primary key references public.users (id) on delete cascade,
  amount  integer not null default 0 check (amount >= 0)
);

-- Credit transactions -----------------------------------------------------------
create table if not exists public.transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users (id) on delete cascade,
  type          text not null check (type in ('credit', 'debit')),
  amount        integer not null,
  balance_after integer not null,
  reference     text not null,
  created_at    timestamptz not null default now()
);
create index if not exists transactions_user_created_idx
  on public.transactions (user_id, created_at desc);

-- Generation history ------------------------------------------------------------
create table if not exists public.generations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.users (id) on delete set null,
  studio     text not null,
  format     text not null,
  tokens     integer not null,
  ip         text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists generations_user_created_idx
  on public.generations (user_id, created_at desc);

-- Lock the tables down: no access for anon/authenticated roles.
alter table public.users        enable row level security;
alter table public.balances     enable row level security;
alter table public.transactions enable row level security;
alter table public.generations  enable row level security;
revoke all on public.users, public.balances, public.transactions, public.generations
  from anon, authenticated;

-- The server connects as service_role. Grant it access explicitly: projects that
-- do not auto-expose new tables would otherwise fail with
-- "42501 permission denied for table users".
grant usage on schema public to service_role;
grant select, insert, update, delete
  on public.users, public.balances, public.transactions, public.generations
  to service_role;

-- create_user: user + welcome balance + welcome transaction in one transaction.
-- Raises unique_violation (23505) if the email is already registered.
create or replace function public.create_user(
  p_email         text,
  p_password_hash text,
  p_name          text,
  p_role          text,
  p_welcome       integer
) returns public.users
language plpgsql
set search_path = public
as $$
declare
  u public.users;
begin
  insert into public.users (email, password_hash, name, role)
  values (p_email, p_password_hash, p_name, p_role)
  returning * into u;

  insert into public.balances (user_id, amount) values (u.id, p_welcome);

  if p_welcome > 0 then
    insert into public.transactions (user_id, type, amount, balance_after, reference)
    values (u.id, 'credit', p_welcome, p_welcome, 'welcome');
  end if;

  return u;
end;
$$;

-- adjust_balance: atomic credit/debit. Locks the balance row, refuses to go
-- below zero, and records the transaction.
create or replace function public.adjust_balance(
  p_user_id   uuid,
  p_delta     integer,
  p_type      text,
  p_reference text
) returns table (ok boolean, balance integer)
language plpgsql
set search_path = public
as $$
declare
  cur integer;
  nxt integer;
begin
  select b.amount into cur
  from public.balances b
  where b.user_id = p_user_id
  for update;

  if not found then
    insert into public.balances (user_id, amount) values (p_user_id, 0)
    on conflict (user_id) do nothing;
    select b.amount into cur from public.balances b where b.user_id = p_user_id for update;
  end if;

  nxt := cur + p_delta;
  if nxt < 0 then
    return query select false, cur;
    return;
  end if;

  update public.balances set amount = nxt where user_id = p_user_id;

  insert into public.transactions (user_id, type, amount, balance_after, reference)
  values (p_user_id, p_type, abs(p_delta), nxt, p_reference);

  return query select true, nxt;
end;
$$;

revoke all on function public.create_user(text, text, text, text, integer) from public, anon, authenticated;
revoke all on function public.adjust_balance(uuid, integer, text, text) from public, anon, authenticated;
grant execute on function public.create_user(text, text, text, text, integer) to service_role;
grant execute on function public.adjust_balance(uuid, integer, text, text) to service_role;
