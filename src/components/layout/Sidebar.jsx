import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  HomeIcon,
  CalendarIcon,
  UsersIcon,
  ClipboardListIcon,
  ExclamationTriangleIcon,
  BeakerIcon,
  CogIcon,
  ChartBarIcon,
  UserIcon,
  DocumentTextIcon,
} from '../common/Icons'

const ALL = ['admin', 'shift-manager', 'operator', 'accountant']

const MENU_GROUPS = [
  {
    label: 'Огляд',
    items: [
      { to: '/dashboard',       label: 'Головна',           Icon: HomeIcon,                 roles: ALL },
      { to: '/daily-overview',  label: 'Зведення за день',  Icon: CalendarIcon,             roles: ALL },
    ],
  },
  {
    label: 'Виробництво',
    items: [
      { to: '/shift-management',    label: 'Зміни',              Icon: UsersIcon,               roles: ['admin', 'shift-manager'] },
      { to: '/production-journal',  label: 'Журнал виробництва', Icon: ClipboardListIcon,       roles: ['admin', 'shift-manager', 'operator', 'accountant'] },
      { to: '/incidents',           label: 'Інциденти',          Icon: ExclamationTriangleIcon, roles: ['admin', 'shift-manager', 'operator'] },
    ],
  },
  {
    label: 'Довідники',
    items: [
      { to: '/recipes',   label: 'Рецепти',    Icon: BeakerIcon, roles: ['admin', 'shift-manager', 'accountant'] },
      { to: '/equipment', label: 'Обладнання', Icon: CogIcon,    roles: ['admin', 'shift-manager', 'operator'] },
    ],
  },
  {
    label: 'Звітність',
    items: [
      { to: '/reports', label: 'Звіти та аналітика', Icon: ChartBarIcon, roles: ['admin', 'shift-manager', 'accountant'] },
    ],
  },
  {
    label: 'Адмін-панель',
    items: [
      { to: '/users',     label: 'Користувачі',  Icon: UserIcon,         roles: ['admin'] },
      { to: '/audit-log', label: 'Історія дій',  Icon: DocumentTextIcon, roles: ['admin'] },
    ],
  },
]

function Sidebar({ open, onClose }) {
  const { role } = useAuth()
  const location = useLocation()

  // закриваємо мобільне меню при переході на іншу сторінку
  useEffect(() => {
    if (open) onClose?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  return (
    <>
      {/* Затемнення позаду оверлею (тільки мобільне) */}
      {open && (
        <button
          type="button"
          aria-label="Закрити меню"
          onClick={onClose}
          className="no-print fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`no-print fixed inset-y-0 left-0 z-50 w-72 transform overflow-y-auto border-r border-slate-200 bg-white p-4 shadow-xl transition-transform duration-200 ease-out dark:border-slate-700 dark:bg-slate-900 lg:static lg:z-auto lg:w-64 lg:translate-x-0 lg:shadow-none ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1 rounded-xl bg-gradient-to-br from-enterprise-700 to-enterprise-800 p-4 text-white">
            <p className="text-[10px] font-medium uppercase tracking-widest text-blue-200">
              Комбікормовий завод
            </p>
            <h1 className="mt-1 text-lg font-bold leading-tight">Digital Shift Journal</h1>
          </div>
          <button
            type="button"
            aria-label="Закрити меню"
            onClick={onClose}
            className="ml-2 rounded-md border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-100 lg:hidden dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <nav className="space-y-5">
          {MENU_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => item.roles.includes(role))
            if (!visibleItems.length) return null
            return (
              <div key={group.label}>
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                          isActive
                            ? 'bg-enterprise-700 text-white shadow-sm'
                            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                        }`
                      }
                    >
                      <item.Icon className="w-[18px] h-[18px] shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
