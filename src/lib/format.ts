/**
 * Date helpers.
 *
 * The V1 backend serializes java.time.Instant as a numeric epoch (seconds,
 * e.g. 1789631437.36) because WRITE_DATES_AS_TIMESTAMPS is left enabled.
 * These helpers accept both that numeric form and ISO-8601 strings.
 */

export type DateInput = string | number | null | undefined

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') {
    // Epoch seconds (possibly fractional) -> ms. Values already in ms pass through.
    const ms = value < 1e12 ? value * 1000 : value
    const d = new Date(ms)
    return Number.isNaN(d.getTime()) ? null : d
  }
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

const dateFmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const dateTimeFmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

export function formatDate(iso?: DateInput): string {
  const d = toDate(iso)
  return d ? dateFmt.format(d) : '—'
}

export function formatDateTime(iso?: DateInput): string {
  const d = toDate(iso)
  return d ? dateTimeFmt.format(d) : '—'
}

export function timeAgo(iso?: DateInput): string {
  const d = toDate(iso)
  if (!d) return '—'
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export function formatConfidence(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  const normalized = v > 1 ? v : v * 100
  return `${Math.min(100, Math.max(0, Math.round(normalized)))}%`
}

export function prettifyEnum(v?: string | null): string {
  if (!v) return '—'
  return v
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
