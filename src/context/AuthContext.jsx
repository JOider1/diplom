import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { ROLE_OPTIONS } from '../data/users'

const AuthContext = createContext(null)
const STORAGE_KEY = 'diplom-auth-session'
const LEGACY_KEY = 'diplom-auth-role'

function readSession() {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(LEGACY_KEY)) {
      localStorage.removeItem(LEGACY_KEY)
    }
    return readSession()
  })

  const login = useCallback((user) => {
    const nextSession = {
      userId: user.id,
      role: user.role,
      displayName: user.displayName,
      login: user.login,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession))
    setSession(nextSession)
    return { ok: true }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setSession(null)
  }, [])

  const roleLabel = useMemo(
    () => ROLE_OPTIONS.find((option) => option.value === session?.role)?.label ?? '—',
    [session?.role],
  )

  const contextValue = useMemo(
    () => ({
      userId: session?.userId ?? '',
      role: session?.role ?? '',
      displayName: session?.displayName ?? '',
      userLogin: session?.login ?? '',
      roleLabel,
      isAuthenticated: Boolean(session?.userId),
      roleOptions: ROLE_OPTIONS,
      login,
      logout,
    }),
    [login, logout, roleLabel, session],
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
