import { useAuth } from '../../context/AuthContext'
import { useAppData } from '../../context/AppDataContext'
import { useTheme } from '../../context/ThemeContext'
import { Bars3Icon, ArrowRightOnRectangleIcon, SunIcon, MoonIcon, ExclamationTriangleIcon } from '../common/Icons'

function Header({ onMenuClick }) {
  const { role, logout, roleOptions, displayName, roleLabel: authRoleLabel } = useAuth()
  const { storageKg, averageDailyConsumptionKg } = useAppData()
  const { theme, toggleTheme } = useTheme()
  const roleLabel = authRoleLabel || roleOptions.find((option) => option.value === role)?.label || 'Невідома роль'
  const criticalRawCount = Object.keys(storageKg).reduce((count, key) => {
    const daily = averageDailyConsumptionKg[key] || 0
    if (!daily) return count
    const daysLeft = Math.round(storageKg[key] / daily)
    return daysLeft < 2 ? count + 1 : count
  }, 0)

  const handleLogout = () => {
    try {
      logout()
    } catch (e) {
      console.error('[header] logout failed', e)
    }
  }

  return (
    <header className="no-print mb-4 rounded-lg border border-slate-300 bg-white p-3 shadow-sm dark:border-slate-600 dark:bg-slate-800 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        {/* ── Ліво: гамбургер + назва ── */}
        <div className="flex min-w-0 items-center gap-3">
          {/* Hamburger (тільки мобільний) */}
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Відкрити меню"
            className="rounded-md border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-100 lg:hidden dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 sm:text-xs">
              Поточна зміна
            </p>
            <h2 className="truncate text-base font-semibold text-slate-800 dark:text-slate-100 sm:text-xl">
              <span className="hidden sm:inline">Моніторинг виробництва кормів</span>
              <span className="sm:hidden">DSJ</span>
            </h2>
          </div>
        </div>

        {/* ── Право: кнопка виходу (завжди видима) ── */}
        <button
          type="button"
          onClick={handleLogout}
          title="Вийти"
          className="shrink-0 flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 hover:shadow-md sm:px-4"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Вийти</span>
        </button>
      </div>

      {/* ── Другий рядок: користувач + бейдж + тема ── */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 dark:border-slate-700">
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-100">
              {displayName || roleLabel}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{roleLabel}</p>
          </div>
          {criticalRawCount > 0 && (
            <span className="shrink-0 flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-200">
              <ExclamationTriangleIcon className="w-3.5 h-3.5" />
              {criticalRawCount}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          className="shrink-0 flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 sm:text-sm"
        >
          {theme === 'dark'
            ? <><SunIcon className="w-4 h-4" /><span>Світла</span></>
            : <><MoonIcon className="w-4 h-4" /><span>Темна</span></>}
        </button>
      </div>
    </header>
  )
}

export default Header
