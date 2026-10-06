import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fmtInt } from '../../utils/format.js'
import ChartTip from './ChartTip.jsx'

/**
 * Distribution of daily patient counts (histogram), with the mean and
 * median marked. Bins come from utils/analytics.histogram().
 */
export default function Histogram({ bins = [], mean, median, height = 300 }) {
  const data = bins.map((b) => ({ range: b.range, count: b.count, x: b.x }))
  const meanBinIndex = findNearestIndex(data, mean)
  const medianBinIndex = findNearestIndex(data, median)

  return (
    <figure className="chart" style={{ height }}>
      <figcaption className="sr-only">
        Histogram of daily patient counts across {data.length} ranges. Mean is {mean != null ? fmtInt(mean) : '—'}{' '}
        patients; median is {median != null ? fmtInt(median) : '—'} patients.
      </figcaption>
      <div className="chart__legend" role="presentation">
        <span className="chart__legend-item">
          <span className="chart__swatch chart__swatch--block chart__swatch--block-muted" aria-hidden="true" />
          Days in range
        </span>
        <span className="chart__legend-item">
          <span className="chart__swatch" style={{ background: '#0f62fe' }} aria-hidden="true" />
          Mean
        </span>
        <span className="chart__legend-item">
          <span className="chart__swatch" style={{ background: '#161616' }} aria-hidden="true" />
          Median
        </span>
      </div>
      <ResponsiveContainer width="100%" height={height - 36}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="#e0e0e0" />
          <XAxis dataKey="range" tickLine={false} tickMargin={8} interval={0} tick={{ fontSize: 10 }} />
          <YAxis tickLine={false} axisLine={false} width={40} tickCount={4} allowDecimals={false} />
          <Tooltip content={<ChartTip valueSuffix=" days" />} cursor={{ fill: '#f4f4f4' }} />
          {meanBinIndex != null ? (
            <ReferenceLine x={data[meanBinIndex].range} stroke="#0f62fe" strokeDasharray="4 4" />
          ) : null}
          {medianBinIndex != null ? (
            <ReferenceLine x={data[medianBinIndex].range} stroke="#161616" strokeDasharray="4 4" />
          ) : null}
          <Bar dataKey="count" name="Days" isAnimationActive={false} fill="#c6c6c6" />
        </BarChart>
      </ResponsiveContainer>
    </figure>
  )
}

function findNearestIndex(data, value) {
  if (value == null || !data.length) return null
  let best = 0
  for (let i = 0; i < data.length; i += 1) {
    if (Math.abs(data[i].x - value) < Math.abs(data[best].x - value)) best = i
  }
  return best
}
