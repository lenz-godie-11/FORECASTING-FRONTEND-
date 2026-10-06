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
import ChartTip from './ChartTip.jsx'

/** Weekly patient totals per ISO week, most recent week emphasised. */
export default function WeeklyTotalsChart({ data = [], height = 300 }) {
  const values = data.map((d) => d.total)
  const yMax = Math.ceil((Math.max(...values, 0) + 40) / 40) * 40
  return (
    <figure className="chart" style={{ height }}>
      <figcaption className="sr-only">
        Bar chart of weekly patient totals across {data.length} weeks.
      </figcaption>
      <div className="chart__legend" role="presentation">
        <span className="chart__legend-item">
          <span className="chart__swatch chart__swatch--block chart__swatch--block-muted" aria-hidden="true" />
          Weekly total
        </span>
        <span className="chart__legend-item">
          <span className="chart__swatch chart__swatch--block chart__swatch--block-peak" aria-hidden="true" />
          Latest complete week
        </span>
      </div>
      <ResponsiveContainer width="100%" height={height - 36}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="#e0e0e0" />
          <XAxis dataKey="label" tickLine={false} tickMargin={8} interval="preserveStartEnd" minTickGap={24} />
          <YAxis domain={[0, yMax]} tickLine={false} axisLine={false} width={48} tickCount={5} allowDecimals={false} />
          <Tooltip content={<ChartTip valueSuffix=" patients" />} cursor={{ fill: '#f4f4f4' }} />
          <Bar dataKey="total" name="Total" isAnimationActive={false}>
            {data.map((entry, i) => (
              <Cell key={entry.label} fill={i === data.length - 1 ? '#0f62fe' : '#c6c6c6'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </figure>
  )
}
