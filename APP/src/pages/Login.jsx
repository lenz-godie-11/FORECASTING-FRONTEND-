import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button.jsx'
import Icon from '../components/Icon.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useSettings } from '../hooks/useSettings.js'
import { buildDemoSession } from '../services/demoSession.js'

export default function Login() {
  const { isAuthenticated, login, signInDemo } = useAuth()
  const [settings, updateSettings] = useSettings()
  const location = useLocation()
  const navigate = useNavigate()
  const from = location.state?.from ?? '/'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [demoMode, setDemoMode] = useState(settings.demo)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  if (isAuthenticated) return <Navigate to={from} replace />

  async function handleSubmit(event) {
    event.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('Enter your username (or email) and password to sign in.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      if (demoMode) {
        updateSettings({ demo: true })
        signInDemo(buildDemoSession(username))
      } else {
        updateSettings({ demo: false })
        await login({ username: username.trim(), password })
      }
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Sign in failed. Check your credentials and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login">
      <div className="login__brand">
        <img src="/favicon.svg" alt="" className="login__mark" width={56} height={56} />
        <div>
          <div className="login__name">AfyaFlow AI</div>
          <p className="login__tag">
            Patient-demand forecasting and operations planning for healthcare facilities
          </p>
        </div>
      </div>

      <div className="login__card">
        <h1>Sign in</h1>
        <form className="login__form" onSubmit={handleSubmit} noValidate>
          {error ? (
            <div className="notice notice--error" role="alert">
              <Icon name="warning" size={16} />
              <span>{error}</span>
            </div>
          ) : null}
          <div className="field">
            <label className="field__label" htmlFor="login-username">
              <strong>Username or email</strong>
            </label>
            <input
              id="login-username"
              className="input"
              value={username}
              autoComplete="username"
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="login-password">
              <strong>Password</strong>
            </label>
            <input
              id="login-password"
              type="password"
              className="input"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <label className="check">
            <input
              type="checkbox"
              checked={demoMode}
              onChange={(e) => setDemoMode(e.target.checked)}
            />
            <span>
              Use demo data — explore the console without the backend. The demo data set is
              synthetic and clearly labelled wherever it appears.
            </span>
          </label>
          <Button type="submit" block busy={busy} icon={busy ? undefined : demoMode ? 'pulse' : undefined}>
            {busy ? 'Signing in…' : demoMode ? 'Continue with demo data' : 'Sign in'}
          </Button>
        </form>
      </div>

      <p className="login__foot">
        AfyaFlow AI connects to your facility&rsquo;s Django REST API. Credentials are validated
        server-side; a JWT session is kept in this browser only.
      </p>
    </div>
  )
}
