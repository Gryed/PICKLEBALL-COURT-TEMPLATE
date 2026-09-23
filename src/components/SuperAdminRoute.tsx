import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SuperAdminRoute({ children }: { children: ReactNode }) {
  const { user, platformRole, loading } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (platformRole !== 'super_admin') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
