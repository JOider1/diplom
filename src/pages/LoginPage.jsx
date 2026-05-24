import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ login: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const result = await login(form.login, form.password)
    if (!result.ok) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }
    const redirectTo = location.state?.from?.pathname || '/dashboard'
    navigate(redirectTo, { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-enterprise-50 px-4 py-8 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 sm:py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center sm:mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-enterprise-700 dark:text-enterprise-300">
            Комбікормовий завод
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">Digital Shift Journal</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Обліковий запис для доступу до системи</p>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-800 sm:p-8">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Вхід у систему</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Введіть логін та пароль, видані адміністратором.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Логін
              <input
                type="text"
                autoComplete="username"
                required
                value={form.login}
                onChange={(event) => setForm((prev) => ({ ...prev, login: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-800 outline-none ring-enterprise-600 focus:border-enterprise-600 focus:ring-2 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
                placeholder="admin"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Пароль
              <input
                type="password"
                autoComplete="current-password"
                required
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-800 outline-none ring-enterprise-600 focus:border-enterprise-600 focus:ring-2 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
                placeholder="••••••••"
              />
            </label>

            {error ? (
              <p
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-enterprise-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-enterprise-800 disabled:opacity-60"
            >
              {isSubmitting ? 'Вхід…' : 'Увійти'}
            </button>
          </form>

          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
            <p className="font-semibold text-slate-700 dark:text-slate-100">Демо-облікові записи:</p>
            <ul className="mt-2 space-y-1">
              <li><span className="font-medium">admin</span> / admin123 — адміністратор</li>
              <li><span className="font-medium">manager</span> / manager123 — менеджер зміни</li>
              <li><span className="font-medium">operator</span> / operator123 — оператор</li>
              <li><span className="font-medium">accountant</span> / accountant123 — бухгалтер</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}

export default LoginPage
