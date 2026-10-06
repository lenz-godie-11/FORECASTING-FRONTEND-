import { cx, fmtPct } from '../utils/format.js'
import Badge from './Badge.jsx'

const SEVERITY_TONE = { high: 'error', warning: 'warning', info: 'info' }
const SEVERITY_LABEL = { high: 'High', warning: 'Watch', info: 'Info' }

/** One forecast-based high-demand alert. */
export default function AlertItem({ alert }) {
  const tone = SEVERITY_TONE[alert.severity] ?? 'neutral'
  return (
    <article className={cx('alert-item', alert.severity === 'high' && 'alert-item--high')}>
      <span
        className={cx('alert-item__severity', `alert-item__severity--${alert.severity}`)}
        aria-hidden="true"
      />
      <div>
        <h3 className="alert-item__title">
          {alert.title}
          <Badge tone={tone}>{SEVERITY_LABEL[alert.severity] ?? alert.severity}</Badge>
        </h3>
        <p className="alert-item__detail">{alert.detail}</p>
        {alert.contextPct != null && alert.contextPct >= 0 ? (
          <p className="alert-item__meta">
            {fmtPct(alert.contextPct)} above the recent daily average
          </p>
        ) : null}
      </div>
    </article>
  )
}
