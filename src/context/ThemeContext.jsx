import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(null)
const STORAGE_KEY = 'diplom-theme'

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() =>
    typeof window === 'undefined' ? 'light' : localStorage.getItem(STORAGE_KEY) || 'light',
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/* eslint-disable-next-line react-refresh/only-export-components */
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used inside ThemeProvider')
  }
  return ctx
}
