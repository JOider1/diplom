import { Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import { RoleProvider } from './context/RoleContext'
import DashboardPage from './pages/DashboardPage'
import IncidentsPage from './pages/IncidentsPage'
import NotFoundPage from './pages/NotFoundPage'
import ProductionJournalPage from './pages/ProductionJournalPage'
import ShiftManagementPage from './pages/ShiftManagementPage'

function App() {
  return (
    <RoleProvider>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="shift-management" element={<ShiftManagementPage />} />
          <Route path="production-journal" element={<ProductionJournalPage />} />
          <Route path="incidents" element={<IncidentsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </RoleProvider>
  )
}

export default App
