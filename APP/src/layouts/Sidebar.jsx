import { NavLink } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { cx } from '../utils/format.js'

const NAV = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/analytics', label: 'Analytics', icon: 'analytics' },
  { to: '/forecasts', label: 'Forecasts', icon: 'forecasts' },
  { to: '/resource-planning', label: 'Resource planning', icon: 'planning' },
  { to: '/alerts', label: 'Alerts', icon: 'alerts' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
  { to: '/help', label: 'Help', icon: 'help' },
]

export default function Sidebar({ open, onClose }) {
  return (
    <>
      <aside className={cx('sidebar', open && 'open')} aria-label="Primary">
        <div className="sidebar__brand">
          <img src="/favicon.svg" alt="" className="sidebar__logo" width={32} height={32} />
          <div>
            <div className="sidebar__name">AfyaFlow AI</div>
            <div className="sidebar__tagline">Patient demand forecasting</div>
          </div>
          <button
            type="button"
            className="icon-button sidebar__close"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <Icon name="close" />
          </button>
        </div>
        <nav className="sidebar__nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className="nav-item"
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__foot">
          <strong>ThetaModel</strong> · period 7
          <br />
          90-day daily forecast horizon
        </div>
      </aside>
      {open ? <div className="scrim" onClick={onClose} aria-hidden="true" /> : null}
    </>
  )
}
