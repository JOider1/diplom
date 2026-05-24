-- ════════════════════════════════════════════════════════════════════
-- Digital Shift Journal · Комбікормовий завод
-- Schema migration #1 — Core tables, triggers, helper functions
-- Run as the project owner in Supabase SQL Editor.
-- ════════════════════════════════════════════════════════════════════

-- Required extensions
create extension if not exists "pgcrypto";

-- ────────────────────────────────────────────────
-- profiles  (1:1 з auth.users, додатковий метадані)
-- ────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  login         text unique not null,
  display_name  text not null,
  role          text not null
                  check (role in ('admin','shift-manager','operator','accountant')),
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

comment on table public.profiles is 'Розширення auth.users — роль, логін, видиме імʼя';

-- Тригер: при створенні auth.users автоматично створюється profile
-- (логін/роль читаються з raw_user_meta_data)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, login, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'login', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'operator')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- Допоміжна функція — повертає роль поточного користувача
create or replace function public.user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ────────────────────────────────────────────────
-- recipes
-- ────────────────────────────────────────────────
create table if not exists public.recipes (
  id                              uuid primary key default gen_random_uuid(),
  name                            text not null,
  consumption_wheat_kg_per_ton    numeric not null default 0,
  consumption_corn_kg_per_ton     numeric not null default 0,
  consumption_premix_kg_per_ton   numeric not null default 0,
  price_wheat_per_ton             numeric not null default 0,
  price_corn_per_ton              numeric not null default 0,
  price_premix_per_ton            numeric not null default 0,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

-- ────────────────────────────────────────────────
-- equipment
-- ────────────────────────────────────────────────
create table if not exists public.equipment (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  type              text,
  status            text not null default 'Робоча'
                      check (status in ('Робоча','Тех. огляд','Ремонт')),
  next_maintenance  date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ────────────────────────────────────────────────
-- shifts
-- ────────────────────────────────────────────────
create table if not exists public.shifts (
  id            uuid primary key default gen_random_uuid(),
  opened_at     timestamptz not null default now(),
  closed_at     timestamptz,
  status        text not null default 'Відкрита'
                  check (status in ('Відкрита','Закрита')),
  operator      text,
  notes         text,
  opening_data  jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists shifts_status_idx on public.shifts(status);
create index if not exists shifts_opened_at_idx on public.shifts(opened_at desc);

-- ────────────────────────────────────────────────
-- batches
-- ────────────────────────────────────────────────
create table if not exists public.batches (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  line              text not null default 'Лінія 1',
  recipe            text not null,
  raw_spent_kg      numeric not null default 0,
  feed_produced_kg  numeric not null default 0,
  batch_cost_uah    numeric not null default 0,
  shift_id          uuid references public.shifts(id) on delete set null
);

create index if not exists batches_created_at_idx on public.batches(created_at desc);
create index if not exists batches_recipe_idx on public.batches(recipe);

-- ────────────────────────────────────────────────
-- incidents
-- ────────────────────────────────────────────────
create table if not exists public.incidents (
  id            uuid primary key default gen_random_uuid(),
  time          timestamptz not null,
  category      text not null default 'equipment'
                  check (category in ('equipment','workplace_safety','sanitation','quality','other')),
  equipment     text,
  description   text,
  severity      text check (severity in ('Критична','Висока','Середня','Низька')),
  status        text not null default 'В роботі'
                  check (status in ('В роботі','На перевірці','Закрито')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists incidents_time_idx on public.incidents(time desc);
create index if not exists incidents_status_idx on public.incidents(status);

-- ────────────────────────────────────────────────
-- raw_movements  (рух сировини)
-- ────────────────────────────────────────────────
create table if not exists public.raw_movements (
  id                  uuid primary key default gen_random_uuid(),
  time                timestamptz not null default now(),
  type                text not null check (type in ('Надходження','Списання')),
  source              text,
  delta_wheat_kg      numeric not null default 0,
  delta_corn_kg       numeric not null default 0,
  delta_premix_kg     numeric not null default 0,
  balance_wheat_kg    numeric not null default 0,
  balance_corn_kg     numeric not null default 0,
  balance_premix_kg   numeric not null default 0,
  batch_id            uuid references public.batches(id) on delete set null,
  created_at          timestamptz not null default now()
);

create index if not exists raw_movements_time_idx on public.raw_movements(time desc);

-- ────────────────────────────────────────────────
-- storage_state  (поточні залишки на складі — singleton)
-- ────────────────────────────────────────────────
create table if not exists public.storage_state (
  id          integer primary key default 1 check (id = 1),
  wheat_kg    numeric not null default 0,
  corn_kg     numeric not null default 0,
  premix_kg   numeric not null default 0,
  updated_at  timestamptz not null default now()
);

-- ────────────────────────────────────────────────
-- audit_log
-- ────────────────────────────────────────────────
create table if not exists public.audit_log (
  id        uuid primary key default gen_random_uuid(),
  at        timestamptz not null default now(),
  actor     text,
  role      text,
  action    text not null,
  details   jsonb
);

create index if not exists audit_log_at_idx on public.audit_log(at desc);

-- ────────────────────────────────────────────────
-- Авто-оновлення updated_at
-- ────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_recipes_updated_at on public.recipes;
create trigger trg_recipes_updated_at
  before update on public.recipes
  for each row execute procedure public.set_updated_at();

drop trigger if exists trg_equipment_updated_at on public.equipment;
create trigger trg_equipment_updated_at
  before update on public.equipment
  for each row execute procedure public.set_updated_at();

drop trigger if exists trg_incidents_updated_at on public.incidents;
create trigger trg_incidents_updated_at
  before update on public.incidents
  for each row execute procedure public.set_updated_at();

drop trigger if exists trg_storage_updated_at on public.storage_state;
create trigger trg_storage_updated_at
  before update on public.storage_state
  for each row execute procedure public.set_updated_at();
