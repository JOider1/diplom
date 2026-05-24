-- ════════════════════════════════════════════════════════════════════
-- ПРОСТА АВТОРИЗАЦІЯ — без Supabase Auth, без email, без JWT.
--
-- Таблиця public.app_users з bcrypt-паролями.
-- RPC public.app_login(login, password) → повертає user.
-- Сесія тримається у localStorage браузера.
--
-- RLS вимикається на всіх даних — застосунок працює через anon-ключ.
-- (Для thesis-проекту це нормально; для прод треба JWT-based RLS).
-- ════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────
-- 1. Таблиця app_users
-- ────────────────────────────────────────────────
create table if not exists public.app_users (
  id            uuid primary key default gen_random_uuid(),
  login         text unique not null,
  password_hash text not null,
  display_name  text not null,
  role          text not null check (role in ('admin','shift-manager','operator','accountant')),
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists trg_app_users_updated_at on public.app_users;
create trigger trg_app_users_updated_at
  before update on public.app_users
  for each row execute procedure public.set_updated_at();

-- ────────────────────────────────────────────────
-- 2. View для безпечного читання (без password_hash)
-- ────────────────────────────────────────────────
create or replace view public.v_app_users as
  select id, login, display_name, role, active, created_at
    from public.app_users;

-- ────────────────────────────────────────────────
-- 3. Вимикаємо RLS на всіх таблицях (anon робить усе)
-- ────────────────────────────────────────────────
alter table public.app_users      disable row level security;
alter table public.profiles       disable row level security;
alter table public.recipes        disable row level security;
alter table public.equipment      disable row level security;
alter table public.shifts         disable row level security;
alter table public.batches        disable row level security;
alter table public.incidents      disable row level security;
alter table public.raw_movements  disable row level security;
alter table public.storage_state  disable row level security;
alter table public.audit_log      disable row level security;

grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant select on public.v_app_users to anon, authenticated;

-- ────────────────────────────────────────────────
-- 4. Сід — 4 демо-юзери
-- ────────────────────────────────────────────────
insert into public.app_users (login, password_hash, display_name, role) values
  ('admin',      extensions.crypt('admin123',      extensions.gen_salt('bf')), 'Адміністратор системи', 'admin'),
  ('manager',    extensions.crypt('manager123',    extensions.gen_salt('bf')), 'Оксана Коваль',          'shift-manager'),
  ('operator',   extensions.crypt('operator123',   extensions.gen_salt('bf')), 'Іван Петренко',          'operator'),
  ('accountant', extensions.crypt('accountant123', extensions.gen_salt('bf')), 'Наталія Лисенко',        'accountant')
on conflict (login) do nothing;

-- ────────────────────────────────────────────────
-- 5. RPC: app_login
-- ────────────────────────────────────────────────
create or replace function public.app_login(
  p_login    text,
  p_password text
) returns table (
  id           uuid,
  login        text,
  display_name text,
  role         text,
  active       boolean
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_user public.app_users;
begin
  if p_login is null or length(trim(p_login)) = 0 then
    raise exception 'Вкажіть логін';
  end if;
  if p_password is null or length(p_password) = 0 then
    raise exception 'Вкажіть пароль';
  end if;

  select * into v_user
    from public.app_users
   where lower(app_users.login) = lower(trim(p_login));

  if v_user.id is null then
    raise exception 'Невірний логін або пароль';
  end if;
  if not v_user.active then
    raise exception 'Обліковий запис деактивовано';
  end if;
  if v_user.password_hash <> extensions.crypt(p_password, v_user.password_hash) then
    raise exception 'Невірний логін або пароль';
  end if;

  return query select v_user.id, v_user.login, v_user.display_name, v_user.role, v_user.active;
end;
$$;

grant execute on function public.app_login(text, text) to anon, authenticated;

-- ────────────────────────────────────────────────
-- 6. RPC: app_create_user (без перевірки ролі)
-- ────────────────────────────────────────────────
create or replace function public.app_create_user(
  p_login        text,
  p_password     text,
  p_display_name text,
  p_role         text
) returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_login_n text := lower(trim(p_login));
  v_id      uuid;
begin
  if v_login_n is null or v_login_n = '' then
    raise exception 'Логін обовʼязковий';
  end if;
  if p_password is null or length(p_password) < 6 then
    raise exception 'Пароль має бути не коротший за 6 символів';
  end if;
  if p_role not in ('admin','shift-manager','operator','accountant') then
    raise exception 'Невідома роль: %', p_role;
  end if;
  if exists (select 1 from public.app_users where login = v_login_n) then
    raise exception 'Логін % вже зайнятий', v_login_n;
  end if;

  insert into public.app_users (login, password_hash, display_name, role, active)
  values (
    v_login_n,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    trim(coalesce(p_display_name, v_login_n)),
    p_role,
    true
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.app_create_user(text, text, text, text) to anon, authenticated;

-- ────────────────────────────────────────────────
-- 7. RPC: app_update_user (display_name + role)
-- ────────────────────────────────────────────────
create or replace function public.app_update_user(
  p_user_id      uuid,
  p_display_name text,
  p_role         text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_role not in ('admin','shift-manager','operator','accountant') then
    raise exception 'Невідома роль: %', p_role;
  end if;
  update public.app_users
     set display_name = trim(p_display_name),
         role = p_role
   where id = p_user_id;
end;
$$;

grant execute on function public.app_update_user(uuid, text, text) to anon, authenticated;

-- ────────────────────────────────────────────────
-- 8. RPC: app_set_password
-- ────────────────────────────────────────────────
create or replace function public.app_set_password(
  p_user_id      uuid,
  p_new_password text
) returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if p_new_password is null or length(p_new_password) < 6 then
    raise exception 'Пароль має бути не коротший за 6 символів';
  end if;
  update public.app_users
     set password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf'))
   where id = p_user_id;
end;
$$;

grant execute on function public.app_set_password(uuid, text) to anon, authenticated;

-- ────────────────────────────────────────────────
-- 9. RPC: app_set_active
-- ────────────────────────────────────────────────
create or replace function public.app_set_active(
  p_user_id uuid,
  p_active  boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.app_users set active = p_active where id = p_user_id;
end;
$$;

grant execute on function public.app_set_active(uuid, boolean) to anon, authenticated;

-- ────────────────────────────────────────────────
-- 10. RPC: app_delete_user
-- ────────────────────────────────────────────────
create or replace function public.app_delete_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.app_users where id = p_user_id;
end;
$$;

grant execute on function public.app_delete_user(uuid) to anon, authenticated;

-- ────────────────────────────────────────────────
-- 11. Перевірка
-- ────────────────────────────────────────────────
select login, display_name, role, active from public.app_users order by role;
