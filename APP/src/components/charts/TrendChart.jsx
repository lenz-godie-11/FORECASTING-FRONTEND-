import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fmtDateShort, fmtInt } from '../../utils/format.js'
import ChartTip from './ChartTip.jsx'

/**
 * Demand trend: raw daily observations (grey) against a 7-day moving
 * average (blue) — the smoothing a weekly-seasonal model is built on.
 */
export default function TrendChart({ observed = [], movingAverage = [], height = 320 }) {
  const map = new Map()
  for (const point of observed) map.set(point.date, { date: point.date, observed: point.patients })
  for (const point of movingAverage) {
    const entry = map.get(point.date) ?? { date: point.date }
    map.set(point.date, { ...entry, avg: point.avg })
  }
  const data = [...map.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({ ...d, label: fmtDateShort(d.date) }))
  const values = data.flatMap((d) => [d.observed, d.avg]).filter((v) => v != null)
  const yMin = Math.max(0, Math.floor((Math.min(...values, 999) - 10) / 10) * 10)
  const yMax = Math.ceil((Math.max(...values, 0) + 10) / 10) * 10

  return (
    <figure className="chart" style={{ height }}>
      <figcaption className="sr-only">
        Line chart of observed daily patients and their 7-day moving average, {data.length} days.
      </figcaption>
      <div className="chart__legend" role="presentation">
        <span className="chart__legend-item">
          <span className="chart__swatch chart__swatch--observed" aria-hidden="true" />
          Daily observed
        </span>
        <span className="chart__legend-item">
          <span className="chart__swatch chart__swatch--avg" aria-hidden="true" />
          7-day moving average
        </span>
      </div>
      <ResponsiveContainer width="100%" height={height - 36}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="#e0e0e0" />
          <XAxis dataKey="label" tickLine={false} tickMargin={8} interval="preserveStartEnd" minTickGap={48} />
          <YAxis domain={[yMin, yMax]} tickLine={false} axisLine={false} width={44} tickCount={5} allowDecimals={false} />
          <Tooltip
            content={
              <ChartTip formatter={(v, name) => `${fmtInt(v)}${name === '7-day average' ? '' : ' patients'}`} />
            }
          />
          <Line
            type="monotone"
            dataKey="observed"
            name="Daily observed"
            stroke="#8c8c8c"
            strokeWidth={1}
            dot={false}
            activeDot={{ r: 3 }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="avg"
            name="7-day average"
            stroke="#0f62fe"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </figure>
  )
}
