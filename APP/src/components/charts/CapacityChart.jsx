import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fmtDateShort, fmtInt } from '../../utils/format.js'
import ChartTip from './ChartTip.jsx'

/**
 * Resource-planning outlook: the next 7 predicted days as bars, with the
 * facility-entered capacity drawn as a horizontal rule. The peak day is
 * emphasised. Capacity is facility data, never a model output.
 */
export default function CapacityChart({ predictions = [], capacity, height = 300 }) {
  const days = predictions.slice(0, 7).map((p) => ({
    date: p.date,
    label: `${fmtWeekday(p.date)} ${fmtDateShort(p.date)}`,
    value: p.patients,
  }))
  const peak = days.reduce((best, d) => (d.value > (best?.value ?? 0) ? d : best), null)
  const values = days.map((d) => d.value)
  const yMax = Math.ceil((Math.max(...values, capacity ?? 0, 0) + 10) / 10) * 10
  const yMin = Math.max(0, Math.floor((Math.min(...values, 999) - 10) / 10) * 10)

  return (
    <figure className="chart" style={{ height }}>
      <figcaption className="sr-only">
        Bar chart of the next seven predicted days. The highest day is {peak?.label ?? 'unknown'} at{' '}
        {peak ? fmtInt(peak.value) : '—'} patients.
        {capacity ? ` Entered capacity is ${fmtInt(capacity)}.` : ''}
      </figcaption>
      <div className="chart__legend" role="presentation">
        <span className="chart__legend-item">
          <span className="chart__swatch chart__swatch--block chart__swatch--block-muted" aria-hidden="true" />
          Predicted patients
        </span>
        <span className="chart__legend-item">
          <span className="chart__swatch chart__swatch--block chart__swatch--block-peak" aria-hidden="true" />
          Peak day
        </span>
        {capacity ? (
          <span className="chart__legend-item">
            <span className="chart__swatch" style={{ background: '#161616' }} aria-hidden="true" />
            Entered capacity
          </span>
        ) : null}
      </div>
      <ResponsiveContainer width="100%" height={height - 36}>
        <BarChart data={days} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="#e0e0e0" />
          <XAxis dataKey="label" tickLine={false} tickMargin={8} interval={0} tick={{ fontSize: 10 }} />
          <YAxis domain={[yMin, yMax]} tickLine={false} axisLine={false} width={44} tickCount={5} allowDecimals={false} />
          <Tooltip content={<ChartTip />} cursor={{ fill: '#f4f4f4' }} />
          {capacity ? (
            <ReferenceLine
              y={capacity}
              stroke="#161616"
              strokeDasharray="4 4"
              label={{ value: 'Entered capacity', position: 'insideTopLeft', fontSize: 11, fill: '#525252' }}
            />
          ) : null}
          <Bar dataKey="value" name="Predicted" isAnimationActive={false}>
            {days.map((d) => (
              <Cell key={d.date} fill={d.date === peak?.date ? '#0f62fe' : '#c6c6c6'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </figure>
  )
}

function fmtWeekday(iso) {
  const d = new Date(`${iso}T12:00:00`)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { weekday: 'short' })
}
