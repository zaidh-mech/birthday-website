import { useEffect } from 'react'
import { format } from 'date-fns'
import type { Letter } from '@/data/initialData'

/** Rows like "[SAFE_UNLOCKED]" or "[GIFT_PLACE]" are settings stored in the letters table, not letters. */
export function isSystemLetter(letter: Pick<Letter, 'title'>): boolean {
  return letter.title.trim().startsWith('[')
}

/** Cloud rows can carry nulls; make every field a safe string. */
export function normalizeLetter(raw: Letter): Letter {
  const r = raw as Partial<Record<keyof Letter, unknown>>
  return {
    id: String(r.id ?? ''),
    title: typeof r.title === 'string' ? r.title : '',
    content: typeof r.content === 'string' ? r.content.replace(/\r\n?/g, '\n') : '',
    occasion: typeof r.occasion === 'string' ? r.occasion : '',
    date: typeof r.date === 'string' ? r.date : '',
  }
}

/** Parses ISO strings and plain YYYY-MM-DD dates (as local dates, so they never shift a day). */
export function parseLetterDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const trimmed = value.trim()
  const plain = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  const date = plain ? new Date(Number(plain[1]), Number(plain[2]) - 1, Number(plain[3])) : new Date(trimmed)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Formats a letter date, or returns null for missing / invalid dates instead of throwing. */
export function formatLetterDate(value: string | null | undefined, pattern = 'MMMM do, yyyy'): string | null {
  const date = parseLetterDate(value)
  if (!date) return null
  try {
    return format(date, pattern)
  } catch {
    return null
  }
}

function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export const ENVELOPE_TONE_COUNT = 5

/** Stable per-letter envelope colour, so a letter keeps "its" envelope. */
export function envelopeTone(id: string, index: number): number {
  return (hash(id) + index) % ENVELOPE_TONE_COUNT
}

/** A gentle, stable tilt between -2.4 and 2.4 degrees, alternating sides. */
export function envelopeTilt(id: string, index: number): number {
  const magnitude = 0.8 + (hash(`${id}-tilt`) % 17) / 10
  return (index % 2 === 0 ? -1 : 1) * magnitude
}

/* ---------------- read state (kept per device) ---------------- */

const READ_KEY = 'birthday_letters_read'

export function loadReadIds(): string[] {
  try {
    const raw = window.localStorage.getItem(READ_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function saveReadIds(ids: Iterable<string>): void {
  try {
    window.localStorage.setItem(READ_KEY, JSON.stringify([...ids]))
  } catch {
    /* storage may be blocked */
  }
}

/* ---------------- modal helpers ---------------- */

/** Locks page scroll while a dialog is open (and keeps the layout from jumping when the scrollbar disappears). */
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const { body, documentElement: html } = document
    const scrollbar = window.innerWidth - html.clientWidth
    const prev = {
      bodyOverflow: body.style.overflow,
      bodyPadding: body.style.paddingRight,
      htmlOverflow: html.style.overflow,
    }
    body.style.overflow = 'hidden'
    html.style.overflow = 'hidden'
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`
    return () => {
      body.style.overflow = prev.bodyOverflow
      body.style.paddingRight = prev.bodyPadding
      html.style.overflow = prev.htmlOverflow
    }
  }, [active])
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Keeps Tab / Shift+Tab inside `container`. Call from a keydown handler. */
export function trapTabKey(event: KeyboardEvent, container: HTMLElement | null): void {
  if (event.key !== 'Tab' || !container) return
  const items = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null)
  if (items.length === 0) {
    event.preventDefault()
    return
  }
  const first = items[0]
  const last = items[items.length - 1]
  const active = document.activeElement
  if (event.shiftKey && (active === first || !container.contains(active))) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && (active === last || !container.contains(active))) {
    event.preventDefault()
    first.focus()
  }
}
