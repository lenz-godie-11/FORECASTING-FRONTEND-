/**
 * Demo login helper: a locally-scoped session that only exists when the
 * user explicitly chose demo mode. It never calls the API.
 */

import { storeAuth } from './auth.js'

export function buildDemoSession(username) {
  const session = {
    token: `demo-session-${Date.now()}`,
    user: { name: username?.trim() ? username.trim() : 'Demo planner' },
    demo: true,
  }
  storeAuth(session)
  return session
}
