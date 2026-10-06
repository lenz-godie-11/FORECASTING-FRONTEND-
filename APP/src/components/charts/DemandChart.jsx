import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fmtDateShort, todayISO } from '../../utils/format.js'
import ChartTip from './ChartTip.jsx'

/**
 * The core demand chart: observed (logged) history as a grey line,
 * model predictions as the blue line, separated at the forecast start.
 * A dashed vertical line marks today (or the forecast start).
 */
export default function DemandChart({ history = [], predictions = [], height = 340 }) {
  const data = buildMergedSeries(history, predictions)
  const today = todayISO()
  const firstForecast = predictions[0]?.date
  const todayInData = data.some((d) => d.date === today)
  const markerDate = todayInData ? today : firstForecast
  const markerLabel = markerDate ? fmtDateShort(markerDate) : null
  const markerText = todayInData ? 'Today' : 'Forecast starts'

  const values = data.flatMap((d) => [d.observed, d.predicted]).filter((v) => v != null)
  const yMin = Math.max(0, Math.floor((Math.min(...values, 999) - 10) / 10) * 10)
  const yMax = Math.ceil((Math.max(...values, 0) + 10) / 10) * 10

  return (
    <figure className="chart" style={{ height }}>
      <figcaption className="sr-only">
        Line chart of daily patient demand. Grey line shows observed patients from logged
        observations; blue line shows the model's daily predictions.
      </figcaption>
      <div className="chart__legend" role="presentation">
        <span className="chart__legend-item">
          <span className="chart__swatch chart__swatch--observed" aria-hidden="true" />
          Observed (logged)
        </span>
        <span className="chart__legend-item">
          <span className="chart__swatch chart__swatch--predicted" aria-hidden="true" />
          Predicted (model)
        </span>
        <span className="chart__legend-item">
          <span className="chart__swatch" style={{ background: '#161616' }} aria-hidden="true" />
          Today
        </span>
      </div>
      <ResponsiveContainer width="100%" height={height - 36}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="#e0e0e0" />
          <XAxis
            dataKey="label"
            tickLine={false}
            tickMargin={8}
            interval="preserveStartEnd"
            minTickGap={48}
          />
          <YAxis
            domain={[yMin, yMax]}
            tickLine={false}
            axisLine={false}
            width={44}
            tickCount={5}
            allowDecimals={false}
          />
          <Tooltip content={<ChartTip />} />
          {firstForecast ? (
            <ReferenceArea x1={fmtDateShort(firstForecast)} fill="#0f62fe" fillOpacity={0.05} />
          ) : null}
          <Line
            type="monotone"
            dataKey="observed"
            name="Observed"
            stroke="#8c8c8c"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3 }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="predicted"
            name="Predicted"
            stroke="#0f62fe"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
            isAnimationActive={false}
          />
          {markerLabel ? (
            <ReferenceLine
              x={markerLabel}
              stroke="#161616"
              strokeDasharray="4 4"
              label={{ value: markerText, position: 'top', fontSize: 11, fill: '#525252' }}
            />
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
    </figure>
  )
}

function buildMergedSeries(history, predictions) {
  const map = new Map()
  for (const point of history) {
    map.set(point.date, { date: point.date, observed: point.patients })
  }
  for (const point of predictions) {
    const existing = map.get(point.date)
    map.set(point.date, {
      date: point.date,
      observed: existing?.observed,
      predicted: point.patients,
    })
  }
  return [...map.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({ ...d, label: fmtDateShort(d.date) }))
}
