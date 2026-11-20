/**
 * Calendar helpers for the date ticket: parse "3:00 PM - 6:00 PM" style
 * ranges, build an .ics file and a Google Calendar link (floating local time).
 */

const DEFAULT_START = 15 * 60 // 3 PM
const LAST_MINUTE = 23 * 60 + 59

/** Minutes since midnight for the first two times found in a range string. */
export function parseTimeRange(range: string): { start: number; end: number | null } | null {
  if (!range) return null
  const found: number[] = []
  const twelveHour = /(\d{1,2})(?:[:.](\d{2}))?\s*([ap])\.?\s*m\.?/gi
  for (const m of range.matchAll(twelveHour)) {
    let h = Number(m[1])
    const min = Number(m[2] ?? 0)
    if (h < 1 || h > 12 || min > 59) continue
    h = h % 12
    if (m[3].toLowerCase() === 'p') h += 12
    found.push(h * 60 + min)
    if (found.length === 2) break
  }
  const times = found.length > 0 ? found : parse24h(range)
  if (times.length === 0) return null
  return { start: times[0], end: times.length > 1 ? times[1] : null }
}

function parse24h(range: string): number[] {
  const out: number[] = []
  for (const m of range.matchAll(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g)) {
    out.push(Number(m[1]) * 60 + Number(m[2]))
    if (out.length >= 2) break
  }
  return out
}

/**
 * The window we'll actually put in the calendar. Seatings ("3 PM – 6 PM") are
 * used as-is; long opening hours ("8 AM – 10 PM") become a 3 PM date when that
 * fits, otherwise opening time + a few hours. Unparseable → 3 PM.
 */
export function planDateWindow(range: string): { start: number; end: number } {
  const parsed = parseTimeRange(range)
  if (!parsed) return { start: DEFAULT_START, end: DEFAULT_START + 150 }
  const { start } = parsed
  let end = parsed.end
  if (end === null) return { start, end: Math.min(start + 150, LAST_MINUTE) }
  if (end <= start) end = LAST_MINUTE // closes after midnight
  if (end - start > 4 * 60) {
    const s = DEFAULT_START >= start && DEFAULT_START + 120 <= end ? DEFAULT_START : start
    return { start: s, end: Math.min(s + 180, end, LAST_MINUTE) }
  }
  return { start, end: Math.min(end, LAST_MINUTE) }
}

export function formatMinutes(min: number): string {
  const h24 = Math.floor(min / 60)
  const m = min % 60
  const suffix = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

const pad = (n: number) => String(n).padStart(2, '0')

function stamp(dateISO: string, minutes: number): string {
  return `${dateISO.replace(/-/g, '')}T${pad(Math.floor(minutes / 60))}${pad(minutes % 60)}00`
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

/** RFC 5545 line folding (by code point, conservatively short so multi-byte text stays under 75 octets). */
function fold(line: string): string {
  const chars = Array.from(line)
  if (chars.length <= 60) return line
  const parts: string[] = []
  for (let i = 0; i < chars.length; i += 60) parts.push(chars.slice(i, i + 60).join(''))
  return parts.join('\r\n ')
}

export interface CalendarEvent {
  uid: string
  dateISO: string
  start: number
  end: number
  title: string
  location: string
  description: string
}

export function buildIcs(e: CalendarEvent): string {
  const now = new Date()
  const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Our Little Corner//Date Invitation//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${e.uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${stamp(e.dateISO, e.start)}`,
    `DTEND:${stamp(e.dateISO, e.end)}`,
    `SUMMARY:${escapeIcs(e.title)}`,
    `LOCATION:${escapeIcs(e.location)}`,
    `DESCRIPTION:${escapeIcs(e.description)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'TRIGGER:-PT3H',
    `DESCRIPTION:${escapeIcs('Our date is in 3 hours 💖')}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.map(fold).join('\r\n') + '\r\n'
}

export function googleCalendarUrl(e: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${stamp(e.dateISO, e.start)}/${stamp(e.dateISO, e.end)}`,
    details: e.description,
    location: e.location,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/** Triggers a file download for a Blob (works in every modern browser, incl. iOS Safari 13+). */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 5000)
}
