/**
 * Shared formatting helpers (dates, numbers, class names).
 */

export function cx(...parts) {
  return parts.filter(Boolean).join(' ')
}

export function fmtInt(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return Math.round(value).toLocaleString('en-US')
}

export function fmtPct(value, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${value > 0 ? '+' : ''}${value.toFixed(digits)}%`
}

/** 'YYYY-MM-DD' -> Date (local, noon-anchored to avoid DST edge cases) */
export function parseDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d
}

export function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayISO() {
  return toISODate(new Date())
}

export function addDays(iso, days) {
  const d = parseDate(iso) || new Date()
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

export function fmtDate(iso) {
  const d = parseDate(iso)
  if (!d) return '—'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function fmtDateShort(iso) {
  const d = parseDate(iso)
  if (!d) return '—'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function fmtWeekday(iso) {
  const d = parseDate(iso)
  if (!d) return ''
  return d.toLocaleDateString('en-GB', { weekday: 'short' })
}

export function fmtDateTime(iso) {
  const d = parseDate(iso)
  if (!d) return '—'
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${fmtDate(iso)}, ${time}`
}

export function timeAgo(iso) {
  const d = parseDate(iso)
  if (!d) return '—'
  const diffMs = Date.now() - d.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} d ago`
  return fmtDate(iso)
}

/** Sort keys ascending by date */
export function byDateAsc(a, b) {
  return String(a.date).localeCompare(String(b.date))
}
