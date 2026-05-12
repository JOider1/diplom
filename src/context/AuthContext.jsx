import { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)
const STORAGE_KEY = 'diplom-auth-role'

const ROLE_OPTIONS = [
  { label: 'Адміністратор', value: 'admin' },
  { label: 'Менеджер зміни', value: 'shift-manager' },
  { label: 'Оператор', value: 'operator' },
]

export function AuthProvider({ children }) {
  const [role, setRole] = useState(() => localStorage.getItem(STORAGE_KEY) || '')

  const login = (nextRole) => {
    localStorage.setItem(STORAGE_KEY, nextRole)
    setRole(nextRole)
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setRole('')
  }

  const roleLabel = useMemo(
    () => ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role ?? '—',
    [role],
  )

  const contextValue = useMemo(
    () => ({
      role,
      roleLabel,
      isAuthenticated: Boolean(role),
      roleOptions: ROLE_OPTIONS,
      login,
      logout,
    }),
    [role, roleLabel],
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

/* eslint-disable-next-line react-refresh/only-export-components */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
