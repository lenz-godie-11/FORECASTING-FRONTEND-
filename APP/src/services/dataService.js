/**
 * Data access facade.
 *
 * Every page fetches through this module. When demo mode is explicitly
 * enabled (a user choice, stored in settings) it delegates to the
 * synthetic demo provider; otherwise it hits the Django REST API.
 * Failed API calls are never silently replaced by demo data.
 */

import { apiFetch } from './api.js'
import { demo } from './demo.js'

export function listRuns({ demoMode, token, signal } = {}) {
  if (demoMode) return demo.listRuns()
  return apiFetch('/api/v1/forecast/', { token, signal })
}

export function getRun(id, { demoMode, token, signal } = {}) {
  if (demoMode) return demo.getRun(id)
  return apiFetch(`/api/v1/forecast/${encodeURIComponent(id)}/`, { token, signal })
}

/** Trigger a new forecast run on the backend. */
export function createRun({ demoMode, token, signal } = {}) {
  if (demoMode) return demo.createRun()
  return apiFetch('/api/v1/forecast/', { method: 'POST', body: {}, token, signal })
}

/** Submit a daily patient-demand observation. */
export function createObservation(payload, { demoMode, token, signal } = {}) {
  if (demoMode) return demo.createObservation(payload)
  return apiFetch('/api/v1/obs/', { method: 'POST', body: payload, token, signal })
}

/** Retrieve all logged patient-demand observations. */
export function listObservations({ demoMode, token, signal } = {}) {
  if (demoMode) return demo.getRun('demo-run-latest').then((run) => run.history ?? [])
  return apiFetch('/api/v1/obs/', { token, signal }).then((payload) => {
    if (!payload || !Array.isArray(payload.data)) return []
    return payload.data.map((point) => ({
      date: String(point.date ?? '').slice(0, 10),
      patients: Number(point.patients ?? 0),
    }))
  })
}
