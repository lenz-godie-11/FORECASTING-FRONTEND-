/**
 * Forecast data normalization.
 *
 * The Django backend may name its fields differently across versions
 * (run_id vs id, forecast vs predictions, y vs patients). These helpers
 * normalize whatever the REST API returns into one stable shape so the
 * UI never depends on backend naming.
 *
 * Normalized run:
 * {
 *   id, createdAt, status,
 *   model, period, horizon,
 *   historyStart, historyEnd, forecastStart, forecastEnd,
 *   history:     [{ date: 'YYYY-MM-DD', patients: number }],
 *   predictions: [{ date: 'YYYY-MM-DD', patients: number }],
 * }
 */

const RUN_LIST_KEYS = ['results', 'runs', 'data', 'items']
const DATE_KEYS = ['date', 'day', 'datetime', 'timestamp']
const VALUE_KEYS = ['patients', 'patient_count', 'value', 'y', 'count', 'demand', 'predicted_patients', 'mean']

function firstDefined(obj, keys) {
  if (!obj || typeof obj !== 'object') return undefined
  for (const k of keys) {
    const v = obj[k]
    if (v !== undefined && v !== null) return v
  }
  return undefined
}

/** Pick the first property of obj whose key is in keys */
function pickKey(obj, keys) {
  for (const k of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k)) return k
  }
  return null
}

/** Extract a series array from raw data: array of {date, value} pairs or arrays */
function extractSeries(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .map((entry) => {
      if (Array.isArray(entry) && entry.length >= 2) {
        return { date: String(entry[0]), patients: Number(entry[1]) }
      }
      if (entry && typeof entry === 'object') {
        const date = firstDefined(entry, DATE_KEYS)
        const value = firstDefined(entry, VALUE_KEYS)
        if (date === undefined) return null
        const patients = Number(value)
        if (Number.isNaN(patients)) return null
        return { date: String(date).slice(0, 10), patients }
      }
      return null
    })
    .filter(Boolean)
}

export function normalizeRun(raw) {
  if (!raw || typeof raw !== 'object') return null

  const isGetResponse = raw && typeof raw === 'object' && 'success' in raw && 'run' in raw && 'points' in raw
  const isPostResponse = raw && typeof raw === 'object' && 'success' in raw && 'forecast' in raw

  let history = []
  let predictions = []
  let runMeta = raw

  if (isGetResponse) {
    runMeta = raw.run || {}
    predictions = extractSeries(raw.points) || extractSeries(runMeta.points) || extractSeries(runMeta.predictions)
    const h1 = extractSeries(raw.history)
    const h2 = extractSeries(runMeta.history)
    history = h1.length ? h1 : (h2.length ? h2 : [])
  } else if (isPostResponse) {
    runMeta = raw
    predictions = extractSeries(raw.forecast) || extractSeries(raw.predictions) || extractSeries(raw.points)
    const h1 = extractSeries(raw.history)
    const h2 = extractSeries(runMeta.history)
    history = h1.length ? h1 : (h2.length ? h2 : [])
  } else if (raw.history || raw.predictions || raw.points) {
    const h1 = extractSeries(raw.history)
    history = h1.length ? h1 : []
    predictions = extractSeries(raw.predictions) || extractSeries(raw.points) || extractSeries(raw.forecast)
  }

  const createdAt = firstDefined(runMeta, ['created_at', 'created', 'timestamp', 'run_date'])
  const run = {
    id: String(firstDefined(runMeta, ['id', 'run_id', 'pk', 'uuid']) ?? ''),
    createdAt: createdAt ? String(createdAt) : null,
    status: String(firstDefined(runMeta, ['status', 'state']) ?? 'completed'),
    model: String(firstDefined(runMeta, ['model', 'model_name', 'model_type']) ?? 'ThetaModel'),
    period: Number(firstDefined(runMeta, ['period', 'season_period', 'seasonality']) ?? 7),
    horizon: Number(firstDefined(runMeta, ['horizon', 'forecast_horizon', 'forecast_days', 'days']) ?? 90),
    historyStart: firstDefined(runMeta, ['history_start', 'history_start_date', 'observed_start']),
    historyEnd: firstDefined(runMeta, ['history_end', 'history_end_date', 'observed_end']),
    forecastStart: firstDefined(runMeta, ['forecast_start', 'forecast_start_date', 'start_date']),
    forecastEnd: firstDefined(runMeta, ['forecast_end', 'forecast_end_date', 'end_date']),
    history,
    predictions,
  }
  if (!run.historyStart && run.history.length) run.historyStart = run.history[0].date
  if (!run.historyEnd && run.history.length) run.historyEnd = run.history[run.history.length - 1].date
  if (!run.forecastStart && run.predictions.length) run.forecastStart = run.predictions[0].date
  if (!run.forecastEnd && run.predictions.length)
    run.forecastEnd = run.predictions[run.predictions.length - 1].date
  return run
}

export function normalizeRunList(raw) {
  let items
  if (Array.isArray(raw)) {
    items = raw
  } else if (raw && typeof raw === 'object') {
    // GET /api/v1/forecast/ returns { success, run, points } — a single
    // run envelope with its 90-day prediction points. Pass the whole
    // envelope to normalizeRun so the points are preserved as predictions.
    if ('success' in raw && 'run' in raw && 'points' in raw) {
      items = [raw]
    } else if ('success' in raw && 'run' in raw) {
      items = [raw.run]
    } else {
      const key = pickKey(raw, RUN_LIST_KEYS)
      items = key ? raw[key] : null
      if (!Array.isArray(items)) items = raw.values ? raw.values : null
    }
  }
  if (!Array.isArray(items)) return []
  const runs = items.map(normalizeRun).filter(Boolean)
  runs.sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
  return runs
}

/* ---- Derived demand metrics ---- */

export function sumRange(series, days) {
  return series.slice(0, days).reduce((acc, p) => acc + (Number.isFinite(p.patients) ? p.patients : 0), 0)
}

export function findPeak(series) {
  let peak = null
  for (const p of series) {
    if (peak === null || p.patients > peak.patients) peak = p
  }
  return peak
}

export function averageOf(series) {
  if (!series.length) return null
  return sumRange(series, series.length) / series.length
}

/**
 * Day-over-day deltas for the leading days of a prediction series.
 */
export function dayOverDay(series, days) {
  return series.slice(0, days + 1).map((p, i) => {
    const prev = i > 0 ? series[i - 1].patients : null
    const delta = prev ? p.patients - prev : null
    const pct = prev ? ((p.patients - prev) / prev) * 100 : null
    return { ...p, delta, pct }
  }).slice(1, days)
}
