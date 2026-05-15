import { useMemo, useState } from 'react'
import ConfirmModal from '../components/common/ConfirmModal'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { ROLE_OPTIONS } from '../data/users'

const defaultUser = {
  login: '',
  password: '',
  displayName: '',
  role: 'operator',
}

const actionBtn =
  'rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600'
const dangerBtn =
  'rounded-md border border-red-300 bg-white px-2 py-1 text-xs text-red-700 hover:bg-red-50 dark:border-red-700 dark:bg-slate-700 dark:text-red-300 dark:hover:bg-red-950/40'
const successBtn =
  'rounded-md border border-emerald-300 bg-white px-2 py-1 text-xs text-emerald-800 hover:bg-emerald-50 dark:border-emerald-600 dark:bg-slate-700 dark:text-emerald-300 dark:hover:bg-emerald-950/40'

function UsersAdminPage() {
  const { userId: currentUserId } = useAuth()
  const { users, addUser, updateUser, setUserActive } = useAppData()
  const [formData, setFormData] = useState(defaultUser)
  const [editingId, setEditingId] = useState(null)
  const [deactivateId, setDeactivateId] = useState(null)
  const [formError, setFormError] = useState('')

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.displayName.localeCompare(b.displayName, 'uk-UA')),
    [users],
  )

  const handleSubmit = (event) => {
    event.preventDefault()
    setFormError('')

    if (editingId) {
      const patch = {
        login: formData.login,
        displayName: formData.displayName,
        role: formData.role,
      }
      if (formData.password.trim()) {
        patch.password = formData.password
      }
      const result = updateUser(editingId, patch)
      if (!result.ok) {
        setFormError(result.error)
        return
      }
      setEditingId(null)
    } else {
      const result = addUser(formData)
      if (!result.ok) {
        setFormError(result.error)
        return
      }
    }

    setFormData(defaultUser)
  }

  const startEdit = (user) => {
    setEditingId(user.id)
    setFormData({
      login: user.login,
      password: '',
      displayName: user.displayName,
      role: user.role,
    })
    setFormError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData(defaultUser)
    setFormError('')
  }

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Користувачі системи</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Створення та редагування облікових записів. Пароль при редагуванні залиште порожнім, якщо не змінюєте.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-3 rounded-lg border border-slate-300 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800 md:grid-cols-2 lg:grid-cols-5"
      >
        <input
          required
          placeholder="Логін"
          value={formData.login}
          onChange={(event) => setFormData((prev) => ({ ...prev, login: event.target.value }))}
          className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
        />
        <input
          type="password"
          required={!editingId}
          placeholder={editingId ? 'Новий пароль (необовʼязково)' : 'Пароль'}
          value={formData.password}
          onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
          className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
        />
        <input
          required
          placeholder="ПІБ / відображуване імʼя"
          value={formData.displayName}
          onChange={(event) => setFormData((prev) => ({ ...prev, displayName: event.target.value }))}
          className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 md:col-span-2"
        />
        <select
          value={formData.role}
          onChange={(event) => setFormData((prev) => ({ ...prev, role: event.target.value }))}
          className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <>
          {formError ? (
            <p className="text-sm text-red-600 dark:text-red-300 md:col-span-5">{formError}</p>
          ) : null}
          <div className="flex flex-wrap gap-2 md:col-span-5">
            <button
              type="submit"
              className="rounded-md bg-enterprise-700 px-4 py-2 text-sm font-semibold text-white hover:bg-enterprise-800"
            >
              {editingId ? 'Зберегти зміни' : 'Створити користувача'}
            </button>
            {editingId ? (
              <button type="button" onClick={cancelEdit} className={actionBtn}>
                Скасувати
              </button>
            ) : null}
          </div>
        </>
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-300 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-800">
        <table className="min-w-full text-left text-sm text-slate-700 dark:text-slate-200">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            <tr>
              <th className="px-4 py-3">Логін</th>
              <th className="px-4 py-3">Імʼя</th>
              <th className="px-4 py-3">Роль</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Дії</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((user) => (
              <tr key={user.id} className="border-t border-slate-200 dark:border-slate-600">
                <td className="px-4 py-3 font-medium">{user.login}</td>
                <td className="px-4 py-3">{user.displayName}</td>
                <td className="px-4 py-3">
                  {ROLE_OPTIONS.find((option) => option.value === user.role)?.label ?? user.role}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      user.active
                        ? 'rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
                        : 'rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-600 dark:text-slate-300'
                    }
                  >
                    {user.active ? 'Активний' : 'Деактивований'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => startEdit(user)} className={actionBtn}>
                      Редагувати
                    </button>
                    {user.active && user.id !== currentUserId ? (
                      <button type="button" onClick={() => setDeactivateId(user.id)} className={dangerBtn}>
                        Деактивувати
                      </button>
                    ) : null}
                    {!user.active ? (
                      <button type="button" onClick={() => setUserActive(user.id, true)} className={successBtn}>
                        Активувати
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deactivateId ? (
        <ConfirmModal
          title="Деактивувати користувача?"
          message="Користувач не зможе увійти, доки обліковий запис не буде знову активовано."
          onCancel={() => setDeactivateId(null)}
          onConfirm={() => {
            setUserActive(deactivateId, false)
            setDeactivateId(null)
          }}
        />
      ) : null}
    </section>
  )
}

export default UsersAdminPage
