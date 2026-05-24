import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { rpcAppLogin } from '../lib/db'
import { ROLE_OPTIONS } from '../data/users'

const AuthContext = createContext(null)
const SESSION_KEY = 'dsj-session'

const readSession = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.id || !parsed?.login || !parsed?.role) return null
    return parsed
  } catch {
    return null
  }
}

const writeSession = (user) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  } catch {}
}

const clearSession = () => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(SESSION_KEY)
    // на всякий — чистимо застарілі Supabase-Auth токени
    const toRemove = []
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i)
      if (k && (k.startsWith('sb-') || k.toLowerCase().includes('supabase'))) {
        toRemove.push(k)
      }
    }
    toRemove.forEach((k) => window.localStorage.removeItem(k))
  } catch {}
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readSession())
  // authReady true одразу — нема асинхронного відновлення
  const [authReady] = useState(true)

  // login: викликає RPC, зберігає в localStorage
  const login = useCallback(async (loginValue, password) => {
    try {
      const u = await rpcAppLogin((loginValue || '').trim(), password || '')
      if (!u.active) {
        return { ok: false, error: 'Обліковий запис деактивовано' }
      }
      writeSession(u)
      setUser(u)
      return { ok: true, user: u }
    } catch (e) {
      const msg = e?.message || String(e)
      return { ok: false, error: msg }
    }
  }, [])

  // logout: чистить localStorage + редіректить
  const logout = useCallback(() => {
    clearSession()
    setUser(null)
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.replace('/login')
    }
  }, [])

  // refresh user data (наприклад після зміни ролі адміном)
  const refreshUser = useCallback(() => {
    setUser(readSession())
  }, [])

  const roleLabel = useMemo(
    () => ROLE_OPTIONS.find((option) => option.value === user?.role)?.label ?? '—',
    [user?.role],
  )

  const contextValue = useMemo(
    () => ({
      userId: user?.id ?? '',
      sessionUserId: user?.id ?? '',
      role: user?.role ?? '',
      displayName: user?.displayName ?? '',
      userLogin: user?.login ?? '',
      roleLabel,
      isAuthenticated: Boolean(user?.id),
      hasProfile: Boolean(user?.id),
      authReady,
      roleOptions: ROLE_OPTIONS,
      login,
      logout,
      refreshUser,
    }),
    [authReady, login, logout, refreshUser, roleLabel, user],
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
