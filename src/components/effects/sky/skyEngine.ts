import {
  TAU,
  capDpr,
  clamp,
  gauss,
  glowSprite,
  heartSprite,
  lighten,
  makeSprite,
  pick,
  rand,
  rgba,
  smoothstep,
} from '../canvasUtils'

/**
 * The living background, drawn on ONE canvas:
 *  - night: twinkling stars in three depth layers (denser along the milky way)
 *           and the occasional shooting star
 *  - day:   rose petals tumbling down, little hearts and soft bokeh floating up
 * Both scenes cross-fade when the theme changes, drift with the mouse
 * (parallax) and gently with scrolling. With reduced motion a single static
 * frame is drawn instead of an animation loop.
 */

export type SkyTheme = 'light' | 'dark'

interface Star {
  x: number
  y: number
  r: number
  depth: number
  alpha: number
  speed: number
  phase: number
  sprite: number
  flare: boolean
  twinkler: boolean
}

/** 0 = petal, 1 = heart, 2 = bokeh */
type FloaterKind = 0 | 1 | 2

interface Floater {
  kind: FloaterKind
  x: number
  y: number
  size: number
  depth: number
  sprite: HTMLCanvasElement
  rot: number
  vr: number
  vx: number
  vy: number
  sway: number
  swaySpeed: number
  phase: number
  flipSpeed: number
  alpha: number
}

interface Meteor {
  x: number
  y: number
  dx: number
  dy: number
  speed: number
  age: number
  life: number
  len: number
}

export interface SkyEngineOptions {
  theme: SkyTheme
  reducedMotion: boolean
  width: number
  height: number
  /** Receives the smoothed pointer offset (-1…1) so DOM layers can parallax in sync */
  onParallax?: (x: number, y: number) => void
}

const STAR_COLORS = ['#ffffff', '#ffffff', '#f5f3ff', '#e9d5ff', '#dbeafe', '#fef3c7', '#fbcfe8']
const PETAL_COLORS: [string, string][] = [
  ['#ffe4e6', '#fb7185'],
  ['#fce7f3', '#f472b6'],
  ['#fff1f2', '#fda4af'],
  ['#fdf2f8', '#f9a8d4'],
  ['#fff7ed', '#fdba74'],
]
const HEART_COLORS = ['#fb7185', '#f472b6', '#fda4af', '#f9a8d4']
const BOKEH_COLORS = ['#fb7185', '#fdba74', '#f472b6', '#fcd34d', '#c4b5fd']

/** Must match the CSS milky way band in sky.module.css */
const BAND_ANGLE = (-24 * Math.PI) / 180
const BAND_CENTER_Y = 0.49
const FADE_SECONDS = 1.2
const PARALLAX_X = 18
const PARALLAX_Y = 12
const MAX_STARS = 140
const MAX_FLOATERS = 38

function petalSprite(light: string, deep: string): HTMLCanvasElement {
  return makeSprite(48, (g, s) => {
    const k = s / 48
    g.translate(s / 2, s / 2)
    const grad = g.createLinearGradient(0, -20 * k, 0, 20 * k)
    grad.addColorStop(0, light)
    grad.addColorStop(1, lighten(deep, 0.2))
    g.fillStyle = grad
    g.beginPath()
    g.moveTo(0, 20 * k)
    g.bezierCurveTo(-17 * k, 9 * k, -15 * k, -15 * k, -5 * k, -19 * k)
    g.quadraticCurveTo(0, -14 * k, 5 * k, -19 * k)
    g.bezierCurveTo(15 * k, -15 * k, 17 * k, 9 * k, 0, 20 * k)
    g.closePath()
    g.fill()
    g.globalAlpha = 0.4
    g.fillStyle = '#ffffff'
    g.beginPath()
    g.ellipse(-5 * k, -6 * k, 3.5 * k, 8 * k, -0.3, 0, TAU)
    g.fill()
    g.globalAlpha = 1
  })
}

function bokehSprite(color: string): HTMLCanvasElement {
  return makeSprite(128, (g, s) => {
    const c = s / 2
    const grad = g.createRadialGradient(c, c, 0, c, c, c)
    grad.addColorStop(0, rgba(color, 0.5))
    grad.addColorStop(0.7, rgba(color, 0.42))
    grad.addColorStop(0.88, rgba(color, 0.2))
    grad.addColorStop(1, rgba(color, 0))
    g.fillStyle = grad
    g.fillRect(0, 0, s, s)
  })
}

function flareSprite(): HTMLCanvasElement {
  return makeSprite(64, (g, s) => {
    const c = s / 2
    const h = g.createLinearGradient(0, 0, s, 0)
    h.addColorStop(0, 'rgba(255,255,255,0)')
    h.addColorStop(0.5, 'rgba(255,255,255,0.95)')
    h.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = h
    g.fillRect(0, c - 1, s, 2)
    const v = g.createLinearGradient(0, 0, 0, s)
    v.addColorStop(0, 'rgba(255,255,255,0)')
    v.addColorStop(0.5, 'rgba(255,255,255,0.95)')
    v.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = v
    g.fillRect(c - 1, 0, 2, s)
  })
}

export class SkyEngine {
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D | null
  private readonly onParallax?: (x: number, y: number) => void

  private w = 0
  private h = 0
  private dpr = 1

  private stars: Star[] = []
  private floaters: Floater[] = []
  private meteors: Meteor[] = []

  private readonly starSprites: HTMLCanvasElement[]
  private readonly flare: HTMLCanvasElement
  private readonly meteorHead: HTMLCanvasElement
  private readonly petalSprites: HTMLCanvasElement[]
  private readonly heartSprites: HTMLCanvasElement[]
  private readonly bokehSprites: HTMLCanvasElement[]

  private theme: SkyTheme
  /** 0 = day scene, 1 = night scene */
  private mix: number
  private reduced: boolean

  private running = false
  private raf = 0
  private last = 0
  private lastDraw = 0
  private time = rand(0, 100)
  private readonly frameInterval: number

  private px = 0
  private py = 0
  private tx = 0
  private ty = 0
  private reportedX = 0
  private reportedY = 0
  private nextMeteor: number

  constructor(canvas: HTMLCanvasElement, options: SkyEngineOptions) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.onParallax = options.onParallax
    this.theme = options.theme
    this.mix = options.theme === 'dark' ? 1 : 0
    this.reduced = options.reducedMotion
    this.nextMeteor = this.time + rand(2, 5)
    // Touch devices: ~40fps is plenty for drifting petals and saves battery.
    this.frameInterval = window.matchMedia?.('(pointer: coarse)').matches ? 1000 / 40 : 0

    this.starSprites = STAR_COLORS.map((c) => glowSprite(c, 32, 0.1))
    this.flare = flareSprite()
    this.meteorHead = glowSprite('#f5f3ff', 32, 0.14)
    this.petalSprites = PETAL_COLORS.map(([light, deep]) => petalSprite(light, deep))
    this.heartSprites = HEART_COLORS.map((c) => heartSprite(c, 48))
    this.bokehSprites = BOKEH_COLORS.map((c) => bokehSprite(c))

    this.setSize(options.width, options.height)
  }

  // ---------------------------------------------------------------- public

  start(): void {
    if (this.reduced) {
      this.renderStatic()
      return
    }
    if (this.running) return
    this.running = true
    this.last = performance.now()
    this.lastDraw = 0
    this.raf = requestAnimationFrame(this.frame)
  }

  stop(): void {
    this.running = false
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
  }

  destroy(): void {
    this.stop()
    this.stars = []
    this.floaters = []
    this.meteors = []
  }

  setSize(width: number, height: number): void {
    const w = Math.max(1, Math.round(width))
    const h = Math.max(1, Math.round(height))
    const dpr = capDpr(2)
    if (w === this.w && h === this.h && dpr === this.dpr) return
    if (this.w && this.h) {
      const sx = w / this.w
      const sy = h / this.h
      for (const s of this.stars) {
        s.x *= sx
        s.y *= sy
      }
      for (const f of this.floaters) {
        f.x *= sx
        f.y *= sy
      }
    }
    this.w = w
    this.h = h
    this.dpr = dpr
    this.canvas.width = Math.round(w * dpr)
    this.canvas.height = Math.round(h * dpr)
    this.syncCounts()
    if (!this.running) this.draw()
  }

  setTheme(theme: SkyTheme, instant = false): void {
    if (theme === this.theme && !instant) return
    this.theme = theme
    if (instant || this.reduced || !this.running) {
      this.mix = theme === 'dark' ? 1 : 0
      if (!this.running) this.draw()
    }
  }

  setReducedMotion(reduced: boolean): void {
    if (reduced === this.reduced) return
    this.reduced = reduced
    if (reduced) {
      this.stop()
      this.renderStatic()
    } else {
      this.start()
    }
  }

  /** Pointer position in -1…1 (0 = centre). */
  setPointer(x: number, y: number): void {
    this.tx = clamp(x, -1, 1)
    this.ty = clamp(y, -1, 1)
  }

  // ---------------------------------------------------------------- setup

  private syncCounts(): void {
    const area = this.w * this.h
    const starTarget = Math.round(clamp(area / 4800, 50, MAX_STARS))
    while (this.stars.length < starTarget) this.stars.push(this.makeStar())
    if (this.stars.length > starTarget) this.stars.length = starTarget

    const floaterTarget = Math.round(clamp(area / 20000, 16, MAX_FLOATERS))
    while (this.floaters.length < floaterTarget) this.floaters.push(this.makeFloater(true))
    if (this.floaters.length > floaterTarget) this.floaters.length = floaterTarget
  }

  private makeStar(): Star {
    let x = rand(0, this.w)
    let y = rand(0, this.h)
    if (Math.random() < 0.4) {
      // cluster along the milky way band
      const t = (Math.random() - 0.5) * Math.hypot(this.w, this.h)
      const off = gauss() * Math.min(this.w, this.h) * 0.08
      const bx = this.w * 0.5 + Math.cos(BAND_ANGLE) * t - Math.sin(BAND_ANGLE) * off
      const by = this.h * BAND_CENTER_Y + Math.sin(BAND_ANGLE) * t + Math.cos(BAND_ANGLE) * off
      if (bx >= 0 && bx <= this.w && by >= 0 && by <= this.h) {
        x = bx
        y = by
      }
    }
    const roll = Math.random()
    const depth = roll < 0.55 ? 0.25 : roll < 0.88 ? 0.55 : 1
    return {
      x,
      y,
      depth,
      r: depth === 1 ? rand(1.3, 2.3) : depth > 0.5 ? rand(0.9, 1.5) : rand(0.6, 1),
      alpha: depth === 1 ? rand(0.8, 1) : depth > 0.5 ? rand(0.6, 0.95) : rand(0.4, 0.8),
      speed: rand(0.5, 2.4),
      phase: rand(0, TAU),
      sprite: Math.floor(Math.random() * this.starSprites.length),
      flare: depth === 1 && Math.random() < 0.45,
      twinkler: Math.random() < 0.25,
    }
  }

  private makeFloater(anywhere: boolean): Floater {
    const roll = Math.random()
    const kind: FloaterKind = roll < 0.5 ? 0 : roll < 0.76 ? 1 : 2
    const depth = rand(0.55, 1.25)
    let size: number
    let vx: number
    let vy: number
    let alpha: number
    let sprite: HTMLCanvasElement
    if (kind === 0) {
      size = rand(16, 26) * depth
      vy = rand(14, 30) * depth
      vx = rand(-4, 10)
      alpha = rand(0.6, 0.92)
      sprite = pick(this.petalSprites)
    } else if (kind === 1) {
      size = rand(11, 17) * depth
      vy = -rand(8, 18) * depth
      vx = rand(-4, 4)
      alpha = rand(0.3, 0.6)
      sprite = pick(this.heartSprites)
    } else {
      size = rand(40, 110)
      vy = -rand(2, 6)
      vx = rand(-4, 4)
      alpha = rand(0.14, 0.3)
      sprite = pick(this.bokehSprites)
    }
    const margin = size + 30
    return {
      kind,
      x: rand(0, this.w),
      y: anywhere ? rand(0, this.h) : vy > 0 ? -margin : this.h + margin,
      size,
      depth,
      sprite,
      rot: rand(0, TAU),
      vr: kind === 0 ? rand(-0.9, 0.9) : 0,
      vx,
      vy,
      sway: kind === 2 ? rand(4, 10) : rand(10, 26),
      swaySpeed: rand(0.35, 1),
      phase: rand(0, TAU),
      flipSpeed: rand(0.6, 1.6),
      alpha,
    }
  }

  private makeMeteor(): Meteor {
    const fromLeft = Math.random() < 0.4
    const angle = ((fromLeft ? rand(20, 38) : rand(142, 160)) * Math.PI) / 180
    const scale = clamp(Math.hypot(this.w, this.h) / 1400, 0.55, 1.3)
    return {
      x: (fromLeft ? rand(0.05, 0.55) : rand(0.45, 0.95)) * this.w,
      y: rand(0.02, 0.4) * this.h,
      dx: Math.cos(angle),
      dy: Math.sin(angle),
      speed: rand(650, 1000) * scale,
      age: 0,
      life: rand(0.7, 1.1),
      len: rand(110, 220) * scale,
    }
  }

  // ---------------------------------------------------------------- loop

  private frame = (now: number): void => {
    if (!this.running) return
    this.raf = requestAnimationFrame(this.frame)
    if (this.frameInterval && now - this.lastDraw < this.frameInterval - 2) return
    const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000))
    this.last = now
    this.lastDraw = now
    this.time += dt
    this.update(dt)
    this.draw()
  }

  private renderStatic(): void {
    this.mix = this.theme === 'dark' ? 1 : 0
    this.meteors = []
    this.px = this.py = this.tx = this.ty = 0
    this.draw()
  }

  private update(dt: number): void {
    // theme cross-fade
    const target = this.theme === 'dark' ? 1 : 0
    if (this.mix !== target) {
      const step = dt / FADE_SECONDS
      this.mix = target > this.mix ? Math.min(target, this.mix + step) : Math.max(target, this.mix - step)
    }

    // smoothed pointer for parallax
    const k = 1 - Math.exp(-dt * 2.8)
    this.px += (this.tx - this.px) * k
    this.py += (this.ty - this.py) * k
    if (this.onParallax && (Math.abs(this.px - this.reportedX) > 0.002 || Math.abs(this.py - this.reportedY) > 0.002)) {
      this.reportedX = this.px
      this.reportedY = this.py
      this.onParallax(this.px, this.py)
    }

    // day scene only moves while it's visible
    if (this.mix < 1) {
      for (const f of this.floaters) {
        f.x += f.vx * dt
        f.y += f.vy * dt
        f.rot += f.vr * dt
        const margin = f.size + f.sway + 30
        if (f.y > this.h + margin || f.y < -margin) {
          const fresh = this.makeFloater(false)
          Object.assign(f, fresh)
        } else if (f.x > this.w + margin) {
          f.x = -margin
        } else if (f.x < -margin) {
          f.x = this.w + margin
        }
      }
    }

    // shooting stars
    if (this.mix > 0) {
      if (this.time >= this.nextMeteor) {
        this.nextMeteor = this.time + rand(4, 10)
        if (this.mix > 0.6 && this.meteors.length < 2) this.meteors.push(this.makeMeteor())
      }
      for (const m of this.meteors) {
        m.age += dt
        m.x += m.dx * m.speed * dt
        m.y += m.dy * m.speed * dt
      }
      this.meteors = this.meteors.filter((m) => m.age < m.life)
    } else if (this.meteors.length) {
      this.meteors = []
    }
  }

  // ---------------------------------------------------------------- drawing

  private draw(): void {
    const ctx = this.ctx
    if (!ctx) return
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalAlpha = 1
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    const m = smoothstep(this.mix)
    if (m < 0.999) this.drawDay(ctx, 1 - m)
    if (m > 0.001) this.drawNight(ctx, m)
    ctx.globalAlpha = 1
    ctx.setTransform(1, 0, 0, 1, 0, 0)
  }

  private drawNight(ctx: CanvasRenderingContext2D, fade: number): void {
    const { dpr, w, h, time } = this
    const ox = this.px * PARALLAX_X
    const oy = this.py * PARALLAX_Y
    const scroll = this.reduced ? 0 : window.scrollY || 0
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    for (const s of this.stars) {
      const x = s.x + ox * s.depth
      let y = s.y + oy * s.depth - scroll * s.depth * 0.05
      y = ((y % h) + h) % h
      if (x < -8 || x > w + 8) continue
      const wave = Math.sin(time * s.speed + s.phase)
      const tw = s.twinkler ? 0.25 + 0.75 * (0.5 + 0.5 * wave) ** 2 : 0.72 + 0.28 * wave
      const a = s.alpha * tw * fade
      if (a < 0.02) continue
      const size = s.r * 14
      ctx.globalAlpha = a
      ctx.drawImage(this.starSprites[s.sprite], x - size / 2, y - size / 2, size, size)
      if (s.flare) {
        const fs = s.r * 12 * (0.7 + 0.3 * tw)
        ctx.globalAlpha = a * 0.55 * tw
        ctx.drawImage(this.flare, x - fs / 2, y - fs / 2, fs, fs)
      }
    }

    for (const m of this.meteors) {
      const p = clamp(m.age / m.life, 0, 1)
      const a = Math.sin(Math.PI * p) * fade
      if (a < 0.02) continue
      const tail = m.len * Math.min(1, m.age / 0.18)
      const x = m.x + ox * 0.6
      const y = m.y + oy * 0.6
      const tx = x - m.dx * tail
      const ty = y - m.dy * tail
      const grad = ctx.createLinearGradient(x, y, tx, ty)
      grad.addColorStop(0, `rgba(255,255,255,${0.95 * a})`)
      grad.addColorStop(0.25, `rgba(233,213,255,${0.45 * a})`)
      grad.addColorStop(1, 'rgba(196,181,253,0)')
      ctx.globalAlpha = 1
      ctx.strokeStyle = grad
      ctx.lineWidth = 1.6
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(tx, ty)
      ctx.stroke()
      ctx.globalAlpha = a
      ctx.drawImage(this.meteorHead, x - 8, y - 8, 16, 16)
    }
  }

  private drawDay(ctx: CanvasRenderingContext2D, fade: number): void {
    const { dpr, time } = this
    const ox = this.px * PARALLAX_X
    const oy = this.py * PARALLAX_Y

    for (const f of this.floaters) {
      const x = f.x + Math.sin(time * f.swaySpeed + f.phase) * f.sway + ox * f.depth
      const y = f.y + oy * f.depth
      let rot = 0
      let sx = 1
      if (f.kind === 0) {
        rot = f.rot
        sx = 0.3 + 0.7 * Math.abs(Math.cos(time * f.flipSpeed + f.phase)) // tumbling petal
      } else if (f.kind === 1) {
        rot = Math.sin(time * f.swaySpeed * 1.3 + f.phase) * 0.35
      }
      const s = f.size
      const cos = Math.cos(rot)
      const sin = Math.sin(rot)
      ctx.globalAlpha = f.alpha * fade
      ctx.setTransform(dpr * cos * sx, dpr * sin * sx, -dpr * sin, dpr * cos, dpr * x, dpr * y)
      ctx.drawImage(f.sprite, -s / 2, -s / 2, s, s)
    }
  }
}
