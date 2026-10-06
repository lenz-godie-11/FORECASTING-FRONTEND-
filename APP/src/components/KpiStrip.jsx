import { cx } from '../utils/format.js'

/**
 * KPI strip: one bordered strip split into cells by hairlines
 * (Carbon's stat treatment), not a row of separate cards.
 *
 * cells: [{ label, value, unit, sub, alert }]
 */
export default function KpiStrip({ cells, loading }) {
  return (
    <div className={cx('kpi-strip', loading && 'kpi-strip--loading')} aria-busy={loading || undefined}>
      {cells.map((cell) => (
        <div key={cell.label} className={cx('kpi-cell', cell.alert && 'kpi-cell--alert')}>
          <div className="kpi-cell__label">{cell.label}</div>
          <div className="kpi-cell__value num">
            {loading ? '—' : cell.value}
            {cell.unit ? <span className="unit">{cell.unit}</span> : null}
          </div>
          <div className="kpi-cell__sub">{loading ? ' ' : cell.sub}</div>
        </div>
      ))}
    </div>
  )
}
