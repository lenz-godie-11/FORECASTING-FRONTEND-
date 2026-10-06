import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

/**
 * Guard for every authenticated route. Unauthenticated visitors are sent
 * to /login with the intended destination; a 401 from the API clears the
 * session and the same guard routes them back to /login.
 */
export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
