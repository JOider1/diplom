-- ════════════════════════════════════════════════════════════════════
-- Seed на травень 2026 — повне завантаження виробничих даних на місяць.
-- Очищає старі дані з public-таблиць (крім recipes/equipment/profiles)
-- та генерує: зміни, партії, інциденти, рух сировини.
--
-- Запускати ОДИН раз. Безпечно перезапускати — переочищає виробничі дані.
-- ════════════════════════════════════════════════════════════════════

set timezone = 'Europe/Kyiv';

-- ────────────────────────────────────────────────
-- 1. Очистка виробничих даних
-- ────────────────────────────────────────────────
truncate table public.raw_movements restart identity cascade;
truncate table public.batches       restart identity cascade;
truncate table public.incidents     restart identity cascade;
truncate table public.shifts        restart identity cascade;
truncate table public.audit_log     restart identity cascade;

-- скинути склад у вихідний стан (вистачає на місяць виробництва з запасом)
insert into public.storage_state (id, wheat_kg, corn_kg, premix_kg)
values (1, 280000, 200000, 45000)
on conflict (id) do update
  set wheat_kg = 280000, corn_kg = 200000, premix_kg = 45000;

-- ────────────────────────────────────────────────
-- 2. Зміни на травень 2026
-- ────────────────────────────────────────────────
do $$
declare
  v_day date;
  v_today date := date '2026-05-24';
  v_operator text;
  v_storage public.storage_state;
  v_open_jsonb jsonb;
begin
  for v_day in select generate_series(date '2026-05-01', v_today, interval '1 day')::date loop
    -- неділю пропускаємо
    if extract(dow from v_day) = 0 then
      continue;
    end if;

    -- оператор по черзі
    v_operator := (array[
      'Іван Петренко',
      'Оксана Коваль',
      'Сергій Мельник',
      'Ірина Шевчук',
      'Андрій Бондар',
      'Марія Левчук'
    ])[((extract(day from v_day)::int) % 6) + 1];

    select * into v_storage from public.storage_state where id = 1;
    v_open_jsonb := jsonb_build_object(
      'wheat',  round((v_storage.wheat_kg  / 1000.0)::numeric, 0),
      'corn',   round((v_storage.corn_kg   / 1000.0)::numeric, 0),
      'premix', round((v_storage.premix_kg / 1000.0)::numeric, 0),
      'granulationLine1', 'Робоча',
      'granulationLine2', case when extract(day from v_day)::int % 7 = 3 then 'Тех. огляд' else 'Робоча' end
    );

    insert into public.shifts (opened_at, closed_at, status, operator, notes, opening_data)
    values (
      (v_day::timestamp + time '08:00:00') at time zone 'Europe/Kyiv',
      case when v_day < v_today
           then (v_day::timestamp + time '20:00:00') at time zone 'Europe/Kyiv'
           else null end,
      case when v_day < v_today then 'Закрита' else 'Відкрита' end,
      v_operator,
      case when v_day < v_today then 'Денна зміна, штатний режим' else 'Поточна зміна' end,
      v_open_jsonb
    );
  end loop;
end $$;

-- ────────────────────────────────────────────────
-- 3. Партії — використовуємо RPC public.add_batch
--    (вона сама оновить склад і запише рух)
-- ────────────────────────────────────────────────
do $$
declare
  v_day date;
  v_today date := date '2026-05-24';
  v_dow int;
  v_broiler text := 'Стартовий комбікорм для бройлерів';
  v_pig     text := 'Комбікорм для свиней, фініш';
begin
  for v_day in select generate_series(date '2026-05-01', v_today, interval '1 day')::date loop
    v_dow := extract(dow from v_day);
    if v_dow = 0 then continue; end if; -- неділя — без виробництва

    -- надходження раз на 5 днів (1, 6, 11, 16, 21)
    if extract(day from v_day)::int % 5 = 1 then
      perform public.add_raw_arrival(
        (array['ТОВ Агро-Сировина','ПП ЗерноПлюс','ТОВ ФідРесурс','ТОВ ХарківАгроТрейд'])[((extract(day from v_day)::int / 5) % 4) + 1],
        15000 + (extract(day from v_day)::int * 100),
        10000 + (extract(day from v_day)::int * 50),
        2500 + (extract(day from v_day)::int * 20),
        (v_day::timestamp + time '07:30:00') at time zone 'Europe/Kyiv'
      );
    end if;

    -- ранкова партія: бройлерний
    perform public.add_batch(
      v_broiler,
      6800 + (extract(day from v_day)::int * 30),
      'Лінія 1',
      (v_day::timestamp + time '09:15:00') at time zone 'Europe/Kyiv'
    );

    -- денна партія: свинячий (через раз)
    if v_dow not in (3) then
      perform public.add_batch(
        v_pig,
        5800 + (extract(day from v_day)::int * 20),
        'Лінія 2',
        (v_day::timestamp + time '13:30:00') at time zone 'Europe/Kyiv'
      );
    end if;

    -- вечірня партія: ще одна (по парних днях)
    if extract(day from v_day)::int % 2 = 0 then
      perform public.add_batch(
        case when extract(day from v_day)::int % 4 = 0 then v_broiler else v_pig end,
        5200 + (extract(day from v_day)::int * 25),
        case when v_dow % 2 = 0 then 'Лінія 1' else 'Лінія 2' end,
        (v_day::timestamp + time '17:45:00') at time zone 'Europe/Kyiv'
      );
    end if;
  end loop;
end $$;

-- ────────────────────────────────────────────────
-- 4. Інциденти за травень
-- ────────────────────────────────────────────────
insert into public.incidents (time, category, equipment, description, severity, status) values
  ((date '2026-05-02' + time '11:20')::timestamp at time zone 'Europe/Kyiv', 'equipment',        'Лінія грануляції №2',      'Коливання тиску пари',                                'Критична','Закрито'),
  ((date '2026-05-03' + time '10:40')::timestamp at time zone 'Europe/Kyiv', 'workplace_safety', 'Цех змішування, лінія 1',  'Легке травмування пальця (надано першу допомогу)',    'Висока',  'Закрито'),
  ((date '2026-05-05' + time '14:05')::timestamp at time zone 'Europe/Kyiv', 'equipment',        'Дозатор мікрокомпонентів', 'Нестабільна подача преміксу',                         'Середня', 'Закрито'),
  ((date '2026-05-07' + time '09:30')::timestamp at time zone 'Europe/Kyiv', 'equipment',        'Гранулятор ГР-2',          'Перегрів підшипника приводного вузла',                'Висока',  'Закрито'),
  ((date '2026-05-09' + time '16:10')::timestamp at time zone 'Europe/Kyiv', 'equipment',        'Елеватор ЕЛ-1',            'Підвищений шум редуктора',                            'Низька',  'Закрито'),
  ((date '2026-05-11' + time '08:55')::timestamp at time zone 'Europe/Kyiv', 'sanitation',       'Склад готової продукції',  'Локальне забруднення поверхні підлоги, проведено CIP','Середня', 'Закрито'),
  ((date '2026-05-13' + time '12:20')::timestamp at time zone 'Europe/Kyiv', 'quality',          'Лабораторія ВТК',          'Перевищення вологості готового корму (партія №14)',   'Висока',  'Закрито'),
  ((date '2026-05-15' + time '15:40')::timestamp at time zone 'Europe/Kyiv', 'equipment',        'Лінія грануляції №1',      'Просідання подачі сировини у вечірню зміну',          'Середня', 'Закрито'),
  ((date '2026-05-17' + time '09:05')::timestamp at time zone 'Europe/Kyiv', 'equipment',        'Гранулятор ГР-2',          'Поточне обслуговування — заміна підшипника',          'Низька',  'Закрито'),
  ((date '2026-05-19' + time '14:25')::timestamp at time zone 'Europe/Kyiv', 'workplace_safety', 'Зона навантаження',        'Слизька поверхня після опадів — поставлено знаки',    'Низька',  'Закрито'),
  ((date '2026-05-20' + time '11:00')::timestamp at time zone 'Europe/Kyiv', 'equipment',        'Лінія грануляції №2',      'Регламентне ТО, плановий простій 4 год',              'Низька',  'На перевірці'),
  ((date '2026-05-22' + time '10:30')::timestamp at time zone 'Europe/Kyiv', 'quality',          'Лабораторія ВТК',          'Контроль партії №28 — відхилення у білку',            'Середня', 'На перевірці'),
  ((date '2026-05-23' + time '16:50')::timestamp at time zone 'Europe/Kyiv', 'equipment',        'Дозатор мікрокомпонентів', 'Калібрування дозатора преміксів',                     'Середня', 'В роботі'),
  ((date '2026-05-24' + time '08:45')::timestamp at time zone 'Europe/Kyiv', 'equipment',        'Гранулятор ГР-2',          'Підвищена вібрація при запуску',                      'Висока',  'В роботі'),
  ((date '2026-05-24' + time '11:15')::timestamp at time zone 'Europe/Kyiv', 'workplace_safety', 'Цех змішування, лінія 2',  'Інструктаж із техніки безпеки для нового оператора',  'Низька',  'В роботі');

-- ────────────────────────────────────────────────
-- 5. Перевірка
-- ────────────────────────────────────────────────
select
  (select count(*) from public.shifts)        as shifts_count,
  (select count(*) from public.batches)       as batches_count,
  (select count(*) from public.incidents)     as incidents_count,
  (select count(*) from public.raw_movements) as movements_count,
  (select wheat_kg from public.storage_state where id = 1)  as storage_wheat,
  (select corn_kg from public.storage_state where id = 1)   as storage_corn,
  (select premix_kg from public.storage_state where id = 1) as storage_premix;
