import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const MENU_ITEMS = [
  { to: '/dashboard', label: 'Головна сторінка', roles: ['admin', 'shift-manager', 'operator'] },
  { to: '/daily-overview', label: 'Зведення за день', roles: ['admin', 'shift-manager', 'operator'] },
  { to: '/shift-management', label: 'Управління змінами', roles: ['admin', 'shift-manager'] },
  {
    to: '/production-journal',
    label: 'Журнал виробництва',
    roles: ['admin', 'shift-manager', 'operator'],
  },
  { to: '/recipes', label: 'Рецепти та собівартість', roles: ['admin', 'shift-manager'] },
  { to: '/incidents', label: 'Журнал інцидентів', roles: ['admin', 'shift-manager', 'operator'] },
  { to: '/reports', label: 'Звіти та аналітика', roles: ['admin', 'shift-manager'] },
  { to: '/equipment', label: 'Довідник обладнання', roles: ['admin', 'shift-manager', 'operator'] },
  { to: '/audit-log', label: 'Історія дій (Audit Log)', roles: ['admin'] },
]

function Sidebar() {
  const { role } = useAuth()

  return (
    <aside className="no-print w-full border-b border-slate-300 bg-white p-4 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-slate-500">Комбікормовий завод</p>
        <h1 className="mt-2 text-lg font-semibold text-slate-800">Digital Shift Journal</h1>
      </div>

      <nav className="space-y-2">
        {MENU_ITEMS.filter((item) => item.roles.includes(role)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block rounded-md px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-enterprise-700 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
