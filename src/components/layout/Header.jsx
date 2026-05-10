<<<<<<< HEAD
import { useRole } from '../../context/RoleContext'

function Header() {
  const { role, setRole, roleOptions } = useRole()
=======
import { useAuth } from '../../context/AuthContext'

function Header() {
  const { role, logout, roleOptions } = useAuth()
  const roleLabel = roleOptions.find((option) => option.value === role)?.label || 'Невідома роль'
>>>>>>> 8fb2b64 (first commit)

  return (
    <header className="mb-6 flex flex-col gap-3 rounded-lg border border-slate-300 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-widest text-slate-500">Поточна зміна</p>
        <h2 className="text-xl font-semibold text-slate-800">Моніторинг виробництва кормів</h2>
      </div>

      <div className="flex items-center gap-3">
<<<<<<< HEAD
        <label htmlFor="role" className="text-sm font-medium text-slate-700">
          Роль
        </label>
        <select
          id="role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-enterprise-600 focus:outline-none"
        >
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
=======
        <p className="text-sm font-medium text-slate-700">{roleLabel}</p>
        <button
          type="button"
          onClick={logout}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Вийти
        </button>
>>>>>>> 8fb2b64 (first commit)
      </div>
    </header>
  )
}

export default Header
