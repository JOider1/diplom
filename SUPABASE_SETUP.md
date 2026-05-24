# Supabase — інструкція з налаштування

Покрокова інструкція для розгортання БД проекту на Supabase.
Після виконання всіх кроків застосунок зможе підключитися до реальної БД.

---

## Крок 1 · Створити проект на Supabase

1. Зайти на **https://supabase.com** та зареєструватися (можна через GitHub).
2. Натиснути **New project**.
3. Заповнити:
   - **Name:** `digital-shift-journal` (або будь-яка назва)
   - **Database password:** згенеруй сильний пароль і збережи у менеджері паролів — він знадобиться лише раз для адмін-доступу до Postgres напряму.
   - **Region:** обери найближчий до твого регіону (наприклад, *Europe — Frankfurt*).
   - **Pricing plan:** Free.
4. Натиснути **Create new project** і зачекати 1–2 хвилини, поки створиться база.

---

## Крок 2 · Виконати SQL-скрипти

Усі SQL-файли лежать у папці `supabase/` цього репозиторію. Запускати у такому порядку:

1. У бічному меню Supabase обери **SQL Editor**.
2. Натисни **+ New query**.
3. Послідовно скопіюй вміст файлів і запусти кожен (кнопка **Run** або `Ctrl+Enter`):

| Порядок | Файл | Що робить |
|---|---|---|
| 1 | [`supabase/01_schema.sql`](supabase/01_schema.sql) | Таблиці, тригери, helper-функції |
| 2 | [`supabase/02_rls.sql`](supabase/02_rls.sql) | RLS-політики (потім вимикаються у кроці 6 — лишено для довідки) |
| 3 | [`supabase/03_seed.sql`](supabase/03_seed.sql) | Рецепти, обладнання, початковий склад |
| 4 | [`supabase/05_functions.sql`](supabase/05_functions.sql) | RPC `add_batch`, `update_batch`, `add_raw_arrival` — атомарні операції зі складом |
| 5 | [`supabase/06_seed_may_2026.sql`](supabase/06_seed_may_2026.sql) | Повний місяць даних на травень 2026: зміни, ~45 партій, рух сировини, 15 інцидентів |
| 6 | [`supabase/10_simple_auth.sql`](supabase/10_simple_auth.sql) | **Власна авторизація**: таблиця `app_users`, RPC `app_login`, 4 демо-юзери з bcrypt-паролями. Вимикає RLS на всіх таблицях. |

Після успішного виконання у меню **Table Editor** з'являться таблиці:
`app_users` (нова, для входу), `recipes`, `equipment`, `shifts`, `batches`, `incidents`, `raw_movements`, `storage_state`, `audit_log`.

---

## Крок 3 · Перевірити демо-користувачів

Після запуску [`10_simple_auth.sql`](supabase/10_simple_auth.sql) у таблиці `app_users` мають бути 4 рядки.

### Демо-облікові записи

| Логін | Пароль | Роль |
|---|---|---|
| `admin` | `admin123` | Адміністратор |
| `manager` | `manager123` | Менеджер зміни |
| `operator` | `operator123` | Оператор |
| `accountant` | `accountant123` | Бухгалтер |

> Авторизація через **логін + пароль**, без email. Усе зберігається в `public.app_users` з bcrypt-хешами, перевірка через RPC `public.app_login(login, password)`.

---

## Крок 4 · Підключити фронтенд

### 4.1. Скопіюй ключі

У Supabase: **Project Settings → API** скопіюй два значення:
- **Project URL** (напр. `https://abcdefghijk.supabase.co`)
- **anon public** ключ (довгий `eyJ...` JWT)

### 4.2. Створи `.env` у корені репозиторію

```bash
cp .env.example .env
```

Відкрий `.env` і вставь свої ключі:

```env
VITE_SUPABASE_URL=https://abcdefghijk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ `.env` уже додано до `.gitignore` — не комітимо ключі у git.

### 4.3. Перезапусти dev-сервер

```bash
npm run dev
```

Перевірити з'єднання: відкрий **DevTools → Network** і зайди на сайт. Маєш бачити запити на `xxx.supabase.co/auth/v1` та `/rest/v1`.

---

## Крок 5 · Деплой на Render

1. Зайди на **https://render.com**, увійди через GitHub.
2. **New → Static Site**.
3. Вибери репозиторій з цим проектом.
4. Налаштування:
   - **Build command:** `npm install && npm run build`
   - **Publish directory:** `dist`
   - **Auto-deploy:** On (за бажанням)
5. У розділі **Environment** додай дві змінні:
   - `VITE_SUPABASE_URL` = твій URL
   - `VITE_SUPABASE_ANON_KEY` = твій anon-ключ
6. Натисни **Create Static Site**.

### Redirect rules (для SPA)

Render треба, щоб усі шляхи поверталися на `index.html`. Додай у налаштуваннях сайту → **Redirects/Rewrites**:

| Source | Destination | Action |
|---|---|---|
| `/*` | `/index.html` | Rewrite |

Це потрібно, щоб React Router міг обробляти прямі переходи (`/reports`, `/users` тощо).

---

## Структура SQL-файлів

```
supabase/
├── 01_schema.sql   # Таблиці + тригери + функції
├── 02_rls.sql      # Row Level Security
└── 03_seed.sql     # Початкові дані
```

## Матриця доступу (RLS)

| Таблиця | SELECT | INSERT/UPDATE/DELETE |
|---|---|---|
| `profiles` | усі | лише `admin` |
| `recipes` | усі | `admin`, `shift-manager` |
| `equipment` | усі | `admin`, `shift-manager`, `operator` |
| `shifts` | усі | `admin`, `shift-manager` |
| `batches` | усі | `admin`, `shift-manager`, `operator` |
| `incidents` | усі | `admin`, `shift-manager`, `operator` |
| `raw_movements` | усі | `admin`, `shift-manager`, `operator` |
| `storage_state` | усі | `admin`, `shift-manager`, `operator` |
| `audit_log` | лише `admin` | усі (INSERT) |

Бухгалтер (`accountant`) має лише читання — RLS зупинить будь-яку спробу запису з фронтенду навіть якщо UI це дозволить.

---

## Перевірка SQL з командного рядка (опційно)

Якщо хочеш запустити SQL не з веб-редактора, а з терміналу:

```bash
# 1. Встанови Supabase CLI:  https://supabase.com/docs/guides/cli
# 2. Залогінся:
supabase login

# 3. Підключися до проекту:
supabase link --project-ref <твій project-ref>

# 4. Запусти SQL-файли:
psql "postgresql://postgres:[YOUR_DB_PASSWORD]@db.<project-ref>.supabase.co:5432/postgres" \
  -f supabase/01_schema.sql \
  -f supabase/02_rls.sql \
  -f supabase/03_seed.sql
```

---

## Що далі (поза цією інструкцією)

Зараз застосунок ще працює з `localStorage` через `AppDataContext`. Наступний крок — переписати контекст так, щоб усі CRUD операції йшли через `supabase` клієнт. Це окрема задача — повідом, коли БД готова, і ми її зробимо разом.
