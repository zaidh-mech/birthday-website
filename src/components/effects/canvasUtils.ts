/**
 * Small helpers shared by the canvas effects (background sky, cursor trail,
 * tap hearts). Sprites are drawn once into offscreen canvases and then
 * stamped with drawImage, which is far cheaper than re-tracing paths and
 * gradients every frame.
 */

export const TAU = Math.PI * 2

export function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

export function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)]
}

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v
}

/** Roughly normal-distributed number in about [-1.5, 1.5]. */
export function gauss(): number {
  return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5
}

export function smoothstep(t: number): number {
  const x = clamp(t, 0, 1)
  return x * x * (3 - 2 * x)
}

export function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  const x = clamp(t, 0, 1) - 1
  return 1 + c3 * x * x * x + c1 * x * x
}

/** Device pixel ratio, capped so 3x phones don't pay for pixels nobody can see. */
export function capDpr(max = 2): number {
  if (typeof window === 'undefined') return 1
  return Math.max(1, Math.min(max, window.devicePixelRatio || 1))
}

export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h, 16)
  if (Number.isNaN(n)) return [255, 255, 255]
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r},${g},${b},${alpha})`
}

/** Mixes a colour towards white (amount 0–1). */
export function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  const m = (c: number) => Math.round(c + (255 - c) * amount)
  return `rgb(${m(r)},${m(g)},${m(b)})`
}

export function makeSprite(size: number, draw: (g: CanvasRenderingContext2D, size: number) => void): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const g = canvas.getContext('2d')
  if (g) draw(g, size)
  return canvas
}

/** Traces a heart centred on (cx, cy) that fits in a `size` × `size` box. */
export function traceHeart(g: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  const x = (v: number) => cx + v * size
  const y = (v: number) => cy + (v - 0.04) * size
  g.beginPath()
  g.moveTo(x(0), y(-0.22))
  g.bezierCurveTo(x(0), y(-0.48), x(-0.5), y(-0.48), x(-0.5), y(-0.14))
  g.bezierCurveTo(x(-0.5), y(0.16), x(-0.12), y(0.3), x(0), y(0.5))
  g.bezierCurveTo(x(0.12), y(0.3), x(0.5), y(0.16), x(0.5), y(-0.14))
  g.bezierCurveTo(x(0.5), y(-0.48), x(0), y(-0.48), x(0), y(-0.22))
  g.closePath()
}

/** Four-pointed twinkle star. `waist` controls how thin the arms are. */
export function traceSparkle(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, waist: number): void {
  g.beginPath()
  g.moveTo(cx, cy - r)
  g.quadraticCurveTo(cx + waist, cy - waist, cx + r, cy)
  g.quadraticCurveTo(cx + waist, cy + waist, cx, cy + r)
  g.quadraticCurveTo(cx - waist, cy + waist, cx - r, cy)
  g.quadraticCurveTo(cx - waist, cy - waist, cx, cy - r)
  g.closePath()
}

/** Glossy little heart. */
export function heartSprite(color: string, size = 64): HTMLCanvasElement {
  return makeSprite(size, (g, s) => {
    const pad = s * 0.06
    const grad = g.createLinearGradient(pad, pad, s - pad, s - pad)
    grad.addColorStop(0, lighten(color, 0.4))
    grad.addColorStop(1, color)
    g.fillStyle = grad
    traceHeart(g, s / 2, s / 2, s - pad * 2)
    g.fill()
    g.globalAlpha = 0.5
    g.fillStyle = '#ffffff'
    g.beginPath()
    g.ellipse(s * 0.33, s * 0.32, s * 0.09, s * 0.05, -0.65, 0, TAU)
    g.fill()
    g.globalAlpha = 1
  })
}

/** Twinkle star with a soft halo. */
export function sparkleSprite(color: string, size = 64): HTMLCanvasElement {
  return makeSprite(size, (g, s) => {
    const c = s / 2
    const glow = g.createRadialGradient(c, c, 0, c, c, c)
    glow.addColorStop(0, rgba(color, 0.55))
    glow.addColorStop(0.35, rgba(color, 0.14))
    glow.addColorStop(1, rgba(color, 0))
    g.fillStyle = glow
    g.fillRect(0, 0, s, s)
    g.fillStyle = lighten(color, 0.55)
    traceSparkle(g, c, c, s * 0.46, s * 0.06)
    g.fill()
  })
}

/** Round glow: white-hot core fading out through `color`. `core` is the core radius (0–0.35). */
export function glowSprite(color: string, size = 32, core = 0.12): HTMLCanvasElement {
  return makeSprite(size, (g, s) => {
    const c = s / 2
    const k = clamp(core, 0.02, 0.35)
    const grad = g.createRadialGradient(c, c, 0, c, c, c)
    grad.addColorStop(0, '#ffffff')
    grad.addColorStop(k, rgba(color, 0.95))
    grad.addColorStop(k * 2.6, rgba(color, 0.28))
    grad.addColorStop(1, rgba(color, 0))
    g.fillStyle = grad
    g.fillRect(0, 0, s, s)
  })
}
