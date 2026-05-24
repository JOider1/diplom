// Лише довідник ролей. Облікові записи зберігаються у Supabase auth.users + public.profiles.
// Створення нових користувачів — через Supabase Dashboard або SQL-скрипт 04_users.sql.
export const ROLE_OPTIONS = [
  { label: 'Адміністратор', value: 'admin' },
  { label: 'Менеджер зміни', value: 'shift-manager' },
  { label: 'Оператор', value: 'operator' },
  { label: 'Бухгалтер', value: 'accountant' },
]
