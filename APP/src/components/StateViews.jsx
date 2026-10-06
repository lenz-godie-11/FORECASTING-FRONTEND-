import { Button } from './Button.jsx'
import Icon from './Icon.jsx'

export function LoadingRow({ label }) {
  return (
    <div className="loading-row" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

/**
 * Empty state: no data yet, or nothing matches.
 * Names the situation and the recovery action.
 */
export function EmptyState({ icon = 'database', title, text, actions, className }) {
  return (
    <div className={className} role="status">
      <div className="state">
        <span className="state__icon" aria-hidden="true">
          <Icon name={icon} size={28} />
        </span>
        <h3 className="state__title">{title}</h3>
        {text ? <p className="state__text">{text}</p> : null}
        {actions ? <div className="state__actions">{actions}</div> : null}
      </div>
    </div>
  )
}

/**
 * API / data error state. Shows the problem and the recovery (retry),
 * and never falls back to mock data silently.
 */
export function ErrorState({ error, onRetry, retryLabel = 'Try again', extra }) {
  const message =
    error?.message && error.name !== 'ApiUnavailableError'
      ? error.message
      : 'The AfyaFlow API is unreachable. Check that the Django backend is running and that VITE_API_BASE_URL points to it.'
  return (
    <div role="alert">
      <div className="state state--filled">
        <span className="state__icon" aria-hidden="true">
          <Icon name="warning" size={28} />
        </span>
        <h3 className="state__title">We could not load this data</h3>
        <p className="state__text">{message}</p>
        {extra ? <p className="state__text">{extra}</p> : null}
        {onRetry ? (
          <div className="state__actions">
            <Button variant="tertiary" icon="refresh" onClick={onRetry}>
              {retryLabel}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
