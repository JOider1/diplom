import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function NotFoundPage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="rounded-lg border border-slate-300 bg-white p-6 text-center shadow-sm">
      <h3 className="text-xl font-semibold text-slate-800">Сторінку не знайдено</h3>
      <p className="mt-2 text-sm text-slate-600">
        Перейдіть {isAuthenticated ? 'на головну сторінку дашборда' : 'на сторінку входу'}.
      </p>
      <Link
        to={isAuthenticated ? '/dashboard' : '/login'}
        className="mt-4 inline-block rounded-md bg-enterprise-700 px-4 py-2 text-sm font-semibold text-white"
      >
        {isAuthenticated ? 'На дашборд' : 'До входу'}
      </Link>
    </div>
  )
}

export default NotFoundPage
