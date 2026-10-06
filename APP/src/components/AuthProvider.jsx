import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from '../hooks/useAuth.js'
import { clearStoredAuth, loadStoredAuth, requestLogin, storeAuth } from '../services/auth.js'
import { setUnauthorizedHandler } from '../services/api.js'

/**
 * JWT session provider. Signs in against POST /api/v1/auth/login/,
 * persists the session locally, and clears it on any 401 response.
 */
export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => loadStoredAuth())

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearStoredAuth()
      setAuth(null)
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  /** Real sign-in against the Django auth endpoint. */
  const login = useCallback(async (credentials) => {
    const session = await requestLogin(credentials)
    storeAuth(session)
    setAuth(session)
    return session
  }, [])

  /** Locally-scoped demo session (explicit opt-in only). */
  const signInDemo = useCallback((session) => {
    setAuth(session)
  }, [])

  const logout = useCallback(() => {
    clearStoredAuth()
    setAuth(null)
  }, [])

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(auth?.token),
      user: auth?.user ?? null,
      token: auth?.token ?? null,
      isDemoSession: Boolean(auth?.demo),
      login,
      signInDemo,
      logout,
    }),
    [auth, login, signInDemo, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
