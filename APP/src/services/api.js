/**
 * AfyaFlow REST API client.
 *
 * The frontend talks to the Django backend exclusively through these
 * endpoints. The base URL comes from VITE_API_BASE_URL (set in .env).
 */

const RAW_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').trim()
export const API_BASE_URL = RAW_BASE ? RAW_BASE.replace(/\/+$/, '') : ''

export const API_AVAILABLE = API_BASE_URL.length > 0

export class ApiError extends Error {
  constructor(message, status, detail) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

export class ApiUnavailableError extends Error {
  constructor() {
    super(
      'The AfyaFlow API is unreachable. Check that the Django backend is running and that VITE_API_BASE_URL points to it.',
    )
    this.name = 'ApiUnavailableError'
  }
}

let unauthorizedHandler = null

/** Registered once by the auth provider; fires on any 401 response. */
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn
}

/**
 * @param {string} path  e.g. '/api/v1/forecast/'
 * @param {object} [options]
 * @param {string} [options.method]
 * @param {object} [options.body]
 * @param {string} [options.token]
 * @param {AbortSignal} [options.signal]
 */
export async function apiFetch(path, options = {}) {
  const { method = 'GET', body, token, signal } = options
  const headers = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (err) {
    if (err?.name === 'AbortError') throw err
    throw new ApiUnavailableError()
  }

  if (response.status === 401) {
    unauthorizedHandler?.()
    throw new ApiError('Your session is no longer valid. Sign in again to continue.', 401)
  }

  let payload = null
  if (response.status !== 204) {
    try {
      payload = await response.json()
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    const detail =
      payload?.detail ||
      payload?.message ||
      payload?.error ||
      (payload && typeof payload === 'object' ? firstFieldError(payload) : null) ||
      `Request failed (HTTP ${response.status}).`
    throw new ApiError(typeof detail === 'string' ? detail : `Request failed (HTTP ${response.status}).`, response.status)
  }

  return payload
}

function firstFieldError(obj) {
  for (const value of Object.values(obj)) {
    if (typeof value === 'string') return value
    if (Array.isArray(value) && value.length && typeof value[0] === 'string') return value[0]
  }
  return null
}
