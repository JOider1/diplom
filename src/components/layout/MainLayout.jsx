import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import { useAppData } from '../../context/AppDataContext'
import { ExclamationTriangleIcon, ArrowPathIcon } from '../common/Icons'

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
            <p className="flex items-center gap-1.5 font-semibold"><ExclamationTriangleIcon className="w-4 h-4 shrink-0" /> Помилка завантаження даних з Supabase</p>
            <p className="mt-1 break-all font-mono text-xs">{String(dataError)}</p>
            <p className="mt-1">
              Подивись <strong>DevTools → Console</strong> для деталей по кожному запиту.
            </p>
          </div>
        )}

        {dataLoading && !hasDataError && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-800 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-100">
            <span className="flex items-center gap-1.5"><ArrowPathIcon className="w-3.5 h-3.5 animate-spin" /> Завантаження даних з Supabase…</span>
          </div>
        )}

        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
