import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { MagnifyingGlassIcon } from '../components/common/Icons'

function NotFoundPage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="rounded-lg border border-slate-300 bg-white p-6 text-center shadow-sm dark:border-slate-600 dark:bg-slate-800">
      <MagnifyingGlassIcon className="mx-auto w-14 h-14 text-slate-400 dark:text-slate-500" />
      <h3 className="mt-3 text-xl font-semibold text-slate-800 dark:text-slate-100">Сторінку не знайдено</h3>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Перейдіть {isAuthenticated ? 'на головну сторінку дашборда' : 'на сторінку входу'}.
      </p>
      <Link
        to={isAuthenticated ? '/dashboard' : '/login'}
        className="mt-4 inline-block rounded-lg bg-enterprise-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-enterprise-800"
      >
        {isAuthenticated ? 'На дашборд' : 'До входу'}
      </Link>
    </div>
  )
}

export default NotFoundPage
