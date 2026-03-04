import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AccessDenied from './AccessDenied'

/**
 * ProtectedRoute component for authentication and authorization
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Component to render if authorized
 * @param {Array<string>} props.roles - Optional array of allowed roles
 * 
 * @example
 * <ProtectedRoute roles={["admin"]}>
 *   <AdminDashboard />
 * </ProtectedRoute>
 */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, isLoading, role } = useAuth()

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check role-based access if roles prop is provided
  if (roles && Array.isArray(roles)) {
    const hasRequiredRole = roles.includes(role)

    if (!hasRequiredRole) {
      return <AccessDenied />
    }
  }

  return children
}
