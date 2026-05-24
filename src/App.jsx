import { Navigate, Route, Routes } from 'react-router-dom'
import PrivateRoute from './components/auth/PrivateRoute'
import MainLayout from './components/layout/MainLayout'
import { AppDataProvider } from './context/AppDataContext'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import DashboardPage from './pages/DashboardPage'
import DailyOverviewPage from './pages/DailyOverviewPage'
import EquipmentPage from './pages/EquipmentPage'
import IncidentsPage from './pages/IncidentsPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import ProductionJournalPage from './pages/ProductionJournalPage'
import RecipesPage from './pages/RecipesPage'
import ReportsPage from './pages/ReportsPage'
import ShiftManagementPage from './pages/ShiftManagementPage'
import AuditLogPage from './pages/AuditLogPage'
import UsersAdminPage from './pages/UsersAdminPage'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppDataProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <MainLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="daily-overview" element={<DailyOverviewPage />} />
              <Route
                path="shift-management"
                element={
                  <PrivateRoute allowedRoles={['admin', 'shift-manager']}>
                    <ShiftManagementPage />
                  </PrivateRoute>
                }
              />
              <Route path="production-journal" element={<ProductionJournalPage />} />
              <Route
                path="incidents"
                element={
                  <PrivateRoute allowedRoles={['admin', 'shift-manager', 'operator']}>
                    <IncidentsPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="recipes"
                element={
                  <PrivateRoute allowedRoles={['admin', 'shift-manager', 'accountant']}>
                    <RecipesPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="reports"
                element={
                  <PrivateRoute allowedRoles={['admin', 'shift-manager', 'accountant']}>
                    <ReportsPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="equipment"
                element={
                  <PrivateRoute allowedRoles={['admin', 'shift-manager', 'operator']}>
                    <EquipmentPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="users"
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <UsersAdminPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="audit-log"
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <AuditLogPage />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AppDataProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
