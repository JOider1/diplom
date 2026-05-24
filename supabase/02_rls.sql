-- ════════════════════════════════════════════════════════════════════
-- RLS · Row Level Security
-- Усі запити з фронтенду йдуть під роль authenticated, RLS гарантує
-- що користувач бачить/править тільки те, що йому дозволено.
-- ════════════════════════════════════════════════════════════════════

-- Вмикаємо RLS на всіх таблицях
alter table public.profiles       enable row level security;
alter table public.recipes        enable row level security;
alter table public.equipment      enable row level security;
alter table public.shifts         enable row level security;
alter table public.batches        enable row level security;
alter table public.incidents      enable row level security;
alter table public.raw_movements  enable row level security;
alter table public.storage_state  enable row level security;
alter table public.audit_log      enable row level security;

-- ────────────────────────────────────────────────
-- profiles
-- ────────────────────────────────────────────────
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles_admin_write" on public.profiles;
create policy "profiles_admin_write"
  on public.profiles for all
  to authenticated
  using (public.user_role() = 'admin')
  with check (public.user_role() = 'admin');

-- ────────────────────────────────────────────────
-- recipes — читають усі автентифіковані, пишуть admin/shift-manager
-- ────────────────────────────────────────────────
drop policy if exists "recipes_select_all" on public.recipes;
create policy "recipes_select_all"
  on public.recipes for select
  to authenticated
  using (true);

drop policy if exists "recipes_write_manager" on public.recipes;
create policy "recipes_write_manager"
  on public.recipes for all
  to authenticated
  using (public.user_role() in ('admin','shift-manager'))
  with check (public.user_role() in ('admin','shift-manager'));

-- ────────────────────────────────────────────────
-- equipment — читають усі, пишуть admin/shift-manager/operator
-- ────────────────────────────────────────────────
drop policy if exists "equipment_select_all" on public.equipment;
create policy "equipment_select_all"
  on public.equipment for select
  to authenticated
  using (true);

drop policy if exists "equipment_write_ops" on public.equipment;
create policy "equipment_write_ops"
  on public.equipment for all
  to authenticated
  using (public.user_role() in ('admin','shift-manager','operator'))
  with check (public.user_role() in ('admin','shift-manager','operator'));

-- ────────────────────────────────────────────────
-- shifts — читають усі, пишуть admin/shift-manager
-- ────────────────────────────────────────────────
drop policy if exists "shifts_select_all" on public.shifts;
create policy "shifts_select_all"
  on public.shifts for select
  to authenticated
  using (true);

drop policy if exists "shifts_write_manager" on public.shifts;
create policy "shifts_write_manager"
  on public.shifts for all
  to authenticated
  using (public.user_role() in ('admin','shift-manager'))
  with check (public.user_role() in ('admin','shift-manager'));

-- ────────────────────────────────────────────────
-- batches — читають усі, пишуть admin/shift-manager/operator
-- ────────────────────────────────────────────────
drop policy if exists "batches_select_all" on public.batches;
create policy "batches_select_all"
  on public.batches for select
  to authenticated
  using (true);

drop policy if exists "batches_write_ops" on public.batches;
create policy "batches_write_ops"
  on public.batches for all
  to authenticated
  using (public.user_role() in ('admin','shift-manager','operator'))
  with check (public.user_role() in ('admin','shift-manager','operator'));

-- ────────────────────────────────────────────────
-- incidents — читають усі, пишуть admin/shift-manager/operator
-- ────────────────────────────────────────────────
drop policy if exists "incidents_select_all" on public.incidents;
create policy "incidents_select_all"
  on public.incidents for select
  to authenticated
  using (true);

drop policy if exists "incidents_write_ops" on public.incidents;
create policy "incidents_write_ops"
  on public.incidents for all
  to authenticated
  using (public.user_role() in ('admin','shift-manager','operator'))
  with check (public.user_role() in ('admin','shift-manager','operator'));

-- ────────────────────────────────────────────────
-- raw_movements — читають усі, пишуть admin/shift-manager/operator
-- ────────────────────────────────────────────────
drop policy if exists "movements_select_all" on public.raw_movements;
create policy "movements_select_all"
  on public.raw_movements for select
  to authenticated
  using (true);

drop policy if exists "movements_write_ops" on public.raw_movements;
create policy "movements_write_ops"
  on public.raw_movements for all
  to authenticated
  using (public.user_role() in ('admin','shift-manager','operator'))
  with check (public.user_role() in ('admin','shift-manager','operator'));

-- ────────────────────────────────────────────────
-- storage_state — читають усі, пишуть admin/shift-manager/operator
-- ────────────────────────────────────────────────
drop policy if exists "storage_select_all" on public.storage_state;
create policy "storage_select_all"
  on public.storage_state for select
  to authenticated
  using (true);

drop policy if exists "storage_write_ops" on public.storage_state;
create policy "storage_write_ops"
  on public.storage_state for all
  to authenticated
  using (public.user_role() in ('admin','shift-manager','operator'))
  with check (public.user_role() in ('admin','shift-manager','operator'));

-- ────────────────────────────────────────────────
-- audit_log — читає лише admin, інсертить будь-хто автентифікований
-- ────────────────────────────────────────────────
drop policy if exists "audit_admin_read" on public.audit_log;
create policy "audit_admin_read"
  on public.audit_log for select
  to authenticated
  using (public.user_role() = 'admin');

drop policy if exists "audit_authenticated_insert" on public.audit_log;
create policy "audit_authenticated_insert"
  on public.audit_log for insert
  to authenticated
  with check (true);
