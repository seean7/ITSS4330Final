import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useNetwork } from './context/NetworkContext'
import { navForRole, ROUTES } from './lib/access'
import BedMapPage from './pages/BedMapPage'
import ClientDetailPage from './pages/ClientDetailPage'
import ClientListPage from './pages/ClientListPage'
import DashboardPage from './pages/DashboardPage'
import IntakePage from './pages/IntakePage'
import LoginPage from './pages/LoginPage'
import QAPage from './pages/QAPage'
import Shell from './components/Shell'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useNetwork()
  if (!user) return <Navigate to={ROUTES.login} replace />
  return children
}

export default function App() {
  const { user } = useNetwork()
  const links = navForRole(user?.role)

  return (
    <Routes>
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <Shell navLinks={links}>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/map" element={<BedMapPage />} />
                <Route path="/intake" element={<IntakePage />} />
                <Route path="/clients" element={<ClientListPage />} />
                <Route path="/clients/:id" element={<ClientDetailPage />} />
                <Route path="/qa" element={<QAPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Shell>
          </RequireAuth>
        }
      />
    </Routes>
  )
}
