import { createContext, useContext, useMemo, useState } from 'react'

const RoleContext = createContext(null)

const ROLE_OPTIONS = [
  { label: 'Адміністратор', value: 'admin' },
  { label: 'Менеджер зміни', value: 'shift-manager' },
  { label: 'Оператор', value: 'operator' },
]

export function RoleProvider({ children }) {
  const [role, setRole] = useState('admin')

  const contextValue = useMemo(
    () => ({
      role,
      setRole,
      roleOptions: ROLE_OPTIONS,
    }),
    [role],
  )

  return <RoleContext.Provider value={contextValue}>{children}</RoleContext.Provider>
}

export function useRole() {
  const context = useContext(RoleContext)
  if (!context) {
    throw new Error('useRole must be used inside RoleProvider')
  }
  return context
}
