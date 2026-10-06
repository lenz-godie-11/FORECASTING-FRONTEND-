/**
 * ============================================================
 * DEMO DATA — synthetic, explicitly opt-in, isolated from the API layer
 * ============================================================
 *
 * This module produces clearly synthetic patient-demand data so the
 * frontend can be demonstrated without the Django backend. It is used
 * ONLY when demo mode is explicitly enabled (login screen or Settings).
 *
 * It is never a silent fallback: failed API calls never fall through to
 * this module — they surface as error states.
 *
 * The shapes mirror what the REST API returns, so demo mode flows through
 * the exact same normalization code as production data.
 */

const DEMO_LATENCY_MS = 250

function delay(ms = DEMO_LATENCY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Deterministic pseudo-noise in [0, 1) */
function noise(seed, i) {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453
  return x - Math.floor(x)
}

function toISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseISO(iso) {
  return new Date(`${iso}T12:00:00`)
}

/**
 * Weekly demand pattern (Mon..Sun). Fridays run hot (ED walk-ins),
 * Saturdays peak, Sundays dip — typical facility rhythm.
 */
const WEEKDAY_FACTOR = [1.04, 1.05, 1.06, 1.03, 1.1, 1.18, 0.93]

function buildSeries({ startISO, days, seed, base = 108, trendPerDay = 0.035, amplitude = 7 }) {
  const start = parseISO(startISO)
  const series = []
  for (let i = 0; i < days; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const weekday = (d.getDay() + 6) % 7
    const seasonal = Math.sin(i / 45) * 4
    const wobble = (noise(seed, i) - 0.5) * 2 * amplitude
    const value = Math.round(
      base + i * trendPerDay + WEEKDAY_FACTOR[weekday] * base * 0.12 + seasonal + wobble,
    )
    series.push({ date: toISO(d), patients: Math.max(20, value) })
  }
  return series
}

const DEMO_HISTORY_START = '2025-07-01'
const DEMO_HISTORY_END = '2026-09-30'

function demoRuns() {
  const now = new Date().toISOString()
  const latestHistory = buildSeries({ startISO: DEMO_HISTORY_START, days: 457, seed: 42, base: 104 })
  const latestPredictions = buildSeries({
    startISO: '2026-10-01',
    days: 90,
    seed: 7,
    base: 122,
  })
  const olderPredictions = buildSeries({
    startISO: '2026-09-04',
    days: 90,
    seed: 71,
    base: 118,
  })
  return [
    {
      id: 'demo-run-latest',
      created_at: now,
      status: 'completed',
      model: 'ThetaModel',
      period: 7,
      horizon: 90,
      history_start: DEMO_HISTORY_START,
      history_end: DEMO_HISTORY_END,
      forecast_start: '2026-10-01',
      forecast_end: '2026-12-29',
      history: latestHistory,
      predictions: latestPredictions,
    },
    {
      id: 'demo-run-2026-09-04',
      created_at: '2026-09-04T06:00:00Z',
      status: 'completed',
      model: 'ThetaModel',
      period: 7,
      horizon: 90,
      history_start: '2025-07-01',
      history_end: '2026-09-03',
      forecast_start: '2026-09-04',
      forecast_end: '2026-12-03',
      predictions: olderPredictions,
    },
  ]
}

let runs = demoRuns()
const loggedObservations = []
let runCounter = 0

async function demoListRuns() {
  await delay()
  return runs.map((r) => ({
    id: r.id,
    created_at: r.created_at,
    status: r.status,
    model: r.model,
    period: r.period,
    horizon: r.horizon,
    history_start: r.history_start,
    history_end: r.history_end,
    forecast_start: r.forecast_start,
    forecast_end: r.forecast_end,
  }))
}

async function demoGetRun(id) {
  await delay()
  const run = runs.find((r) => r.id === id)
  if (!run) return null
  const history =
    run.id === 'demo-run-latest'
      ? [...run.history, ...loggedObservations].sort((a, b) => a.date.localeCompare(b.date))
      : run.history
  return { ...run, history }
}

async function demoCreateRun() {
  await delay(DEMO_LATENCY_MS * 2)
  runCounter += 1
  const today = toISO(new Date())
  const id = `demo-run-${today}-${runCounter}`
  const predictions = buildSeries({ startISO: today, days: 90, seed: 7 + runCounter, base: 122 })
  const last = predictions[predictions.length - 1]
  const run = {
    id,
    created_at: new Date().toISOString(),
    status: 'completed',
    model: 'ThetaModel',
    period: 7,
    horizon: 90,
    history_start: DEMO_HISTORY_START,
    history_end: DEMO_HISTORY_END,
    forecast_start: today,
    forecast_end: last.date,
    history: buildSeries({ startISO: DEMO_HISTORY_START, days: 457, seed: 42, base: 104 }),
    predictions,
  }
  runs = [run, ...runs]
  return run
}

async function demoCreateObservation(payload) {
  await delay()
  const point = {
    date: String(payload.date ?? '').slice(0, 10),
    patients: Number(payload.patients),
    source: payload.source ?? 'hospital_system',
  }
  loggedObservations.push(point)
  return { id: `obs-demo-${loggedObservations.length}`, ...point }
}

export const demo = {
  listRuns: demoListRuns,
  getRun: demoGetRun,
  createRun: demoCreateRun,
  createObservation: demoCreateObservation,
}
