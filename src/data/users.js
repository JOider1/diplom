export const ROLE_OPTIONS = [
  { label: 'Адміністратор', value: 'admin' },
  { label: 'Менеджер зміни', value: 'shift-manager' },
  { label: 'Оператор', value: 'operator' },
]

export const initialUsers = [
  {
    id: 'user-admin',
    login: 'admin',
    password: 'admin123',
    displayName: 'Адміністратор системи',
    role: 'admin',
    active: true,
  },
  {
    id: 'user-manager',
    login: 'manager',
    password: 'manager123',
    displayName: 'Оксана Коваль',
    role: 'shift-manager',
    active: true,
  },
  {
    id: 'user-operator',
    login: 'operator',
    password: 'operator123',
    displayName: 'Іван Петренко',
    role: 'operator',
    active: true,
  },
]
