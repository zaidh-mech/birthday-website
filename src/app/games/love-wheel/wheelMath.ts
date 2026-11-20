/**
 * Pure helpers for the Wheel of Love: geometry, fair random landing and the
 * spin plan (distance + duration) that makes a flick feel physical.
 *
 * Angles are in degrees, measured clockwise from 12 o'clock. The wheel's
 * rotation is cumulative (it can grow past 360) and positive = clockwise.
 */

export const MIN_SEGMENTS = 2
export const MAX_SEGMENTS = 16

/** Power of the ease-out curve. f(u) = 1 - (1-u)^p, so f'(0) = p. */
export const EASE_POWER = 3

/** Release speeds (deg/s) below this are treated as a tap and get a normal spin. */
export const FLICK_MIN_SPEED = 160
/** Speed range a spin is clamped to (deg/s). */
export const MIN_SPIN_SPEED = 700
export const MAX_SPIN_SPEED = 2600
/** A "normal" spin (button, keyboard, tap) picks a speed in this range. */
export const NORMAL_SPIN_MIN = 1250
export const NORMAL_SPIN_MAX = 1750

export function mod(a: number, n: number): number {
  return ((a % n) + n) % n
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}

export function easeOut(u: number): number {
  return 1 - Math.pow(1 - clamp(u, 0, 1), EASE_POWER)
}

/** Uniform random integer in [0, n), using crypto (with rejection sampling) when available. */
export function randomInt(n: number): number {
  if (n <= 1) return 0
  const c = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined
  if (c && typeof c.getRandomValues === 'function') {
    const buf = new Uint32Array(1)
    const limit = Math.floor(0x100000000 / n) * n
    let x = 0
    do {
      c.getRandomValues(buf)
      x = buf[0]
    } while (x >= limit)
    return x % n
  }
  return Math.floor(Math.random() * n)
}

/** Index of the segment under the top pointer when the wheel is rotated `rotation` degrees clockwise. */
export function segmentAt(rotation: number, count: number): number {
  const seg = 360 / count
  return Math.floor(mod(-rotation, 360) / seg) % count
}

export interface SpinPlan {
  /** Segment the wheel will land on */
  target: number
  from: number
  to: number
  /** milliseconds */
  duration: number
}

/**
 * Picks a uniformly random prize, then works out how far to travel so the
 * wheel lands inside that segment, travelling in the direction of `velocity`
 * and starting at roughly that speed (so a flick hands over smoothly).
 */
export function planSpin({
  from,
  count,
  velocity,
  reduced,
}: {
  from: number
  count: number
  velocity: number
  reduced: boolean
}): SpinPlan {
  const seg = 360 / count
  const target = randomInt(count)
  // Land somewhere inside the segment, never right on a boundary.
  const within = 0.14 + Math.random() * 0.72
  const landingLocal = (target + within) * seg

  const dir = velocity < 0 ? -1 : 1
  const speed = clamp(Math.abs(velocity), MIN_SPIN_SPEED, MAX_SPIN_SPEED)
  const strength = (speed - MIN_SPIN_SPEED) / (MAX_SPIN_SPEED - MIN_SPIN_SPEED)
  const [tMin, tMax] = reduced ? [1.1, 1.8] : [4.2, 6.8]
  const nominalT = tMin + (tMax - tMin) * strength
  // With f'(0) = EASE_POWER, travelling D over T starts at D * p / T deg/s.
  const nominalDist = (speed * nominalT) / EASE_POWER
  const minDist = reduced ? 360 : 360 * 3

  // Final rotation r must satisfy mod(-r, 360) === landingLocal.
  const base = dir > 0 ? mod(-landingLocal - from, 360) : mod(from + landingLocal, 360)
  let dist = base + 360 * Math.max(0, Math.round((nominalDist - base) / 360))
  while (dist < minDist) dist += 360

  const duration = clamp((EASE_POWER * dist) / speed, tMin, tMax) * 1000
  return { target, from, to: from + dir * dist, duration }
}

/* ---------- drawing helpers ---------- */

const round = (n: number) => Math.round(n * 100) / 100

/** Point on a circle of radius r at `deg` clockwise from 12 o'clock (SVG coordinates, centre 0,0). */
export function polar(r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180
  return [round(r * Math.sin(a)), round(-r * Math.cos(a))]
}

export function wedgePath(index: number, count: number, r: number): string {
  const seg = 360 / count
  const [x0, y0] = polar(r, index * seg)
  const [x1, y1] = polar(r, (index + 1) * seg)
  const large = seg > 180 ? 1 : 0
  return `M0 0 L${x0} ${y0} A${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`
}

/**
 * Assigns one of `paletteSize` fills to each segment so neighbours never
 * match, including the wrap-around between the last and first segment.
 */
export function segmentColors(count: number, paletteSize = 4): number[] {
  const colors = Array.from({ length: count }, (_, i) => i % paletteSize)
  if (count > 2 && colors[count - 1] === colors[0]) {
    const prev = colors[count - 2]
    colors[count - 1] = [1, 2, 3, 0].find((c) => c !== prev && c !== colors[0]) ?? 1
  }
  return colors
}

/** Splits a label into one or two balanced lines. */
export function splitLabel(label: string, maxOneLine: number): string[] {
  const clean = label.trim().replace(/\s+/g, ' ')
  const words = clean.split(' ')
  const fit = (s: string) => (s.length > 16 ? `${s.slice(0, 15).trimEnd()}…` : s)
  if (clean.length <= maxOneLine || words.length < 2) return [fit(clean)]
  let best: string[] = [clean]
  let bestLen = Infinity
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ')
    const b = words.slice(i).join(' ')
    const longest = Math.max(a.length, b.length)
    if (longest < bestLen) {
      bestLen = longest
      best = [a, b]
    }
  }
  return best.map(fit)
}

export interface LabelLayout {
  lines: string[]
  fontSize: number
  emojiSize: number
}

/** Font sizes that keep the label inside its wedge for 2–16 segments. */
export function layoutLabel(label: string, count: number, radius: number, rStart: number, rEnd: number): LabelLayout {
  const segRad = (2 * Math.PI) / count
  const base = count <= 4 ? 22 : count <= 6 ? 19 : count <= 8 ? 17 : count <= 12 ? 15 : 13
  const lines = splitLabel(label, count <= 4 ? 12 : 10)
  const longest = Math.max(...lines.map((l) => l.length), 1)
  const avail = rEnd - rStart
  const byLength = avail / (longest * 0.6)
  const chordAt = Math.min(2 * (rStart + avail * 0.4) * Math.sin(Math.min(segRad, Math.PI) / 2) * 0.82, radius)
  const byWidth = chordAt / (lines.length * 1.12)
  const fontSize = round(clamp(Math.min(base, byLength, byWidth), 8, base))
  const emojiBase = count <= 4 ? 36 : count <= 6 ? 31 : count <= 8 ? 27 : count <= 12 ? 23 : 19
  const emojiChord = 2 * radius * 0.84 * Math.sin(Math.min(segRad, Math.PI) / 2) * 0.62
  const emojiSize = round(clamp(Math.min(emojiBase, emojiChord), 12, emojiBase))
  return { lines, fontSize, emojiSize }
}
