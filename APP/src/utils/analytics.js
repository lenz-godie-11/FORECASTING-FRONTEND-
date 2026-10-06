/**
 * Patient-demand analytics computed from API-provided observations.
 * Everything here is derived from data returned by the backend REST API
 * (or the explicitly enabled demo data set) — no invented values.
 */

const WEEKDAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function isoWeekLabel(date) {
  const target = new Date(date)
  target.setHours(12, 0, 0, 0)
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7))
  const yearStart = new Date(target.getFullYear(), 0, 1)
  const weeks = Math.ceil(((target - yearStart) / 86400000 + 1) / 7)
  return `Wk ${weeks}`
}

export function weekdayAverages(history) {
  const buckets = Array.from({ length: 7 }, (_, i) => ({ label: WEEKDAY_ORDER[i], total: 0, count: 0 }))
  for (const point of history) {
    const d = new Date(`${point.date}T12:00:00`)
    if (Number.isNaN(d.getTime())) continue
    const idx = (d.getDay() + 6) % 7
    buckets[idx].total += point.patients
    buckets[idx].count += 1
  }
  return buckets.map((b) => ({
    label: b.label,
    avg: b.count ? b.total / b.count : 0,
    count: b.count,
  }))
}

export function movingAverage(history, window = 7) {
  return history.map((point, i) => {
    const slice = history.slice(Math.max(0, i - window + 1), i + 1)
    const avg = slice.reduce((acc, p) => acc + p.patients, 0) / slice.length
    return { date: point.date, avg }
  })
}

export function weeklyTotals(history) {
  const byWeek = new Map()
  for (const point of history) {
    const d = new Date(`${point.date}T12:00:00`)
    if (Number.isNaN(d.getTime())) continue
    const label = isoWeekLabel(d)
    if (!byWeek.has(label)) byWeek.set(label, { label, start: point.date, total: 0, days: 0 })
    const bucket = byWeek.get(label)
    bucket.total += point.patients
    bucket.days += 1
  }
  return [...byWeek.values()].map((b) => ({ label: b.label, total: b.total, avg: b.total / b.days, start: b.start }))
}

export function histogram(history, targetBins = 9) {
  if (!history.length) return { bins: [], min: null, max: null, mean: null, median: null, p90: null }
  const values = history.map((p) => p.patients).sort((a, b) => a - b)
  const min = values[0]
  const max = values[values.length - 1]
  if (min === max) {
    return {
      bins: [{ range: String(min), count: values.length, x: min }],
      min,
      max,
      mean: min,
      median: min,
      p90: min,
    }
  }
  const width = (max - min) / targetBins
  const bins = Array.from({ length: targetBins }, (_, i) => ({
    lo: min + i * width,
    hi: min + (i + 1) * width,
    count: 0,
  }))
  for (const v of values) {
    const idx = Math.min(targetBins - 1, Math.floor((v - min) / width))
    bins[idx].count += 1
  }
  const total = history.length
  const mean = values.reduce((a, b) => a + b, 0) / total
  const median = values[Math.floor(total / 2)]
  const p90 = values[Math.min(total - 1, Math.floor(total * 0.9))]
  return {
    bins: bins.map((b, i) => ({
      range: `${Math.round(b.lo)}–${Math.round(b.hi)}`,
      count: b.count,
      x: i === targetBins - 1 ? Math.round(b.hi) : Math.round((b.lo + b.hi) / 2),
    })),
    min,
    max,
    mean,
    median,
    p90,
  }
}

/** Coefficient of variation (std / mean) — daily demand variability */
export function variability(history) {
  if (history.length < 2) return null
  const mean = history.reduce((a, p) => a + p.patients, 0) / history.length
  const variance = history.reduce((a, p) => a + (p.patients - mean) ** 2, 0) / history.length
  return Math.sqrt(variance) / mean
}

/**
 * Overlap between an earlier run's predictions and later observations.
 * Returns { observed, predicted, mae } for the shared date range, or null
 * when there is no overlap (e.g. a single run, or runs too far apart).
 */
export function modelCheck(earlierRun, laterHistory) {
  if (!earlierRun?.predictions?.length || !laterHistory?.length) return null
  const obsByDate = new Map(laterHistory.map((p) => [p.date, p.patients]))
  const shared = earlierRun.predictions.filter((p) => obsByDate.has(p.date))
  if (shared.length < 5) return null
  const observed = shared.map((p) => ({ date: p.date, observed: obsByDate.get(p.date) }))
  const predicted = shared.map((p) => ({ date: p.date, predicted: p.patients }))
  const mae =
    shared.reduce((acc, p) => acc + Math.abs(obsByDate.get(p.date) - p.patients), 0) / shared.length
  return { observed, predicted, mae, days: shared.length, earlierRunId: earlierRun.id }
}

export function peakObservedDay(history) {
  let peak = null
  for (const p of history) {
    if (peak === null || p.patients > peak.patients) peak = p
  }
  return peak
}
