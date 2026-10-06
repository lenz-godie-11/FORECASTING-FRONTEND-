import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fmtInt } from '../../utils/format.js'
import ChartTip from './ChartTip.jsx'

/**
 * Average daily patients by weekday (Mon–Sun) computed from logged
 * observations. The busiest weekday is emphasised in the single accent.
 */
export default function WeekdayBars({ data = [], height = 300 }) {
  const peak = data.reduce((best, d) => (d.avg > (best?.avg ?? 0) ? d : best), null)
  return (
    <figure className="chart" style={{ height }}>
      <figcaption className="sr-only">
        Bar chart of average daily patients by weekday. The busiest weekday is{' '}
        {peak?.label ?? 'unknown'} at {peak ? fmtInt(peak.avg) : '—'} patients.
      </figcaption>
      <div className="chart__legend" role="presentation">
        <span className="chart__legend-item">
          <span className="chart__swatch chart__swatch--block chart__swatch--block-muted" aria-hidden="true" />
          Weekday average
        </span>
        <span className="chart__legend-item">
          <span className="chart__swatch chart__swatch--block chart__swatch--block-peak" aria-hidden="true" />
          Busiest day
        </span>
      </div>
      <ResponsiveContainer width="100%" height={height - 36}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="#e0e0e0" />
          <XAxis dataKey="label" tickLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} width={44} tickCount={5} allowDecimals={false} />
          <Tooltip content={<ChartTip valueSuffix=" patients/day" />} cursor={{ fill: '#f4f4f4' }} />
          <Bar dataKey="avg" name="Average" isAnimationActive={false}>
            {data.map((entry) => (
              <Cell key={entry.label} fill={entry.label === peak?.label ? '#0f62fe' : '#c6c6c6'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </figure>
  )
}
