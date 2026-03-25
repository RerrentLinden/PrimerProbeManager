import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import AppLayout from '@/components/Layout/AppLayout'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import LoginPage from '@/pages/LoginPage'
import PrimerListPage from '@/pages/PrimerListPage'
import PrimerDetailPage from '@/pages/PrimerDetailPage'
import StoragePage from '@/pages/StoragePage'
import SearchResultsPage from '@/pages/SearchResultsPage'
import ImportPage from '@/pages/ImportPage'
import ProjectListPage from '@/pages/ProjectListPage'
import ProjectDetailPage from '@/pages/ProjectDetailPage'
import TubeLifecycleLogsPage from '@/pages/TubeLifecycleLogsPage'

function ProtectedRoutes() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <LoadingSpinner size="lg" />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <AppLayout />
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoutes />}>
        <Route path="/primers" element={<PrimerListPage />} />
        <Route path="/primers/:id" element={<PrimerDetailPage />} />
        <Route path="/storage" element={<StoragePage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/logs" element={<TubeLifecycleLogsPage />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/projects" element={<ProjectListPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/" element={<Navigate to="/primers" replace />} />
      </Route>
    </Routes>
  )
}
