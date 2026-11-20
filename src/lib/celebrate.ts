'use client'

import confetti from 'canvas-confetti'

/**
 * Celebration effects built on canvas-confetti. Every function is a no-op on
 * the server and respects `prefers-reduced-motion` (it fires a tiny, short
 * burst instead of a long show).
 */

const ROSE_PALETTE = ['#fb7185', '#f43f5e', '#fda4af', '#f9a8d4', '#c084fc', '#fcd34d', '#ffffff']

function reducedMotion(): boolean {
  if (typeof window === 'undefined') return true
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

let heartShape: confetti.Shape | null = null
function getHeartShape(): confetti.Shape | null {
  if (typeof window === 'undefined') return null
  if (!heartShape) {
    try {
      heartShape = confetti.shapeFromPath({
        path: 'M167 72c19,-38 37,-56 75,-56 42,0 76,33 76,75 0,76 -76,151 -151,227 -76,-76 -151,-151 -151,-227 0,-42 33,-75 75,-75 38,0 57,18 76,56z',
      })
    } catch {
      heartShape = null
    }
  }
  return heartShape
}

export interface BurstOptions {
  /** 0–1 viewport coordinates; defaults to the centre */
  x?: number
  y?: number
  particleCount?: number
  spread?: number
  colors?: string[]
  hearts?: boolean
  scalar?: number
}

/** A single burst of confetti (optionally hearts) from a point on screen. */
export function burst({ x = 0.5, y = 0.6, particleCount = 90, spread = 75, colors = ROSE_PALETTE, hearts = false, scalar }: BurstOptions = {}): void {
  if (typeof window === 'undefined') return
  const reduce = reducedMotion()
  const heart = hearts ? getHeartShape() : null
  confetti({
    particleCount: reduce ? Math.min(20, particleCount) : particleCount,
    spread,
    origin: { x, y },
    colors,
    shapes: heart ? [heart, 'circle'] : undefined,
    scalar: scalar ?? (heart ? 1.4 : 1),
    ticks: reduce ? 60 : 220,
    zIndex: 9999,
    disableForReducedMotion: false,
  })
}

/** Burst from a DOM element's centre — handy for "you clicked this, celebrate it". */
export function burstFromElement(el: Element | null, options: Omit<BurstOptions, 'x' | 'y'> = {}): void {
  if (!el || typeof window === 'undefined') return
  const rect = el.getBoundingClientRect()
  burst({
    ...options,
    x: (rect.left + rect.width / 2) / window.innerWidth,
    y: (rect.top + rect.height / 2) / window.innerHeight,
  })
}

/** When the shared side-cannon loop of celebrate() stops, and whether it is running. */
let cannonEnd = 0
let cannonRunning = false

/** A big two-sided celebration for wins and "yes!" moments (~2.5s). */
export function celebrate(durationMs = 2500): void {
  if (typeof window === 'undefined') return
  if (reducedMotion()) {
    burst({ particleCount: 30, hearts: true })
    return
  }
  const heart = getHeartShape()
  // Repeated calls extend the one running loop instead of stacking extra loops.
  cannonEnd = Math.max(cannonEnd, Date.now() + durationMs)
  if (!cannonRunning) {
    cannonRunning = true
    const frame = () => {
      confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: ROSE_PALETTE, zIndex: 9999 })
      confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: ROSE_PALETTE, zIndex: 9999 })
      if (Date.now() < cannonEnd) requestAnimationFrame(frame)
      else cannonRunning = false
    }
    frame()
  }
  burst({ particleCount: 60, hearts: Boolean(heart), y: 0.5, spread: 100 })
}

/** Gentle hearts drifting down from the top of the screen (~3s). */
export function heartRain(durationMs = 3000): void {
  if (typeof window === 'undefined') return
  const heart = getHeartShape()
  if (reducedMotion()) {
    burst({ particleCount: 20, hearts: true, y: 0.3 })
    return
  }
  const end = Date.now() + durationMs
  const frame = () => {
    confetti({
      particleCount: 2,
      startVelocity: 0,
      ticks: 300,
      gravity: 0.5,
      origin: { x: Math.random(), y: -0.05 },
      colors: ['#fb7185', '#f43f5e', '#fda4af', '#f472b6'],
      shapes: heart ? [heart] : ['circle'],
      scalar: 1.6,
      drift: Math.random() - 0.5,
      zIndex: 9999,
    })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}

/** Fireworks-style bursts at random points (~3s). */
export function fireworks(durationMs = 3000): void {
  if (typeof window === 'undefined') return
  if (reducedMotion()) {
    burst({ particleCount: 30 })
    return
  }
  const end = Date.now() + durationMs
  const timer = window.setInterval(() => {
    if (Date.now() > end) {
      window.clearInterval(timer)
      return
    }
    confetti({
      particleCount: 40,
      startVelocity: 30,
      spread: 360,
      ticks: 70,
      origin: { x: 0.15 + Math.random() * 0.7, y: 0.15 + Math.random() * 0.35 },
      colors: ROSE_PALETTE,
      zIndex: 9999,
    })
  }, 280)
}
