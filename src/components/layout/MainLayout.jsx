import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'

function MainLayout() {
  return (
    <div className="min-h-screen lg:flex">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-6">
        <Header />
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
