'use client'

/**
 * Canvas helpers for the scratch-off foil: painting the metallic cover,
 * the eraser brush and measuring how much has been scratched away.
 */

export const BRUSH_RADIUS = 22

export interface Pt {
  x: number
  y: number
}

const LIGHT_STOPS = ['#d9a6a4', '#f7e4df', '#c38d8f', '#f3d6d2', '#b47f83', '#efcfca']
const DARK_STOPS = ['#a196d2', '#e8e2fb', '#887abf', '#d8cff5', '#7264b0', '#cbc1f1']

function seeded(seed: number): () => number {
  let t = (seed * 2654435761) >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function heart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.beginPath()
  ctx.moveTo(x, y + s * 0.9)
  ctx.bezierCurveTo(x - s * 1.2, y + s * 0.1, x - s * 0.65, y - s * 0.95, x, y - s * 0.25)
  ctx.bezierCurveTo(x + s * 0.65, y - s * 0.95, x + s * 1.2, y + s * 0.1, x, y + s * 0.9)
  ctx.closePath()
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

/** Paints a fresh foil over the whole canvas (CSS-pixel coordinates; caller sets the DPR transform). */
export function paintFoil(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  { dark, seed, fontFamily }: { dark: boolean; seed: number; fontFamily: string },
): void {
  const rand = seeded(seed + 1)
  ctx.save()
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
  ctx.setLineDash([])
  ctx.clearRect(0, 0, w, h)

  // Metallic base.
  const stops = dark ? DARK_STOPS : LIGHT_STOPS
  const base = ctx.createLinearGradient(0, 0, w, h)
  stops.forEach((c, i) => base.addColorStop(i / (stops.length - 1), c))
  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)

  // Brushed-metal streaks.
  ctx.lineWidth = 1
  for (let x = -h; x < w; x += 3) {
    ctx.globalAlpha = 0.03 + rand() * 0.07
    ctx.strokeStyle = rand() > 0.45 ? '#ffffff' : '#3b0a1e'
    ctx.beginPath()
    ctx.moveTo(x, h)
    ctx.lineTo(x + h * 0.9, 0)
    ctx.stroke()
  }

  // Glossy sheen.
  ctx.globalAlpha = 1
  const sheen = ctx.createLinearGradient(0, 0, w, h * 0.7)
  sheen.addColorStop(0.25, 'rgba(255,255,255,0)')
  sheen.addColorStop(0.42, 'rgba(255,255,255,0.5)')
  sheen.addColorStop(0.58, 'rgba(255,255,255,0)')
  ctx.fillStyle = sheen
  ctx.fillRect(0, 0, w, h)

  // Tiny heart pattern.
  ctx.fillStyle = '#ffffff'
  const step = 22
  for (let row = 0, y = 9; y < h + step; row++, y += step) {
    for (let x = (row % 2) * (step / 2) + 8; x < w + step; x += step) {
      ctx.globalAlpha = 0.14 + rand() * 0.16
      heart(ctx, x, y, 3.3)
      ctx.fill()
    }
  }

  // Dashed inner border.
  ctx.globalAlpha = 0.6
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1.5
  ctx.setLineDash([5, 5])
  roundedRect(ctx, 6, 6, w - 12, h - 12, 10)
  ctx.stroke()
  ctx.setLineDash([])

  // "Scratch me" label on a frosted pill.
  ctx.globalAlpha = 1
  const fs = Math.max(15, Math.min(22, w / 11, h / 5))
  ctx.font = `700 ${fs}px ${fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const text = 'Scratch me ✨'
  const tw = ctx.measureText(text).width
  const pw = Math.min(w - 24, tw + fs * 1.6)
  const ph = fs * 2.1
  ctx.shadowColor = 'rgba(76,5,25,0.18)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 2
  ctx.fillStyle = dark ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.55)'
  roundedRect(ctx, w / 2 - pw / 2, h / 2 - ph / 2, pw, ph, ph / 2)
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
  ctx.fillStyle = dark ? '#3b1d6e' : '#881337'
  ctx.fillText(text, w / 2, h / 2 + 1, w - 32)

  ctx.restore()
}

/** Switches the context to "eraser" mode with a round brush. */
export function setupBrush(ctx: CanvasRenderingContext2D): void {
  ctx.globalCompositeOperation = 'destination-out'
  ctx.globalAlpha = 1
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = BRUSH_RADIUS * 2
  ctx.strokeStyle = '#000'
  ctx.fillStyle = '#000'
}

export function eraseDot(ctx: CanvasRenderingContext2D, p: Pt): void {
  ctx.beginPath()
  ctx.arc(p.x, p.y, BRUSH_RADIUS, 0, Math.PI * 2)
  ctx.fill()
}

/** Smooth segment: from the previous midpoint, curving through the last point, to the new midpoint. */
export function eraseCurve(ctx: CanvasRenderingContext2D, from: Pt, ctrl: Pt, to: Pt): void {
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.quadraticCurveTo(ctrl.x, ctrl.y, to.x, to.y)
  ctx.stroke()
}

export function eraseLine(ctx: CanvasRenderingContext2D, from: Pt, to: Pt): void {
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke()
}

/** Re-applies recorded strokes (points in CSS pixels). */
export function replayStrokes(ctx: CanvasRenderingContext2D, strokes: Pt[][]): void {
  setupBrush(ctx)
  for (const pts of strokes) {
    if (pts.length === 0) continue
    eraseDot(ctx, pts[0])
    let mid = pts[0]
    for (let i = 1; i < pts.length; i++) {
      const m = { x: (pts[i - 1].x + pts[i].x) / 2, y: (pts[i - 1].y + pts[i].y) / 2 }
      eraseCurve(ctx, mid, pts[i - 1], m)
      mid = m
    }
    if (pts.length > 1) eraseLine(ctx, mid, pts[pts.length - 1])
  }
}

let sampler: HTMLCanvasElement | null = null

/** Fraction (0–1) of the canvas that has been scratched clear, measured on a small downscaled copy. */
export function clearedRatio(source: HTMLCanvasElement): number {
  if (!source.width || !source.height || typeof document === 'undefined') return 0
  if (!sampler) sampler = document.createElement('canvas')
  const sw = 48
  const sh = Math.max(8, Math.round((sw * source.height) / source.width))
  sampler.width = sw
  sampler.height = sh
  const sctx = sampler.getContext('2d', { willReadFrequently: true })
  if (!sctx) return 0
  sctx.clearRect(0, 0, sw, sh)
  sctx.drawImage(source, 0, 0, sw, sh)
  let data: Uint8ClampedArray
  try {
    data = sctx.getImageData(0, 0, sw, sh).data
  } catch {
    return 0
  }
  let clear = 0
  for (let i = 3; i < data.length; i += 4) if (data[i] < 80) clear++
  return clear / (sw * sh)
}
