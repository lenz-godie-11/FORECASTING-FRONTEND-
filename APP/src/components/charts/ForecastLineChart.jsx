import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fmtDateShort, fmtInt } from '../../utils/format.js'
import ChartTip from './ChartTip.jsx'

/**
 * Daily predictions for one forecast run (or a derived series such as a
 * moving average). Single blue series on a flat grid, optional average rule.
 */
export default function ForecastLineChart({
  series = [],
  valueKey = 'patients',
  name = 'Predicted',
  height = 300,
  showAverageLine = false,
  legend = [],
}) {
  const data = series.map((point) => ({ ...point, label: fmtDateShort(point.date) }))
  const values = data.map((d) => Number(d[valueKey])).filter((v) => Number.isFinite(v))
  const yMin = Math.max(0, Math.floor((Math.min(...values, 999) - 10) / 10) * 10)
  const yMax = Math.ceil((Math.max(...values, 0) + 10) / 10) * 10
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null

  return (
    <figure className="chart" style={{ height }}>
      <figcaption className="sr-only">
        Line chart of {name.toLowerCase()} by day, {data.length} days.
      </figcaption>
      {legend.length ? (
        <div className="chart__legend" role="presentation">
          {legend.map((item) => (
            <span key={item.label} className="chart__legend-item">
              <span className="chart__swatch chart__swatch--predicted" aria-hidden="true" />
              {item.label}
            </span>
          ))}
        </div>
      ) : null}
      <ResponsiveContainer width="100%" height={height - 36}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="#e0e0e0" />
          <XAxis dataKey="label" tickLine={false} tickMargin={8} interval="preserveStartEnd" minTickGap={48} />
          <YAxis domain={[yMin, yMax]} tickLine={false} axisLine={false} width={44} tickCount={5} allowDecimals={false} />
          <Tooltip content={<ChartTip valueSuffix=" patients" formatter={(v) => `${fmtInt(v)} patients`} />} />
          {showAverageLine && avg != null ? (
            <ReferenceLine
              y={avg}
              stroke="#161616"
              strokeDasharray="4 4"
              label={{ value: 'Average', position: 'insideBottomLeft', fontSize: 11, fill: '#525252' }}
            />
          ) : null}
          <Line
            type="monotone"
            dataKey={valueKey}
            name={name}
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
