/** Flat Carbon tooltip shared by all AfyaFlow charts. */
export default function ChartTip({ active, payload, label, valueSuffix = ' patients', formatter }) {
  if (!active || !payload?.length) return null
  const rows = payload.filter((entry) => entry.value !== null && entry.value !== undefined)
  if (!rows.length) return null
  return (
    <div className="chart-tip">
      <div className="chart-tip__date">{label}</div>
      {rows.map((entry) => (
        <div key={entry.dataKey} className="chart-tip__row">
          <span
            className="chart-tip__swatch"
            style={{ background: entry.stroke || entry.fill || entry.color }}
            aria-hidden="true"
          />
          <span>{entry.name}</span>
          <b className="num">
            {formatter ? formatter(entry.value, entry.name) : `${Math.round(entry.value)}${valueSuffix}`}
          </b>
        </div>
      ))}
    </div>
  )
}
