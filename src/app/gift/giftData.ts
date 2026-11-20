import type { DateAvailability, Place } from '@/data/places'

/* ---------------- steps ---------------- */

export const STEP = {
  ask: 0,
  plead: 1,
  puppy: 2,
  date: 3,
  colour: 4,
  place: 5,
  ticket: 6,
} as const

export type Step = (typeof STEP)[keyof typeof STEP]

export interface EvaluatedPlace {
  place: Place
  availability: DateAvailability
}

export interface GiftPhoto {
  src: string
  alt: string
  caption: string
}

/* ---------------- dress colours ---------------- */

export interface DressColor {
  name: string
  hex: string
  note: string
}

export const DRESS_COLORS: DressColor[] = [
  { name: 'Rose', hex: '#fb7185', note: 'soft & romantic' },
  { name: 'Lavender', hex: '#c084fc', note: 'dreamy, like you' },
  { name: 'Sky Blue', hex: '#38bdf8', note: 'fresh & breezy' },
  { name: 'Mint', hex: '#2dd4bf', note: 'cute & calm' },
  { name: 'Buttercup', hex: '#fcd34d', note: 'pure sunshine' },
  { name: 'Midnight', hex: '#1e293b', note: 'classy & mysterious' },
  { name: 'Ivory', hex: '#f3ede2', note: 'timeless & elegant' },
  { name: 'Wine', hex: '#881337', note: 'bold & gorgeous' },
]

export function colorByName(name: string): DressColor {
  return DRESS_COLORS.find((c) => c.name === name) ?? { name: name || 'Rose', hex: '#fb7185', note: '' }
}

/* ---------------- place categories ---------------- */

export const CATEGORIES = [
  { id: 'all', label: 'All places' },
  { id: 'buffet', label: '🍽️ Lunch buffets' },
  { id: 'hightea', label: '🫖 High tea & platters' },
  { id: 'cafe', label: '☕ Cafés & brunch' },
  { id: 'halal', label: '🌙 Halal friendly' },
] as const

export type CategoryId = (typeof CATEGORIES)[number]['id']

export function matchesCategory(place: Place, category: CategoryId): boolean {
  if (category === 'all') return true
  const type = (place.type || '').toLowerCase()
  const name = (place.name || '').toLowerCase()
  const desc = (place.desc || '').toLowerCase()
  const ambiance = (place.ambiance || '').toLowerCase()
  switch (category) {
    case 'buffet':
      return type.includes('buffet') || type.includes('lunch') || name.includes('buffet') || name.includes('lunch')
    case 'hightea':
      return type.includes('high tea') || type.includes('platter') || type.includes('patisserie')
    case 'cafe':
      return type.includes('cafe') || type.includes('café') || type.includes('brunch') || type.includes('coffee')
    case 'halal':
      return type.includes('halal') || desc.includes('halal') || ambiance.includes('halal')
    default:
      return true
  }
}

export function placeEmoji(place: Place): string {
  const t = `${place.type} ${place.name}`.toLowerCase()
  if (t.includes('buffet') || t.includes('lunch')) return '🍽️'
  if (t.includes('tea')) return '🫖'
  if (t.includes('coffee') || t.includes('cafe') || t.includes('brunch')) return '☕'
  return '💝'
}

/* ---------------- local dates (YYYY-MM-DD, never UTC-shifted) ---------------- */

const pad = (n: number) => String(n).padStart(2, '0')

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseISODate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? null : d
}

export function todayISO(now = new Date()): string {
  return toISODate(now)
}

export function addDays(d: Date, days: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days)
}

/** Whole days from today to the given date (negative = in the past). */
export function daysFromToday(iso: string, now = new Date()): number | null {
  const d = parseISODate(iso)
  if (!d) return null
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((d.getTime() - today.getTime()) / 86400000)
}

/** The next given weekday (0 = Sun … 6 = Sat), today included. */
export function nextWeekdayISO(weekday: number, now = new Date()): string {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diff = (weekday - today.getDay() + 7) % 7
  return toISODate(addDays(today, diff))
}

/** Next occurrence (today included) of the month/day in a YYYY-MM-DD string. */
export function nextOccurrenceISO(iso: string, now = new Date()): string | null {
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return null
  const month = Number(m[1]) - 1
  const day = Number(m[2])
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let next = new Date(today.getFullYear(), month, day)
  if (next < today) next = new Date(today.getFullYear() + 1, month, day)
  return toISODate(next)
}

export function friendlyDate(iso: string): string {
  const d = parseISODate(iso)
  if (!d) return iso
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export function relativeDays(days: number): string {
  if (days === 0) return 'today!'
  if (days === 1) return 'tomorrow!'
  if (days < 7) return `in ${days} days`
  if (days < 14) return 'in about a week'
  if (days < 60) return `in ${Math.round(days / 7)} weeks`
  return `in ${days} days`
}

/* ---------------- photos ---------------- */

/** Rough brightness of a hex colour (0 = black, 1 = white). */
export function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return 0.5
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}
