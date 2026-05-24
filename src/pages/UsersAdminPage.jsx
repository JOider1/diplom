import { useMemo, useState } from 'react'
import ConfirmModal from '../components/common/ConfirmModal'
import PageHero from '../components/common/PageHero'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { ROLE_OPTIONS } from '../data/users'

const defaultCreate = {
  login: '',
  password: '',
  displayName: '',
  role: 'operator',
}

const defaultEdit = { displayName: '', role: 'operator' }

const actionBtn =
  'rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600'
const dangerBtn =
  'rounded-md border border-red-300 bg-white px-2 py-1 text-xs text-red-700 hover:bg-red-50 dark:border-red-700 dark:bg-slate-700 dark:text-red-300 dark:hover:bg-red-950/40'
const successBtn =
  'rounded-md border border-emerald-300 bg-white px-2 py-1 text-xs text-emerald-800 hover:bg-emerald-50 dark:border-emerald-600 dark:bg-slate-700 dark:text-emerald-300 dark:hover:bg-emerald-950/40'
const warnBtn =
  'rounded-md border border-amber-300 bg-white px-2 py-1 text-xs text-amber-800 hover:bg-amber-50 dark:border-amber-600 dark:bg-slate-700 dark:text-amber-200 dark:hover:bg-amber-950/40'

function UsersAdminPage() {
  const { userId: currentUserId } = useAuth()
  const { users, addUser, updateUser, setUserActive, setUserPassword, deleteUser } = useAppData()

  // ── форма створення ──
  const [createForm, setCreateForm] = useState(defaultCreate)
  const [createError, setCreateError] = useState('')
  const [createBusy, setCreateBusy] = useState(false)
  const [createSuccess, setCreateSuccess] = useState('')

  // ── редагування ──
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(defaultEdit)
  const [editError, setEditError] = useState('')

  // ── модалки підтвердження ──
  const [deactivateId, setDeactivateId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  // ── скидання пароля ──
  const [pwdUser, setPwdUser] = useState(null) // обʼєкт юзера
  const [pwdNew, setPwdNew] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [pwdBusy, setPwdBusy] = useState(false)

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.displayName.localeCompare(b.displayName, 'uk-UA')),
    [users],
  )

  const handleCreateSubmit = async (event) => {
    event.preventDefault()
    setCreateError('')
    setCreateSuccess('')
    if (createForm.password.length < 6) {
      setCreateError('Пароль має бути не коротший за 6 символів')
      return
    }
    setCreateBusy(true)
    const result = await addUser(createForm)
    setCreateBusy(false)
    if (!result.ok) {
      setCreateError(result.error)
      return
    }
    setCreateSuccess(`Користувача "${createForm.login}" створено.`)
    setCreateForm(defaultCreate)
  }

  const startEdit = (user) => {
    setEditingId(user.id)
    setEditForm({ displayName: user.displayName, role: user.role })
    setEditError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm(defaultEdit)
    setEditError('')
  }

  const handleEditSubmit = async (event) => {
    event.preventDefault()
    setEditError('')
    if (!editingId) return
    const result = await updateUser(editingId, {
      displayName: editForm.displayName.trim(),
      role: editForm.role,
    })
    if (!result.ok) {
      setEditError(result.error)
      return
    }
    cancelEdit()
  }

  const openPwdModal = (user) => {
    setPwdUser(user)
    setPwdNew('')
    setPwdError('')
  }

  const handlePwdSubmit = async (event) => {
    event.preventDefault()
    setPwdError('')
    if (pwdNew.length < 6) {
      setPwdError('Пароль має бути не коротший за 6 символів')
      return
    }
    setPwdBusy(true)
    const result = await setUserPassword(pwdUser.id, pwdNew)
    setPwdBusy(false)
    if (!result.ok) {
      setPwdError(result.error)
      return
    }
    setPwdUser(null)
    setPwdNew('')
  }

  return (
    <section className="space-y-4">
      <PageHero
        title="Користувачі системи"
        subtitle={`${sortedUsers.length} облікових записів · створення, ролі, паролі, деактивація`}
      />


      {/* ── СТВОРЕННЯ ── */}
      <form
        onSubmit={handleCreateSubmit}
        className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-600 dark:bg-slate-800"
      >
        <div className="mb-4 border-b border-slate-200 pb-3 dark:border-slate-700">
          <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">Новий користувач</h4>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Логін + пароль для входу. ПІБ і роль використовуються в інтерфейсі.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Логін
            <input
              required
              placeholder="наприклад, manager"
              value={createForm.login}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, login: event.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
            />
          </label>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Пароль
            <input
              required
              type="password"
              placeholder="мін. 6 символів"
              minLength={6}
              value={createForm.password}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
            />
          </label>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Роль
            <select
              value={createForm.role}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, role: event.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 md:col-span-2 lg:col-span-1">
            ПІБ / відображуване імʼя
            <input
              required
              placeholder="Іван Петренко"
              value={createForm.displayName}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, displayName: event.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
            />
          </label>
        </div>

        {createError ? (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">
            {createError}
          </p>
        ) : null}
        {createSuccess ? (
          <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
            {createSuccess}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={createBusy}
            className="rounded-lg bg-enterprise-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-enterprise-800 disabled:opacity-60"
          >
            {createBusy ? 'Створення…' : '+ Створити користувача'}
          </button>
          <button
            type="button"
            onClick={() => {
              setCreateForm(defaultCreate)
              setCreateError('')
              setCreateSuccess('')
            }}
            className={actionBtn}
          >
            Очистити форму
          </button>
        </div>
      </form>

      {/* ── ФОРМА РЕДАГУВАННЯ ── */}
      {editingId && (
        <form
          onSubmit={handleEditSubmit}
          className="grid gap-3 rounded-lg border border-blue-300 bg-blue-50 p-4 shadow-sm dark:border-blue-700 dark:bg-blue-950/30 md:grid-cols-3"
        >
          <p className="md:col-span-3 text-sm font-semibold text-blue-900 dark:text-blue-100">
            Редагування користувача
          </p>
          <input
            required
            placeholder="ПІБ / відображуване імʼя"
            value={editForm.displayName}
            onChange={(event) => setEditForm((prev) => ({ ...prev, displayName: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 md:col-span-2"
          />
          <select
            value={editForm.role}
            onChange={(event) => setEditForm((prev) => ({ ...prev, role: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {editError ? (
            <p className="text-sm text-red-600 dark:text-red-300 md:col-span-3">{editError}</p>
          ) : null}
          <div className="flex flex-wrap gap-2 md:col-span-3">
            <button
              type="submit"
              className="rounded-md bg-enterprise-700 px-4 py-2 text-sm font-semibold text-white hover:bg-enterprise-800"
            >
              Зберегти
            </button>
            <button type="button" onClick={cancelEdit} className={actionBtn}>
              Скасувати
            </button>
          </div>
        </form>
      )}

      {/* ── ТАБЛИЦЯ ── */}
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
                    <button type="button" onClick={() => openPwdModal(user)} className={warnBtn}>
                      Пароль
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
                    {user.id !== currentUserId ? (
                      <button type="button" onClick={() => setDeleteId(user.id)} className={dangerBtn}>
                        Видалити
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {sortedUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  Користувачів ще немає.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── МОДАЛКА: ДЕАКТИВАЦІЯ ── */}
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

      {/* ── МОДАЛКА: ВИДАЛЕННЯ ── */}
      {deleteId ? (
        <ConfirmModal
          title="Видалити користувача назавжди?"
          message="Обліковий запис буде повністю видалено з бази даних. Цю дію не можна скасувати."
          onCancel={() => setDeleteId(null)}
          onConfirm={async () => {
            const id = deleteId
            setDeleteId(null)
            await deleteUser(id)
          }}
        />
      ) : null}

      {/* ── МОДАЛКА: СКИДАННЯ ПАРОЛЯ ── */}
      {pwdUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handlePwdSubmit}
            className="w-full max-w-md rounded-lg border border-slate-300 bg-white p-5 shadow-xl dark:border-slate-600 dark:bg-slate-800"
          >
            <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              Новий пароль для {pwdUser.login}
            </h4>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Після збереження користувач зможе одразу увійти з новим паролем.
            </p>
            <input
              type="password"
              required
              minLength={6}
              autoFocus
              placeholder="Новий пароль (мін. 6 символів)"
              value={pwdNew}
              onChange={(event) => setPwdNew(event.target.value)}
              className="mt-4 w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
            />
            {pwdError ? (
              <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">
                {pwdError}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setPwdUser(null)} className={actionBtn}>
                Скасувати
              </button>
              <button
                type="submit"
                disabled={pwdBusy}
                className="rounded-md bg-enterprise-700 px-4 py-2 text-sm font-semibold text-white hover:bg-enterprise-800 disabled:opacity-60"
              >
                {pwdBusy ? 'Збереження…' : 'Зберегти пароль'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  )
}

export default UsersAdminPage
