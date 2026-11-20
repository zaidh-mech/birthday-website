'use client'

import type { MagicEngine } from './magicEngine'

/**
 * Imperative access to the site-wide magic overlay (mounted in the root
 * layout). Safe to call anywhere on the client: when the overlay isn't
 * mounted (server, /admin) the calls are no-ops.
 *
 *   import { heartBurstAt, sparklesAt } from '@/components/effects/magic'
 *   heartBurstAt(event.clientX, event.clientY)
 */

let engine: MagicEngine | null = null

export function registerMagicEngine(next: MagicEngine): () => void {
  engine = next
  return () => {
    if (engine === next) engine = null
  }
}

export function isDarkTheme(): boolean {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
}

/** A little fan of hearts at a viewport point (clientX / clientY). */
export function heartBurstAt(x: number, y: number, count = 9): void {
  engine?.burst(x, y, { dark: isDarkTheme(), reduced: prefersReducedMotion(), count })
}

/** Sparkles flying out of a viewport point. */
export function sparklesAt(x: number, y: number, count = 10): void {
  engine?.sparkles(x, y, { dark: isDarkTheme(), reduced: prefersReducedMotion(), count })
}

/** Sparkles from the centre of an element. */
export function sparklesFromElement(el: Element | null, count = 10): void {
  if (!el) return
  const r = el.getBoundingClientRect()
  sparklesAt(r.left + r.width / 2, r.top + r.height / 2, count)
}
