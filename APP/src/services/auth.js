/**
 * Authentication service.
 *
 * Login goes to POST /api/v1/auth/login/ (Django REST Framework).
 * The JWT returned by the API is stored in localStorage under
 * `afyaflow:auth` and attached to every request as a Bearer token.
 */

import { apiFetch } from './api.js'

const STORAGE_KEY = 'afyaflow:auth'

export function loadStoredAuth() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed.token !== 'string' || !parsed.token) return null
    return parsed
  } catch {
    return null
  }
}

export function storeAuth(auth) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
  } catch {
    // Storage unavailable (private mode) — the session simply will not persist.
  }
}

export function clearStoredAuth() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

/**
 * Sign in against the Django auth endpoint.
 *
 * @param {{username: string, password: string}} credentials
 * @returns {Promise<{token: string, user: {name: string}, demo: false}>}
 */
export async function requestLogin({ username, password }) {
  const payload = await apiFetch('/api/v1/auth/login/', {
    method: 'POST',
    body: { username, email: username, password },
  })

  const token = payload?.access ?? payload?.token ?? payload?.access_token ?? payload?.jwt
  if (!token || typeof token !== 'string') {
    throw new AuthShapeError('The API responded, but no JWT was returned from the login endpoint.')
  }

  const user = {
    name: payload?.user?.name ?? payload?.user?.username ?? payload?.username ?? username,
  }
  return { token, user, demo: false }
}

export class AuthShapeError extends Error {
  constructor(message) {
    super(message)
    this.name = 'AuthShapeError'
  }
}
