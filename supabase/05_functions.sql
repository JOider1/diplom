-- ════════════════════════════════════════════════════════════════════
-- RPC-функції для атомарних операцій з виробничими партіями
-- Викликаються з фронтенду через supabase.rpc('...')
-- Гарантують атомарність: batch + storage_state + raw_movements
-- ════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────
-- add_batch — додає партію, оновлює склад, пише рух
-- ────────────────────────────────────────────────
create or replace function public.add_batch(
  p_recipe_name      text,
  p_feed_produced_kg numeric,
  p_line             text default 'Лінія 1',
  p_created_at       timestamptz default null
) returns public.batches
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_recipe       public.recipes;
  v_tons         numeric;
  v_wheat        numeric;
  v_corn         numeric;
  v_premix       numeric;
  v_raw_total    numeric;
  v_cost_per_ton numeric;
  v_cost         numeric;
  v_storage      public.storage_state;
  v_new_wheat    numeric;
  v_new_corn     numeric;
  v_new_premix   numeric;
  v_shift_id     uuid;
  v_batch        public.batches;
  v_created_at   timestamptz := coalesce(p_created_at, now());
begin
  select * into v_recipe from public.recipes where name = p_recipe_name limit 1;
  if v_recipe.id is null then
    raise exception 'Рецепт не знайдено: %', p_recipe_name;
  end if;

  v_tons   := p_feed_produced_kg / 1000.0;
  v_wheat  := round(v_recipe.consumption_wheat_kg_per_ton  * v_tons);
  v_corn   := round(v_recipe.consumption_corn_kg_per_ton   * v_tons);
  v_premix := round(v_recipe.consumption_premix_kg_per_ton * v_tons);
  v_raw_total := v_wheat + v_corn + v_premix;

  v_cost_per_ton :=
      (v_recipe.consumption_wheat_kg_per_ton  / 1000.0) * v_recipe.price_wheat_per_ton
    + (v_recipe.consumption_corn_kg_per_ton   / 1000.0) * v_recipe.price_corn_per_ton
    + (v_recipe.consumption_premix_kg_per_ton / 1000.0) * v_recipe.price_premix_per_ton;
  v_cost := round(v_cost_per_ton * v_tons);

  select * into v_storage from public.storage_state where id = 1 for update;
  if v_storage.id is null then
    raise exception 'storage_state (id=1) не ініціалізовано';
  end if;

  v_new_wheat  := v_storage.wheat_kg  - v_wheat;
  v_new_corn   := v_storage.corn_kg   - v_corn;
  v_new_premix := v_storage.premix_kg - v_premix;
  if v_new_wheat < 0 or v_new_corn < 0 or v_new_premix < 0 then
    raise exception 'Недостатньо сировини на складі для партії';
  end if;

  -- відкрита зміна (якщо є) — привʼяжемо
  select id into v_shift_id from public.shifts where status = 'Відкрита' order by opened_at desc limit 1;

  insert into public.batches (created_at, line, recipe, raw_spent_kg, feed_produced_kg, batch_cost_uah, shift_id)
  values (v_created_at, coalesce(p_line, 'Лінія 1'), p_recipe_name, v_raw_total, p_feed_produced_kg, v_cost, v_shift_id)
  returning * into v_batch;

  update public.storage_state
     set wheat_kg = v_new_wheat, corn_kg = v_new_corn, premix_kg = v_new_premix
   where id = 1;

  insert into public.raw_movements
    (time, type, source, delta_wheat_kg, delta_corn_kg, delta_premix_kg,
     balance_wheat_kg, balance_corn_kg, balance_premix_kg, batch_id)
  values
    (v_created_at, 'Списання', 'Партія #' || substr(v_batch.id::text, 1, 8),
     -v_wheat, -v_corn, -v_premix,
     v_new_wheat, v_new_corn, v_new_premix, v_batch.id);

  return v_batch;
end;
$$;

grant execute on function public.add_batch(text, numeric, text, timestamptz) to authenticated;

-- ────────────────────────────────────────────────
-- add_raw_arrival — надходження сировини
-- ────────────────────────────────────────────────
create or replace function public.add_raw_arrival(
  p_source     text,
  p_wheat_kg   numeric default 0,
  p_corn_kg    numeric default 0,
  p_premix_kg  numeric default 0,
  p_time       timestamptz default null
) returns public.raw_movements
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_storage    public.storage_state;
  v_new_wheat  numeric;
  v_new_corn   numeric;
  v_new_premix numeric;
  v_movement   public.raw_movements;
  v_time       timestamptz := coalesce(p_time, now());
begin
  if coalesce(p_wheat_kg,0) <= 0 and coalesce(p_corn_kg,0) <= 0 and coalesce(p_premix_kg,0) <= 0 then
    raise exception 'Вкажіть обсяг хоча б для однієї позиції сировини';
  end if;

  select * into v_storage from public.storage_state where id = 1 for update;
  if v_storage.id is null then
    raise exception 'storage_state (id=1) не ініціалізовано';
  end if;

  v_new_wheat  := v_storage.wheat_kg  + coalesce(p_wheat_kg, 0);
  v_new_corn   := v_storage.corn_kg   + coalesce(p_corn_kg, 0);
  v_new_premix := v_storage.premix_kg + coalesce(p_premix_kg, 0);

  update public.storage_state
     set wheat_kg = v_new_wheat, corn_kg = v_new_corn, premix_kg = v_new_premix
   where id = 1;

  insert into public.raw_movements
    (time, type, source, delta_wheat_kg, delta_corn_kg, delta_premix_kg,
     balance_wheat_kg, balance_corn_kg, balance_premix_kg)
  values
    (v_time, 'Надходження', coalesce(p_source, 'Постачання'),
     coalesce(p_wheat_kg,0), coalesce(p_corn_kg,0), coalesce(p_premix_kg,0),
     v_new_wheat, v_new_corn, v_new_premix)
  returning * into v_movement;

  return v_movement;
end;
$$;

grant execute on function public.add_raw_arrival(text, numeric, numeric, numeric, timestamptz) to authenticated;

-- ────────────────────────────────────────────────
-- update_batch — атомарно перерахувати склад та рух після редагування партії
-- ────────────────────────────────────────────────
create or replace function public.update_batch(
  p_batch_id          uuid,
  p_recipe_name       text,
  p_feed_produced_kg  numeric,
  p_line              text
) returns public.batches
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_old          public.batches;
  v_old_recipe   public.recipes;
  v_new_recipe   public.recipes;
  v_old_wheat    numeric;
  v_old_corn     numeric;
  v_old_premix   numeric;
  v_new_wheat    numeric;
  v_new_corn     numeric;
  v_new_premix   numeric;
  v_storage      public.storage_state;
  v_storage_w    numeric;
  v_storage_c    numeric;
  v_storage_p    numeric;
  v_old_tons     numeric;
  v_new_tons     numeric;
  v_cost_per_ton numeric;
  v_new_cost     numeric;
  v_raw_total    numeric;
  v_updated      public.batches;
begin
  select * into v_old from public.batches where id = p_batch_id;
  if v_old.id is null then
    raise exception 'Партію не знайдено: %', p_batch_id;
  end if;

  select * into v_old_recipe from public.recipes where name = v_old.recipe limit 1;
  select * into v_new_recipe from public.recipes where name = p_recipe_name limit 1;
  if v_new_recipe.id is null then
    raise exception 'Рецепт не знайдено: %', p_recipe_name;
  end if;

  v_new_tons := p_feed_produced_kg / 1000.0;
  v_new_wheat  := round(v_new_recipe.consumption_wheat_kg_per_ton  * v_new_tons);
  v_new_corn   := round(v_new_recipe.consumption_corn_kg_per_ton   * v_new_tons);
  v_new_premix := round(v_new_recipe.consumption_premix_kg_per_ton * v_new_tons);
  v_raw_total  := v_new_wheat + v_new_corn + v_new_premix;

  if v_old_recipe.id is not null then
    v_old_tons := v_old.feed_produced_kg / 1000.0;
    v_old_wheat  := round(v_old_recipe.consumption_wheat_kg_per_ton  * v_old_tons);
    v_old_corn   := round(v_old_recipe.consumption_corn_kg_per_ton   * v_old_tons);
    v_old_premix := round(v_old_recipe.consumption_premix_kg_per_ton * v_old_tons);
  else
    v_old_wheat  := round(v_old.raw_spent_kg * 0.62);
    v_old_corn   := round(v_old.raw_spent_kg * 0.33);
    v_old_premix := v_old.raw_spent_kg - v_old_wheat - v_old_corn;
  end if;

  v_cost_per_ton :=
      (v_new_recipe.consumption_wheat_kg_per_ton  / 1000.0) * v_new_recipe.price_wheat_per_ton
    + (v_new_recipe.consumption_corn_kg_per_ton   / 1000.0) * v_new_recipe.price_corn_per_ton
    + (v_new_recipe.consumption_premix_kg_per_ton / 1000.0) * v_new_recipe.price_premix_per_ton;
  v_new_cost := round(v_cost_per_ton * v_new_tons);

  select * into v_storage from public.storage_state where id = 1 for update;
  v_storage_w := v_storage.wheat_kg  - (v_new_wheat  - v_old_wheat);
  v_storage_c := v_storage.corn_kg   - (v_new_corn   - v_old_corn);
  v_storage_p := v_storage.premix_kg - (v_new_premix - v_old_premix);
  if v_storage_w < 0 or v_storage_c < 0 or v_storage_p < 0 then
    raise exception 'Недостатньо сировини для оновленого обсягу партії';
  end if;

  update public.batches
     set recipe = p_recipe_name,
         line = coalesce(p_line, line),
         feed_produced_kg = p_feed_produced_kg,
         raw_spent_kg = v_raw_total,
         batch_cost_uah = v_new_cost
   where id = p_batch_id
  returning * into v_updated;

  update public.storage_state
     set wheat_kg = v_storage_w, corn_kg = v_storage_c, premix_kg = v_storage_p
   where id = 1;

  -- оновити повʼязаний рух (якщо є)
  update public.raw_movements
     set delta_wheat_kg  = -v_new_wheat,
         delta_corn_kg   = -v_new_corn,
         delta_premix_kg = -v_new_premix,
         balance_wheat_kg  = v_storage_w,
         balance_corn_kg   = v_storage_c,
         balance_premix_kg = v_storage_p
   where batch_id = p_batch_id and type = 'Списання';

  return v_updated;
end;
$$;

grant execute on function public.update_batch(uuid, text, numeric, text) to authenticated;
