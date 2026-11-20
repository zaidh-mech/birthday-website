/**
 * Heart Catcher: theme palettes and pre-rendered sprites.
 *
 * Anything with gradients, glows or shadows is drawn once into an offscreen
 * canvas here (shadowBlur is expensive on phones), so a frame is mostly
 * cheap drawImage calls. Sprites are rebuilt on resize and theme change.
 */

import { BASE_RADIUS, PARTICLE_COLORS } from './entities'

const TAU = Math.PI * 2

export interface Sprite {
  c: HTMLCanvasElement
  /** draw size in CSS px */
  w: number
  h: number
}

export interface Palette {
  dark: boolean
  hudText: string
  hudLabel: string
  textStroke: string
  heartText: string
  goldText: string
  photoText: string
  powerText: string
  hitText: string
  mutedText: string
  glassFill: string
  glassStroke: string
  glassHighlight: string
  rimFill: string
  mouthFill: string
  ribbon: string
  ribbonKnot: string
  liquidTop: string
  liquidBottom: string
  shadow: string
  star: string
  slowTint: string
  endDim: string
  bannerText: string
  bannerSub: string
  magnet: string
  chipFill: string
}

const LIGHT: Palette = {
  dark: false,
  hudText: '#881337',
  hudLabel: '#f43f5e',
  textStroke: 'rgba(255,250,246,0.92)',
  heartText: '#e11d48',
  goldText: '#b45309',
  photoText: '#db2777',
  powerText: '#7c3aed',
  hitText: '#9f1239',
  mutedText: '#78716c',
  glassFill: 'rgba(255,255,255,0.5)',
  glassStroke: 'rgba(225,29,72,0.55)',
  glassHighlight: 'rgba(255,255,255,0.9)',
  rimFill: 'rgba(255,255,255,0.8)',
  mouthFill: 'rgba(253,164,175,0.45)',
  ribbon: '#f43f5e',
  ribbonKnot: '#be123c',
  liquidTop: 'rgba(253,164,175,0.85)',
  liquidBottom: 'rgba(225,29,72,0.85)',
  shadow: 'rgba(190,18,60,0.16)',
  star: '#ffffff',
  slowTint: 'rgba(167,139,250,0.14)',
  endDim: '#fff1f2',
  bannerText: '#be123c',
  bannerSub: '#9f1239',
  magnet: '#f59e0b',
  chipFill: 'rgba(255,255,255,0.72)',
}

const DARK: Palette = {
  dark: true,
  hudText: '#f5f3ff',
  hudLabel: '#d8b4fe',
  textStroke: 'rgba(11,12,16,0.78)',
  heartText: '#f9a8d4',
  goldText: '#fcd34d',
  photoText: '#f0abfc',
  powerText: '#c4b5fd',
  hitText: '#fda4af',
  mutedText: '#a1a1aa',
  glassFill: 'rgba(196,181,253,0.12)',
  glassStroke: 'rgba(216,180,254,0.8)',
  glassHighlight: 'rgba(255,255,255,0.6)',
  rimFill: 'rgba(221,214,254,0.28)',
  mouthFill: 'rgba(76,29,149,0.55)',
  ribbon: '#c084fc',
  ribbonKnot: '#9333ea',
  liquidTop: 'rgba(244,114,182,0.8)',
  liquidBottom: 'rgba(147,51,234,0.85)',
  shadow: 'rgba(0,0,0,0.45)',
  star: '#f5f3ff',
  slowTint: 'rgba(99,102,241,0.18)',
  endDim: '#0b0c10',
  bannerText: '#fbcfe8',
  bannerSub: '#d8b4fe',
  magnet: '#fcd34d',
  chipFill: 'rgba(30,27,46,0.72)',
}

export function getPalette(dark: boolean): Palette {
  return dark ? DARK : LIGHT
}

export interface FontFamilies {
  serif: string
  sans: string
  cursive: string
}

/** Reads the next/font families from the CSS variables set on <body>, with safe fallbacks. */
export function readFontFamilies(): FontFamilies {
  const fallback: FontFamilies = {
    serif: 'Georgia, "Times New Roman", serif',
    sans: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    cursive: '"Brush Script MT", cursive',
  }
  if (typeof document === 'undefined') return fallback
  try {
    const style = getComputedStyle(document.body)
    const pick = (name: string, fb: string) => {
      const v = style.getPropertyValue(name).trim()
      return v ? `${v}, ${fb}` : fb
    }
    return {
      serif: pick('--font-playfair', fallback.serif),
      sans: pick('--font-inter', fallback.sans),
      cursive: pick('--font-dancing', fallback.cursive),
    }
  } catch {
    return fallback
  }
}

/* ------------------------------------------------------------------ */
/* Path helpers (also used by the per-frame renderer)                   */
/* ------------------------------------------------------------------ */

/** A heart centred on (cx, cy), `width` wide (height ≈ 0.89 × width). */
export function heartPath(g: CanvasRenderingContext2D, cx: number, cy: number, width: number): void {
  const k = width / 2
  const y = cy - 0.1 * k
  g.beginPath()
  g.moveTo(cx, y + k)
  g.bezierCurveTo(cx - 0.15 * k, y + 0.85 * k, cx - k, y + 0.35 * k, cx - k, y - 0.25 * k)
  g.bezierCurveTo(cx - k, y - 0.75 * k, cx - 0.45 * k, y - k, cx, y - 0.55 * k)
  g.bezierCurveTo(cx + 0.45 * k, y - k, cx + k, y - 0.75 * k, cx + k, y - 0.25 * k)
  g.bezierCurveTo(cx + k, y + 0.35 * k, cx + 0.15 * k, y + 0.85 * k, cx, y + k)
  g.closePath()
}

/** Four-point twinkle. */
export function sparklePath(g: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  g.beginPath()
  g.moveTo(x, y - s)
  g.quadraticCurveTo(x, y, x + s, y)
  g.quadraticCurveTo(x, y, x, y + s)
  g.quadraticCurveTo(x, y, x - s, y)
  g.quadraticCurveTo(x, y, x, y - s)
  g.closePath()
}

function starPath(g: CanvasRenderingContext2D, x: number, y: number, points: number, outer: number, inner: number): void {
  g.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = -Math.PI / 2 + (i * Math.PI) / points
    const px = x + Math.cos(a) * r
    const py = y + Math.sin(a) * r
    if (i === 0) g.moveTo(px, py)
    else g.lineTo(px, py)
  }
  g.closePath()
}

export function roundRectPath(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, begin = true): void {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2))
  if (begin) g.beginPath()
  g.moveTo(x + rr, y)
  g.lineTo(x + w - rr, y)
  g.quadraticCurveTo(x + w, y, x + w, y + rr)
  g.lineTo(x + w, y + h - rr)
  g.quadraticCurveTo(x + w, y + h, x + w - rr, y + h)
  g.lineTo(x + rr, y + h)
  g.quadraticCurveTo(x, y + h, x, y + h - rr)
  g.lineTo(x, y + rr)
  g.quadraticCurveTo(x, y, x + rr, y)
  g.closePath()
}

/** The jar silhouette, origin at the bottom centre, y pointing up (negative). */
export function jarBodyPath(g: CanvasRenderingContext2D, jw: number, jh: number): void {
  const nw = jw * 0.36
  const bw = jw * 0.5
  const rr = jw * 0.2
  g.beginPath()
  g.moveTo(-nw, -jh)
  g.lineTo(-nw, -jh * 0.84)
  g.quadraticCurveTo(-bw, -jh * 0.82, -bw, -jh * 0.64)
  g.lineTo(-bw, -rr)
  g.quadraticCurveTo(-bw, 0, -bw + rr, 0)
  g.lineTo(bw - rr, 0)
  g.quadraticCurveTo(bw, 0, bw, -rr)
  g.lineTo(bw, -jh * 0.64)
  g.quadraticCurveTo(bw, -jh * 0.82, nw, -jh * 0.84)
  g.lineTo(nw, -jh)
  g.closePath()
}

/* ------------------------------------------------------------------ */
/* Sprite factory                                                       */
/* ------------------------------------------------------------------ */

function makeSprite(w: number, h: number, dpr: number, draw: (g: CanvasRenderingContext2D) => void): Sprite {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.ceil(w * dpr))
  c.height = Math.max(1, Math.ceil(h * dpr))
  const g = c.getContext('2d')
  if (g) {
    g.scale(c.width / w, c.height / h)
    g.translate(w / 2, h / 2)
    draw(g)
  }
  return { c, w, h }
}

function noShadow(g: CanvasRenderingContext2D) {
  g.shadowColor = 'transparent'
  g.shadowBlur = 0
  g.shadowOffsetX = 0
  g.shadowOffsetY = 0
}

function glossyHighlight(g: CanvasRenderingContext2D, r: number) {
  g.fillStyle = 'rgba(255,255,255,0.78)'
  g.beginPath()
  g.ellipse(-r * 0.45, -r * 0.36, r * 0.26, r * 0.14, -0.7, 0, TAU)
  g.fill()
  g.beginPath()
  g.arc(-r * 0.12, -r * 0.56, r * 0.065, 0, TAU)
  g.fill()
}

function pinkHeart(r: number, dpr: number, dark: boolean): Sprite {
  const box = r * 2.9
  return makeSprite(box, box, dpr, (g) => {
    g.shadowColor = dark ? 'rgba(244,114,182,0.65)' : 'rgba(225,29,72,0.32)'
    g.shadowBlur = r * (dark ? 0.6 : 0.35)
    g.shadowOffsetY = dark ? 0 : r * 0.12
    const grad = g.createLinearGradient(-r, -r, r, r)
    grad.addColorStop(0, '#fecdd3')
    grad.addColorStop(0.45, '#fb7185')
    grad.addColorStop(1, '#e11d48')
    g.fillStyle = grad
    heartPath(g, 0, 0, r * 2.05)
    g.fill()
    noShadow(g)
    g.lineWidth = r * 0.07
    g.strokeStyle = 'rgba(255,255,255,0.45)'
    g.stroke()
    glossyHighlight(g, r)
  })
}

function goldHeart(r: number, dpr: number): Sprite {
  const box = r * 3.5
  return makeSprite(box, box, dpr, (g) => {
    g.shadowColor = 'rgba(251,191,36,0.95)'
    g.shadowBlur = r * 0.95
    const grad = g.createLinearGradient(-r, -r, r, r)
    grad.addColorStop(0, '#fef9c3')
    grad.addColorStop(0.35, '#fcd34d')
    grad.addColorStop(0.75, '#f59e0b')
    grad.addColorStop(1, '#b45309')
    g.fillStyle = grad
    heartPath(g, 0, 0, r * 2.1)
    g.fill()
    g.fill()
    noShadow(g)
    g.lineWidth = r * 0.08
    g.strokeStyle = 'rgba(255,255,255,0.65)'
    g.stroke()
    glossyHighlight(g, r)
    g.fillStyle = '#ffffff'
    g.shadowColor = 'rgba(255,255,255,0.9)'
    g.shadowBlur = r * 0.3
    sparklePath(g, r * 0.7, -r * 0.72, r * 0.34)
    g.fill()
    noShadow(g)
  })
}

function brokenHeart(r: number, dpr: number, dark: boolean): Sprite {
  const box = r * 2.9
  const zig = [0, -0.62, -0.15, -0.32, 0.1, -0.06, -0.12, 0.22, 0.08, 0.5, 0, 1.15]
  return makeSprite(box, box, dpr, (g) => {
    for (const side of [-1, 1]) {
      g.save()
      g.translate(side * r * 0.1, -r * 0.02)
      g.rotate(side * 0.12)
      g.beginPath()
      g.moveTo(0, -r * 1.3)
      for (let i = 0; i < zig.length; i += 2) g.lineTo(zig[i] * r, zig[i + 1] * r)
      g.lineTo(side * r * 1.4, r * 1.15)
      g.lineTo(side * r * 1.4, -r * 1.3)
      g.closePath()
      g.clip()
      g.shadowColor = dark ? 'rgba(0,0,0,0.6)' : 'rgba(41,37,36,0.35)'
      g.shadowBlur = r * 0.3
      g.shadowOffsetY = r * 0.1
      const grad = g.createLinearGradient(-r, -r, r, r)
      if (dark) {
        grad.addColorStop(0, '#e4e4e7')
        grad.addColorStop(0.5, '#a1a1aa')
        grad.addColorStop(1, '#52525b')
      } else {
        grad.addColorStop(0, '#a8a29e')
        grad.addColorStop(0.5, '#78716c')
        grad.addColorStop(1, '#44403c')
      }
      g.fillStyle = grad
      heartPath(g, 0, 0, r * 2.0)
      g.fill()
      noShadow(g)
      g.lineWidth = r * 0.1
      g.strokeStyle = 'rgba(244,63,94,0.85)'
      g.stroke()
      g.restore()
    }
    // a sad little face so it reads as "avoid me"
    g.strokeStyle = dark ? '#27272a' : '#fafaf9'
    g.lineWidth = r * 0.09
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(-r * 0.58, -r * 0.2)
    g.lineTo(-r * 0.32, -r * 0.08)
    g.moveTo(r * 0.58, -r * 0.2)
    g.lineTo(r * 0.32, -r * 0.08)
    g.stroke()
    g.beginPath()
    g.arc(0, r * 0.42, r * 0.2, Math.PI * 1.15, Math.PI * 1.85)
    g.stroke()
  })
}

function cloud(r: number, dpr: number, dark: boolean): Sprite {
  return makeSprite(r * 3.0, r * 2.3, dpr, (g) => {
    g.translate(0, -r * 0.05)
    g.shadowColor = dark ? 'rgba(0,0,0,0.55)' : 'rgba(30,41,59,0.28)'
    g.shadowBlur = r * 0.35
    g.shadowOffsetY = r * 0.12
    const grad = g.createLinearGradient(0, -r * 0.9, 0, r * 0.6)
    if (dark) {
      grad.addColorStop(0, '#cbd5e1')
      grad.addColorStop(0.6, '#94a3b8')
      grad.addColorStop(1, '#64748b')
    } else {
      grad.addColorStop(0, '#f8fafc')
      grad.addColorStop(0.55, '#cbd5e1')
      grad.addColorStop(1, '#94a3b8')
    }
    g.fillStyle = grad
    g.beginPath()
    g.moveTo(-0.14 * r, 0.1 * r)
    g.arc(-0.62 * r, 0.1 * r, 0.48 * r, 0, TAU)
    g.moveTo(0.52 * r, -0.22 * r)
    g.arc(-0.1 * r, -0.22 * r, 0.62 * r, 0, TAU)
    g.moveTo(1.05 * r, 0.02 * r)
    g.arc(0.55 * r, 0.02 * r, 0.5 * r, 0, TAU)
    roundRectPath(g, -1.08 * r, 0.02 * r, 2.12 * r, 0.56 * r, 0.27 * r, false)
    g.fill()
    noShadow(g)
    // face
    g.fillStyle = '#334155'
    g.beginPath()
    g.arc(-0.34 * r, 0.14 * r, 0.075 * r, 0, TAU)
    g.arc(0.22 * r, 0.14 * r, 0.075 * r, 0, TAU)
    g.fill()
    g.strokeStyle = '#334155'
    g.lineWidth = 0.06 * r
    g.lineCap = 'round'
    g.beginPath()
    g.arc(-0.06 * r, 0.46 * r, 0.15 * r, Math.PI * 1.15, Math.PI * 1.85)
    g.stroke()
    // angry brows
    g.beginPath()
    g.moveTo(-0.48 * r, -0.04 * r)
    g.lineTo(-0.24 * r, 0.03 * r)
    g.moveTo(0.36 * r, -0.04 * r)
    g.lineTo(0.12 * r, 0.03 * r)
    g.stroke()
  })
}

function bubble(g: CanvasRenderingContext2D, r: number, inner: string, outer: string, ring: string, glow: string) {
  g.shadowColor = glow
  g.shadowBlur = r * 0.6
  const grad = g.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r)
  grad.addColorStop(0, 'rgba(255,255,255,0.97)')
  grad.addColorStop(0.6, inner)
  grad.addColorStop(1, outer)
  g.fillStyle = grad
  g.beginPath()
  g.arc(0, 0, r, 0, TAU)
  g.fill()
  noShadow(g)
  g.lineWidth = r * 0.09
  g.strokeStyle = ring
  g.stroke()
}

function bubbleGloss(g: CanvasRenderingContext2D, r: number) {
  g.beginPath()
  g.arc(0, 0, r * 0.78, Math.PI * 1.08, Math.PI * 1.42)
  g.strokeStyle = 'rgba(255,255,255,0.9)'
  g.lineWidth = r * 0.1
  g.lineCap = 'round'
  g.stroke()
}

function magnetBubble(r: number, dpr: number): Sprite {
  const box = r * 3
  return makeSprite(box, box, dpr, (g) => {
    bubble(g, r, 'rgba(254,243,199,0.9)', 'rgba(251,191,36,0.6)', '#f59e0b', 'rgba(251,191,36,0.75)')
    const grad = g.createLinearGradient(0, -r * 0.55, 0, r * 0.5)
    grad.addColorStop(0, '#fef08a')
    grad.addColorStop(1, '#f59e0b')
    g.fillStyle = grad
    starPath(g, 0, r * 0.04, 5, r * 0.58, r * 0.26)
    g.fill()
    g.lineWidth = r * 0.06
    g.strokeStyle = '#d97706'
    g.lineJoin = 'round'
    g.stroke()
    bubbleGloss(g, r)
  })
}

function slowBubble(r: number, dpr: number): Sprite {
  const box = r * 3
  return makeSprite(box, box, dpr, (g) => {
    bubble(g, r, 'rgba(237,233,254,0.92)', 'rgba(167,139,250,0.65)', '#8b5cf6', 'rgba(139,92,246,0.7)')
    g.fillStyle = '#ffffff'
    g.beginPath()
    g.arc(0, 0, r * 0.52, 0, TAU)
    g.fill()
    g.lineWidth = r * 0.09
    g.strokeStyle = '#7c3aed'
    g.stroke()
    g.lineCap = 'round'
    g.lineWidth = r * 0.06
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2
      g.beginPath()
      g.moveTo(Math.cos(a) * r * 0.38, Math.sin(a) * r * 0.38)
      g.lineTo(Math.cos(a) * r * 0.46, Math.sin(a) * r * 0.46)
      g.stroke()
    }
    g.lineWidth = r * 0.08
    g.beginPath()
    g.moveTo(0, 0)
    g.lineTo(0, -r * 0.34)
    g.moveTo(0, 0)
    g.lineTo(r * 0.24, r * 0.06)
    g.stroke()
    g.fillStyle = '#7c3aed'
    g.beginPath()
    g.arc(0, 0, r * 0.07, 0, TAU)
    g.fill()
    bubbleGloss(g, r)
  })
}

function lifeBubble(r: number, dpr: number): Sprite {
  const box = r * 3
  return makeSprite(box, box, dpr, (g) => {
    bubble(g, r, 'rgba(255,228,230,0.92)', 'rgba(52,211,153,0.55)', '#10b981', 'rgba(16,185,129,0.6)')
    const grad = g.createLinearGradient(-r * 0.5, -r * 0.5, r * 0.5, r * 0.5)
    grad.addColorStop(0, '#fda4af')
    grad.addColorStop(1, '#e11d48')
    g.fillStyle = grad
    heartPath(g, 0, r * 0.04, r * 1.2)
    g.fill()
    g.fillStyle = '#ffffff'
    g.fillRect(-r * 0.2, -r * 0.05, r * 0.4, r * 0.12)
    g.fillRect(-r * 0.06, -r * 0.19, r * 0.12, r * 0.4)
    bubbleGloss(g, r)
  })
}

function softDot(color: string, dpr: number): Sprite {
  const s = 16
  return makeSprite(s, s, dpr, (g) => {
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, s / 2)
    grad.addColorStop(0, color)
    grad.addColorStop(0.45, color)
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.beginPath()
    g.arc(0, 0, s / 2, 0, TAU)
    g.fill()
  })
}

function tinyHeart(color: string, dpr: number): Sprite {
  const s = 16
  return makeSprite(s, s, dpr, (g) => {
    g.fillStyle = color
    heartPath(g, 0, 0, 14)
    g.fill()
  })
}

function spark(dpr: number): Sprite {
  const s = 18
  return makeSprite(s, s, dpr, (g) => {
    g.shadowColor = 'rgba(253,230,138,0.95)'
    g.shadowBlur = 4
    g.fillStyle = '#ffffff'
    sparklePath(g, 0, 0, 7)
    g.fill()
  })
}

function bokeh(dpr: number, color: string): Sprite {
  const s = 40
  return makeSprite(s, s, dpr, (g) => {
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, s / 2)
    grad.addColorStop(0, color)
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.beginPath()
    g.arc(0, 0, s / 2, 0, TAU)
    g.fill()
  })
}

function bgHeart(dpr: number, dark: boolean): Sprite {
  const s = 28
  return makeSprite(s, s, dpr, (g) => {
    g.fillStyle = dark ? '#c084fc' : '#fda4af'
    if (dark) {
      g.shadowColor = 'rgba(192,132,252,0.8)'
      g.shadowBlur = 6
    }
    heartPath(g, 0, 0, 20)
    g.fill()
  })
}

function hudHeart(size: number, dpr: number, full: boolean, dark: boolean): Sprite {
  return makeSprite(size + 4, size + 4, dpr, (g) => {
    heartPath(g, 0, 0, size)
    if (full) {
      const grad = g.createLinearGradient(-size / 2, -size / 2, size / 2, size / 2)
      grad.addColorStop(0, '#fda4af')
      grad.addColorStop(1, '#e11d48')
      g.fillStyle = grad
      g.fill()
      g.lineWidth = 1.2
      g.strokeStyle = 'rgba(255,255,255,0.7)'
      g.stroke()
    } else {
      g.fillStyle = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)'
      g.fill()
      g.lineWidth = 1.6
      g.strokeStyle = dark ? 'rgba(216,180,254,0.45)' : 'rgba(244,63,94,0.4)'
      g.stroke()
    }
  })
}

function glow(size: number, dpr: number, color: string): Sprite {
  return makeSprite(size, size, dpr, (g) => {
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, size / 2)
    grad.addColorStop(0, color)
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.beginPath()
    g.arc(0, 0, size / 2, 0, TAU)
    g.fill()
  })
}

/** Full-size static backdrop: sky gradient, glows, moon (dark) and rolling hills. */
function backdrop(W: number, H: number, unit: number, dpr: number, dark: boolean): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(W * dpr))
  c.height = Math.max(1, Math.round(H * dpr))
  const g = c.getContext('2d')
  if (!g) return c
  g.scale(dpr, dpr)

  const sky = g.createLinearGradient(0, 0, 0, H)
  if (dark) {
    sky.addColorStop(0, '#0b0c10')
    sky.addColorStop(0.55, '#120f22')
    sky.addColorStop(1, '#22163a')
  } else {
    sky.addColorStop(0, '#fffaf5')
    sky.addColorStop(0.55, '#fff1f2')
    sky.addColorStop(1, '#ffe4e6')
  }
  g.fillStyle = sky
  g.fillRect(0, 0, W, H)

  const blob = (x: number, y: number, r: number, color: string) => {
    const grad = g.createRadialGradient(x, y, 0, x, y, r)
    grad.addColorStop(0, color)
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.fillRect(x - r, y - r, r * 2, r * 2)
  }

  if (dark) {
    blob(W * 0.82, H * 0.13, Math.max(W, H) * 0.42, 'rgba(196,181,253,0.2)')
    blob(W * 0.12, H * 0.55, Math.max(W, H) * 0.55, 'rgba(147,51,234,0.12)')
    blob(W * 0.5, H * 1.05, Math.max(W, H) * 0.6, 'rgba(244,114,182,0.14)')
    // crescent moon, cut out on its own little canvas
    const mr = Math.max(10, 15 * unit)
    const moon = document.createElement('canvas')
    moon.width = Math.ceil(mr * 3 * dpr)
    moon.height = Math.ceil(mr * 3 * dpr)
    const m = moon.getContext('2d')
    if (m) {
      m.scale(dpr, dpr)
      m.shadowColor = 'rgba(237,233,254,0.9)'
      m.shadowBlur = mr * 0.8
      m.fillStyle = '#f5f3ff'
      m.beginPath()
      m.arc(mr * 1.5, mr * 1.5, mr, 0, TAU)
      m.fill()
      m.shadowColor = 'transparent'
      m.globalCompositeOperation = 'destination-out'
      m.beginPath()
      m.arc(mr * 1.5 + mr * 0.45, mr * 1.5 - mr * 0.25, mr * 0.88, 0, TAU)
      m.fill()
      g.drawImage(moon, W * 0.84 - mr * 1.5, H * 0.13 - mr * 1.5, mr * 3, mr * 3)
    }
  } else {
    blob(W * 0.15, H * 0.1, Math.max(W, H) * 0.55, 'rgba(255,228,230,0.95)')
    blob(W * 0.92, H * 0.32, Math.max(W, H) * 0.45, 'rgba(254,215,170,0.35)')
    blob(W * 0.5, H * 1.05, Math.max(W, H) * 0.6, 'rgba(251,113,133,0.16)')
  }

  // rolling hills along the bottom
  const hill = (base: number, amp: number, phase: number, color: string) => {
    g.fillStyle = color
    g.beginPath()
    g.moveTo(0, H)
    const steps = 6
    g.lineTo(0, base + Math.sin(phase) * amp)
    for (let i = 1; i <= steps; i++) {
      const x0 = ((i - 0.5) / steps) * W
      const x1 = (i / steps) * W
      g.quadraticCurveTo(x0, base + Math.sin(phase + i * 1.3 - 0.6) * amp * 1.6, x1, base + Math.sin(phase + i * 1.3) * amp)
    }
    g.lineTo(W, H)
    g.closePath()
    g.fill()
  }
  hill(H - 26 * unit, 6 * unit, 0.4, dark ? 'rgba(59,7,100,0.55)' : 'rgba(251,207,232,0.55)')
  hill(H - 14 * unit, 4 * unit, 2.1, dark ? 'rgba(88,28,135,0.5)' : 'rgba(253,164,175,0.42)')

  return c
}

export interface Sprites {
  heart: Sprite
  gold: Sprite
  broken: Sprite
  cloud: Sprite
  magnet: Sprite
  slow: Sprite
  life: Sprite
  innerHeart: Sprite
  jarGlow: Sprite
  lifeFull: Sprite
  lifeEmpty: Sprite
  bgHeart: Sprite
  bokeh: Sprite
  dots: Sprite[]
  hearts: Sprite[]
  spark: Sprite
  background: HTMLCanvasElement
  /** local-space gradient for the jar's liquid (jar coords are stable) */
  liquid: CanvasGradient | null
  flash: CanvasGradient | null
  dash: number[]
  photos: (Sprite | null)[]
  polaroids: (Sprite | null)[]
}

export function buildSprites(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  unit: number,
  hu: number,
  dpr: number,
  jarW: number,
  jarH: number,
  dark: boolean,
): Sprites {
  const pal = getPalette(dark)
  const r = (k: keyof typeof BASE_RADIUS) => BASE_RADIUS[k] * unit

  const liquid = ctx.createLinearGradient(0, -jarH * 0.8, 0, 0)
  liquid.addColorStop(0, pal.liquidTop)
  liquid.addColorStop(1, pal.liquidBottom)

  const flash = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.75)
  flash.addColorStop(0, 'rgba(244,63,94,0)')
  flash.addColorStop(1, 'rgba(225,29,72,0.9)')

  return {
    heart: pinkHeart(r('heart'), dpr, dark),
    gold: goldHeart(r('gold'), dpr),
    broken: brokenHeart(r('broken'), dpr, dark),
    cloud: cloud(r('cloud'), dpr, dark),
    magnet: magnetBubble(r('magnet'), dpr),
    slow: slowBubble(r('slow'), dpr),
    life: lifeBubble(r('life'), dpr),
    innerHeart: pinkHeart(jarW * 0.2, dpr, dark),
    jarGlow: glow(jarW * 1.9, dpr, dark ? 'rgba(216,180,254,0.55)' : 'rgba(251,113,133,0.5)'),
    lifeFull: hudHeart(16 * hu, dpr, true, dark),
    lifeEmpty: hudHeart(16 * hu, dpr, false, dark),
    bgHeart: bgHeart(dpr, dark),
    bokeh: bokeh(dpr, dark ? 'rgba(192,132,252,0.55)' : 'rgba(255,255,255,0.95)'),
    dots: PARTICLE_COLORS.map((c) => softDot(c, dpr)),
    hearts: PARTICLE_COLORS.map((c) => tinyHeart(c, dpr)),
    spark: spark(dpr),
    background: backdrop(W, H, unit, dpr, dark),
    liquid,
    flash,
    dash: [6 * unit, 7 * unit],
    photos: [],
    polaroids: [],
  }
}

/** Circular "memory bubble" and a tiny polaroid for one photo. */
export function buildPhotoSprites(img: HTMLImageElement, unit: number, dpr: number): { bubble: Sprite; polaroid: Sprite } | null {
  const iw = img.naturalWidth
  const ih = img.naturalHeight
  if (!iw || !ih) return null
  const r = BASE_RADIUS.photo * unit

  // Square crop around the upper-middle (faces), zoomed a little to trim phone borders / frames.
  const side = Math.min(iw, ih) * 0.84
  const sx = (iw - side) / 2
  const sy = Math.max(0, Math.min(ih - side, (ih - side) * 0.3))

  const bubbleSprite = makeSprite(r * 2.8, r * 2.8, dpr, (g) => {
    g.shadowColor = 'rgba(190,18,60,0.35)'
    g.shadowBlur = r * 0.4
    g.shadowOffsetY = r * 0.1
    g.fillStyle = '#ffffff'
    g.beginPath()
    g.arc(0, 0, r, 0, TAU)
    g.fill()
    noShadow(g)
    g.save()
    g.beginPath()
    g.arc(0, 0, r * 0.86, 0, TAU)
    g.clip()
    try {
      g.drawImage(img, sx, sy, side, side, -r * 0.86, -r * 0.86, r * 1.72, r * 1.72)
    } catch {
      g.fillStyle = '#fda4af'
      g.fill()
    }
    g.restore()
    g.lineWidth = r * 0.07
    g.strokeStyle = '#fb7185'
    g.beginPath()
    g.arc(0, 0, r * 0.97, 0, TAU)
    g.stroke()
    bubbleGloss(g, r * 0.95)
    // tiny heart badge
    g.fillStyle = '#f43f5e'
    heartPath(g, r * 0.68, r * 0.66, r * 0.5)
    g.fill()
    g.lineWidth = r * 0.06
    g.strokeStyle = '#ffffff'
    g.stroke()
  })

  const pw = 74 * unit
  const ph = pw * 1.2
  const pad = pw * 0.07
  const inner = pw - pad * 2
  const crop = Math.min(iw, ih)
  const cx = (iw - crop) / 2
  const cy = Math.max(0, Math.min(ih - crop, (ih - crop) * 0.3))
  const polaroid = makeSprite(pw + 12, ph + 12, dpr, (g) => {
    g.shadowColor = 'rgba(0,0,0,0.28)'
    g.shadowBlur = 8
    g.shadowOffsetY = 3
    g.fillStyle = '#ffffff'
    g.fillRect(-pw / 2, -ph / 2, pw, ph)
    noShadow(g)
    try {
      g.drawImage(img, cx, cy, crop, crop, -pw / 2 + pad, -ph / 2 + pad, inner, inner)
    } catch {
      /* image not drawable */
    }
    // little heart centred in the bottom margin
    g.fillStyle = '#fb7185'
    heartPath(g, 0, (pad + inner) / 2, pw * 0.14)
    g.fill()
  })

  return { bubble: bubbleSprite, polaroid }
}
