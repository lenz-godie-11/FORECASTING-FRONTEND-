import Badge from '../components/Badge.jsx'
import Icon from '../components/Icon.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useSettings } from '../hooks/useSettings.js'

export default function Header({ onMenuToggle, open }) {
  const { user, logout } = useAuth()
  const [settings] = useSettings()

  return (
    <header className="header">
      <button
        type="button"
        className="icon-button header__menu"
        onClick={onMenuToggle}
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        aria-expanded={open}
      >
        <Icon name="menu" />
      </button>
      <span className="header__facility">{settings.facility}</span>
      <span className="header__context">Operations console</span>
      <span className="header__spacer" aria-hidden="true" />
      {settings.demo ? <Badge tone="warning">Demo data</Badge> : null}
      <span className="header__user">
        <span className="header__user-label">{user?.name ?? '—'}</span>
        <button
          type="button"
          className="icon-button"
          onClick={logout}
          aria-label="Sign out"
          title="Sign out"
        >
          <Icon name="logout" />
        </button>
      </span>
    </header>
  )
}
