import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import { useAppData } from '../../context/AppDataContext'

function MainLayout() {
  const { error: dataError, loading: dataLoading } = useAppData()
  const hasDataError = Boolean(dataError)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="min-w-0 flex-1 p-3 sm:p-4 lg:p-6">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {hasDataError && (
          <div className="mb-4 rounded-lg border-l-4 border-l-amber-600 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
            <p className="font-semibold">⚠ Помилка завантаження даних з Supabase</p>
            <p className="mt-1 break-all font-mono text-xs">{String(dataError)}</p>
            <p className="mt-1">
              Подивись <strong>DevTools → Console</strong> для деталей по кожному запиту.
            </p>
          </div>
        )}

        {dataLoading && !hasDataError && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-800 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-100">
            ⏳ Завантаження даних з Supabase…
          </div>
        )}

        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
