import { useAuth } from '../../context/AuthContext'
import { useAppData } from '../../context/AppDataContext'
import { useTheme } from '../../context/ThemeContext'

function Header() {
  const { role, logout, roleOptions } = useAuth()
  const { storageKg, averageDailyConsumptionKg } = useAppData()
  const { theme, toggleTheme } = useTheme()
  const roleLabel = roleOptions.find((option) => option.value === role)?.label || 'Невідома роль'
  const criticalRawCount = Object.keys(storageKg).reduce((count, key) => {
    const daily = averageDailyConsumptionKg[key] || 0
    if (!daily) {
      return count
    }
    const daysLeft = Math.round(storageKg[key] / daily)
    return daysLeft < 2 ? count + 1 : count
  }, 0)

  return (
    <header className="no-print mb-6 flex flex-col gap-3 rounded-lg border border-slate-300 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-widest text-slate-500">Поточна зміна</p>
        <h2 className="text-xl font-semibold text-slate-800">Моніторинг виробництва кормів</h2>
      </div>

      <div className="flex items-center gap-3">
        {criticalRawCount > 0 && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            Критичні запаси: {criticalRawCount}
          </span>
        )}
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          {theme === 'dark' ? 'Світла тема' : 'Темна тема'}
        </button>
        <p className="text-sm font-medium text-slate-700">{roleLabel}</p>
        <button
          type="button"
          onClick={logout}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Вийти
        </button>
      </div>
    </header>
  )
}

export default Header
