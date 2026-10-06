/**
 * Forecast-based high-demand alerts.
 *
 * Alert rules run client-side today, but the thresholds and the resulting
 * alert objects are deliberately structured to move to backend business
 * logic unchanged: each rule is a plain, serialisable object, and each
 * alert has a stable `type` and `severity` the backend can adopt.
 */

import { fmtDate } from './format.js'

export const DEFAULT_THRESHOLDS = Object.freeze({
  /** A single predicted day at or above this many patients is a high-demand day. */
  peakPatientsPerDay: 150,
  /** A stretch of consecutive predicted days at or above this many patients. */
  sustainedPatientsPerDay: 120,
  /** ...counting as sustained for this many consecutive days. */
  sustainedDays: 3,
})

export const ALERT_RULES = Object.freeze([
  {
    key: 'peak',
    label: 'High-demand day',
    description: 'A single forecast day at or above the peak threshold.',
    severity: 'high',
  },
  {
    key: 'sustained',
    label: 'Sustained elevated demand',
    description: 'Consecutive forecast days at or above the sustained threshold.',
    severity: 'warning',
  },
  {
    key: 'peak_day',
    label: 'Expected peak',
    description: 'The highest predicted day in the forecast horizon.',
    severity: 'info',
  },
])

function findRuns(series, threshold) {
  const runs = []
  let current = null
  for (const point of series) {
    if (point.patients >= threshold) {
      if (!current) current = { start: point, end: point, max: point }
      else {
        current.end = point
        if (point.patients > current.max.patients) current.max = point
      }
    } else if (current) {
      runs.push(current)
      current = null
    }
  }
  if (current) runs.push(current)
  return runs
}

/**
 * Evaluate a forecast against the alert rules.
 *
 * @param {Array<{date: string, patients: number}>} predictions
 * @param {object} thresholds  { peakPatientsPerDay, sustainedPatientsPerDay, sustainedDays }
 * @param {object} [context]   { averageDaily } for relative context in detail text
 * @returns {Array<object>} alerts sorted by start date
 */
export function evaluateAlerts(predictions, thresholds, context = {}) {
  const alerts = []
  const t = thresholds ?? DEFAULT_THRESHOLDS
  const average = context.averageDaily

  for (const run of findRuns(predictions, t.peakPatientsPerDay)) {
    const days = run.end.date === run.start.date ? 1 : countDays(run.start.date, run.end.date)
    alerts.push({
      id: `peak-${run.start.date}`,
      type: 'peak',
      severity: days >= t.sustainedDays ? 'high' : 'warning',
      title:
        days === 1
          ? `High-demand day expected on ${fmtDate(run.start.date)}`
          : `High-demand period expected (${days} days)`,
      detail:
        run.max.patients >= t.peakPatientsPerDay
          ? `Peak of ${run.max.patients} patients on ${fmtDate(run.max.date)}, above the ${t.peakPatientsPerDay}-patient threshold.`
          : `Demand expected between ${run.start.patients} and ${run.max.patients} patients/day.`,
      startDate: run.start.date,
      endDate: run.end.date,
      value: run.max.patients,
      threshold: t.peakPatientsPerDay,
      contextPct: average ? ((run.max.patients - average) / average) * 100 : null,
    })
  }

  for (const run of findRuns(predictions, t.sustainedPatientsPerDay)) {
    const days = countDays(run.start.date, run.end.date)
    if (days < t.sustainedDays) continue
    alerts.push({
      id: `sustained-${run.start.date}`,
      type: 'sustained',
      severity: 'warning',
      title: `Sustained demand of ${days} days expected`,
      detail: `${t.sustainedPatientsPerDay}+ patients expected each day from ${fmtDate(run.start.date)} to ${fmtDate(run.end.date)}. Plan capacity before this window.`,
      startDate: run.start.date,
      endDate: run.end.date,
      value: run.max.patients,
      threshold: t.sustainedPatientsPerDay,
      contextPct: average ? ((run.max.patients - average) / average) * 100 : null,
    })
  }

  return alerts
}

function countDays(startISO, endISO) {
  const a = new Date(`${startISO}T00:00:00`)
  const b = new Date(`${endISO}T00:00:00`)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 1
  return Math.round((b - a) / 86400000) + 1
}
