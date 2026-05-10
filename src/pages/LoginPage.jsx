import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function LoginPage() {
  const { roleOptions, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedRole, setSelectedRole] = useState(roleOptions[0].value)

  const handleSubmit = (event) => {
    event.preventDefault()
    login(selectedRole)
    const redirectTo = location.state?.from?.pathname || '/dashboard'
    navigate(redirectTo, { replace: true })
  }

  return (
    <section className="mx-auto mt-16 max-w-md rounded-lg border border-slate-300 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-800">Вхід у систему</h2>
      <p className="mt-1 text-sm text-slate-600">Оберіть роль, щоб відкрити робочий інтерфейс.</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Роль користувача
          <select
            value={selectedRole}
            onChange={(event) => setSelectedRole(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="w-full rounded-md bg-enterprise-700 px-4 py-2 text-sm font-semibold text-white hover:bg-enterprise-800"
        >
          Увійти
        </button>
      </form>
    </section>
  )
}

export default LoginPage
