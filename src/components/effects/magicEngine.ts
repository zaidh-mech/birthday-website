import { TAU, capDpr, easeOutBack, glowSprite, heartSprite, pick, rand, sparkleSprite } from './canvasUtils'

/**
 * Particle engine for the full-screen "magic" overlay: the cursor trail and
 * the little heart bursts where she taps. It only runs requestAnimationFrame
 * while particles are alive, so an idle page costs nothing.
 */

type SpriteKind = 'heart' | 'sparkle' | 'dot'
type Kind = SpriteKind | 'ring'

interface Particle {
  kind: Kind
  x: number
  y: number
  vx: number
  vy: number
  /** constant acceleration (gravity < 0 floats up) */
  ay: number
  drag: number
  age: number
  life: number
  size: number
  rot: number
  vr: number
  /** scale in with a little overshoot */
  pop: boolean
  sprite: HTMLCanvasElement | null
  color: string
}

interface Palette {
  hearts: string[]
  sparkles: string[]
  dots: string[]
  ring: string
}

const PALETTES: { light: Palette; dark: Palette } = {
  light: {
    hearts: ['#fb7185', '#f43f5e', '#f472b6', '#fda4af'],
    sparkles: ['#fbbf24', '#fb7185', '#f9a8d4', '#fcd34d'],
    dots: ['#fda4af', '#fcd34d', '#f9a8d4'],
    ring: '#fb7185',
  },
  dark: {
    hearts: ['#f0abfc', '#c084fc', '#f9a8d4', '#e879f9'],
    sparkles: ['#fde68a', '#e9d5ff', '#ffffff', '#c4b5fd'],
    dots: ['#d8b4fe', '#fde68a', '#f5d0fe'],
    ring: '#c084fc',
  },
}

/** How much bigger than `size` each sprite is stamped (sprites include their halo). */
const DRAW_SCALE: Record<SpriteKind, number> = { heart: 1.1, sparkle: 1.7, dot: 2.6 }

const MAX_PARTICLES = 160

export interface EmitOptions {
  dark: boolean
  reduced: boolean
  count?: number
}

export class MagicEngine {
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D | null
  private particles: Particle[] = []
  private sprites = new Map<string, HTMLCanvasElement>()
  private raf = 0
  private last = 0
  private dpr = 1
  private width = 0
  private height = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.resize()
  }

  resize(): void {
    const w = window.innerWidth
    const h = window.innerHeight
    const dpr = capDpr(2)
    if (w === this.width && h === this.height && dpr === this.dpr) return
    this.width = w
    this.height = h
    this.dpr = dpr
    this.canvas.width = Math.round(w * dpr)
    this.canvas.height = Math.round(h * dpr)
  }

  /** One trail particle near (x, y). */
  trail(x: number, y: number, dark: boolean): void {
    const pal = dark ? PALETTES.dark : PALETTES.light
    const roll = Math.random()
    const kind: SpriteKind = roll < 0.2 ? 'heart' : roll < 0.72 ? 'sparkle' : 'dot'
    const color = pick(kind === 'heart' ? pal.hearts : kind === 'sparkle' ? pal.sparkles : pal.dots)
    this.add({
      kind,
      x: x + rand(-4, 4),
      y: y + rand(-4, 4),
      vx: rand(-16, 16),
      vy: kind === 'heart' ? rand(-34, -14) : rand(-10, 16),
      ay: kind === 'heart' ? -26 : 48,
      drag: 1.6,
      age: 0,
      life: kind === 'heart' ? rand(0.65, 0.95) : rand(0.4, 0.75),
      size: kind === 'heart' ? rand(9, 13) : kind === 'sparkle' ? rand(8, 14) : rand(3.5, 6),
      rot: rand(-0.4, 0.4),
      vr: rand(-2.2, 2.2),
      pop: false,
      sprite: this.sprite(kind, color),
      color,
    })
  }

  /** A small fan of hearts popping out of a tap/click point. */
  burst(x: number, y: number, { dark, reduced, count = 9 }: EmitOptions): void {
    const pal = dark ? PALETTES.dark : PALETTES.light
    const n = reduced ? Math.min(4, count) : count

    if (!reduced) {
      this.add({
        kind: 'ring', x, y, vx: 0, vy: 0, ay: 0, drag: 0, age: 0, life: 0.5,
        size: 40, rot: 0, vr: 0, pop: false, sprite: null, color: pal.ring,
      })
    }

    for (let i = 0; i < n; i++) {
      const spread = n > 1 ? i / (n - 1) - 0.5 : 0
      const angle = -Math.PI / 2 + spread * Math.PI * 1.35 + rand(-0.18, 0.18)
      const speed = reduced ? 0 : rand(110, 240)
      const color = pick(pal.hearts)
      this.add({
        kind: 'heart',
        x: x + (reduced ? Math.cos(angle) * 16 : 0),
        y: y + (reduced ? Math.sin(angle) * 16 : 0),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        ay: reduced ? 0 : -34,
        drag: 3.4,
        age: 0,
        life: reduced ? 0.7 : rand(0.85, 1.3),
        size: rand(11, 19),
        rot: rand(-0.35, 0.35),
        vr: reduced ? 0 : rand(-1.6, 1.6),
        pop: true,
        sprite: this.sprite('heart', color),
        color,
      })
    }

    if (!reduced) this.sparkles(x, y, { dark, reduced, count: 4 })
  }

  /** Sparkles flying out in every direction (theme switch, little celebrations). */
  sparkles(x: number, y: number, { dark, reduced, count = 10 }: EmitOptions): void {
    const pal = dark ? PALETTES.dark : PALETTES.light
    const n = reduced ? Math.min(3, count) : count
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * TAU + rand(-0.3, 0.3)
      const speed = reduced ? 0 : rand(70, 170)
      const color = pick(pal.sparkles)
      this.add({
        kind: 'sparkle',
        x: x + (reduced ? Math.cos(angle) * 14 : 0),
        y: y + (reduced ? Math.sin(angle) * 14 : 0),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        ay: reduced ? 0 : 40,
        drag: 2.6,
        age: 0,
        life: rand(0.5, 0.85),
        size: rand(9, 15),
        rot: rand(0, TAU),
        vr: rand(-3, 3),
        pop: true,
        sprite: this.sprite('sparkle', color),
        color,
      })
    }
  }

  destroy(): void {
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
    this.particles = []
    this.sprites.clear()
    this.ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private sprite(kind: SpriteKind, color: string): HTMLCanvasElement {
    const key = `${kind}:${color}`
    let sprite = this.sprites.get(key)
    if (!sprite) {
      sprite = kind === 'heart' ? heartSprite(color, 64) : kind === 'sparkle' ? sparkleSprite(color, 64) : glowSprite(color, 32, 0.22)
      this.sprites.set(key, sprite)
    }
    return sprite
  }

  private add(p: Particle): void {
    if (!this.ctx) return
    if (this.particles.length >= MAX_PARTICLES) this.particles.shift()
    this.particles.push(p)
    if (!this.raf) {
      this.last = performance.now()
      this.raf = requestAnimationFrame(this.tick)
    }
  }

  private tick = (now: number): void => {
    const ctx = this.ctx
    if (!ctx) {
      this.raf = 0
      return
    }
    const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000))
    this.last = now
    const dpr = this.dpr

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    const list = this.particles
    let alive = 0
    for (let i = 0; i < list.length; i++) {
      const p = list[i]
      p.age += dt
      if (p.age >= p.life) continue
      list[alive++] = p

      const damp = Math.exp(-p.drag * dt)
      p.vx *= damp
      p.vy = p.vy * damp + p.ay * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.rot += p.vr * dt
      const t = p.age / p.life

      if (p.kind === 'ring') {
        const r = 4 + (p.size - 4) * (1 - (1 - t) * (1 - t))
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.globalAlpha = 0.55 * (1 - t)
        ctx.strokeStyle = p.color
        ctx.lineWidth = 2.2 * (1 - t) + 0.4
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, TAU)
        ctx.stroke()
        continue
      }

      let scale = 1 - t * 0.45
      if (p.pop) scale *= easeOutBack(p.age / 0.22)
      let alpha = 1 - t * t
      if (p.kind === 'sparkle') alpha *= 0.72 + 0.28 * Math.sin(p.age * 30 + p.x)
      const s = p.size * scale * DRAW_SCALE[p.kind]
      if (!p.sprite || s < 0.3 || alpha <= 0.01) continue

      const cos = Math.cos(p.rot) * dpr
      const sin = Math.sin(p.rot) * dpr
      ctx.globalAlpha = Math.min(1, alpha)
      ctx.setTransform(cos, sin, -sin, cos, p.x * dpr, p.y * dpr)
      ctx.drawImage(p.sprite, -s / 2, -s / 2, s, s)
    }
    list.length = alive

    ctx.globalAlpha = 1
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    if (alive > 0) {
      this.raf = requestAnimationFrame(this.tick)
    } else {
      this.raf = 0
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }
  }
}
