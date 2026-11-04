const pad = (n) => String(n).padStart(2, '0')

export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

export function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return `${formatDate(value)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatPercent(value, digits = 0) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '%0'
  return `%${n.toFixed(digits).replace(/\.0+$/, '')}`
}

export function formatScore(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n.toFixed(1) : '—'
}

/** "2026-12-12" + "18:00" -> "2026-12-12T18:00:00" (backend LocalDateTime) */
export function toLocalDateTime(date, time = '00:00') {
  return `${date}T${time}:00`
}

/** Backend LocalDateTime -> { date: 'YYYY-MM-DD', time: 'HH:mm' } */
export function splitLocalDateTime(value) {
  if (!value) return { date: '', time: '' }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return { date: '', time: '' }
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

export function isFutureDateTime(date, time = '00:00') {
  if (!date) return false
  return new Date(toLocalDateTime(date, time)).getTime() > Date.now()
}

export function initials(text = '') {
  return (
    text
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase() || '?'
  )
}
