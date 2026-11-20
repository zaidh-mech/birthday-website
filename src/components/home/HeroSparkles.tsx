'use client'

import { useEffect, useRef, type RefObject } from 'react'

/**
 * One <canvas> of drifting hearts and sparkles behind the hero, plus a
 * sparkle trail that follows the mouse and a little burst on every tap.
 * The animation loop pauses when the hero is off-screen or the tab is hidden,
 * and nothing runs at all for prefers-reduced-motion.
 */

type Kind = 'dot' | 'spark' | 'heart'

interface Mote {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  kind: Kind
  color: string
  phase: number
  speed: number
  /** frames left (trail particles only) */
  life: number
  maxLife: number
}

const LIGHT = ['251,113,133', '244,114,182', '253,186,116', '249,168,212']
const DARK = ['216,180,254', '255,255,255', '249,168,212', '196,181,253']
const MAX_TRAIL = 70

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  const top = y - s / 2
  ctx.beginPath()
  ctx.moveTo(x, top + s * 0.3)
  ctx.bezierCurveTo(x, top, x - s * 0.5, top, x - s * 0.5, top + s * 0.3)
  ctx.bezierCurveTo(x - s * 0.5, top + s * 0.6, x, top + s * 0.78, x, top + s)
  ctx.bezierCurveTo(x, top + s * 0.78, x + s * 0.5, top + s * 0.6, x + s * 0.5, top + s * 0.3)
  ctx.bezierCurveTo(x + s * 0.5, top, x, top, x, top + s * 0.3)
  ctx.fill()
}

function drawSpark(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x, y - r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.quadraticCurveTo(x, y, x, y + r)
  ctx.quadraticCurveTo(x, y, x - r, y)
  ctx.quadraticCurveTo(x, y, x, y - r)
  ctx.fill()
}

function drawDot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

export default function HeroSparkles({ hostRef }: { hostRef: RefObject<HTMLElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const host = hostRef.current
    if (!canvas || !host) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let dark = document.documentElement.classList.contains('dark')
    let palette = dark ? DARK : LIGHT
    const ambient: Mote[] = []
    const trail: Mote[] = []
    let raf = 0
    let visible = true
    let last = performance.now()
    let time = 0

    const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)]

    const makeAmbient = (anywhere: boolean): Mote => {
      const r = Math.random()
      const kind: Kind = r < 0.22 ? 'heart' : r < 0.55 ? 'spark' : 'dot'
      return {
        x: Math.random() * width,
        y: anywhere ? Math.random() * height : height + 20,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -(0.12 + Math.random() * 0.32),
        size: kind === 'heart' ? 7 + Math.random() * 9 : kind === 'spark' ? 3 + Math.random() * 4 : 1.2 + Math.random() * 2,
        kind,
        color: pick(palette),
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 1.2,
        life: 0,
        maxLife: 0,
      }
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const target = Math.max(12, Math.min(46, Math.round((width * height) / 26000)))
      while (ambient.length < target) ambient.push(makeAmbient(true))
      ambient.length = Math.min(ambient.length, target)
      for (const m of ambient) {
        if (m.x > width) m.x = Math.random() * width
        if (m.y > height + 20) m.y = Math.random() * height
      }
    }

    const spawnTrail = (x: number, y: number, count: number, spread: number) => {
      for (let i = 0; i < count; i++) {
        if (trail.length >= MAX_TRAIL) trail.shift()
        const angle = Math.random() * Math.PI * 2
        const speed = Math.random() * spread
        const r = Math.random()
        const kind: Kind = r < 0.3 ? 'heart' : r < 0.75 ? 'spark' : 'dot'
        const maxLife = 38 + Math.random() * 36
        trail.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.35,
          size: kind === 'heart' ? 6 + Math.random() * 6 : kind === 'spark' ? 3 + Math.random() * 3.5 : 1.5 + Math.random() * 1.5,
          kind,
          color: pick(palette),
          phase: Math.random() * Math.PI * 2,
          speed: 1,
          life: maxLife,
          maxLife,
        })
      }
    }

    const drawMote = (m: Mote, alpha: number) => {
      ctx.fillStyle = `rgba(${m.color},${alpha.toFixed(3)})`
      if (m.kind === 'heart') drawHeart(ctx, m.x, m.y, m.size)
      else if (m.kind === 'spark') drawSpark(ctx, m.x, m.y, m.size)
      else drawDot(ctx, m.x, m.y, m.size)
    }

    const frame = (now: number) => {
      raf = 0
      const dt = Math.min(48, now - last) / 16.67
      last = now
      time += dt / 60
      ctx.clearRect(0, 0, width, height)
      ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over'

      for (const m of ambient) {
        m.x += (m.vx + Math.sin(time * m.speed + m.phase) * 0.18) * dt
        m.y += m.vy * dt
        if (m.y < -24) Object.assign(m, makeAmbient(false))
        const twinkle = 0.5 + 0.5 * Math.sin(time * m.speed * 2.2 + m.phase)
        const base = m.kind === 'heart' ? (dark ? 0.16 : 0.2) : dark ? 0.35 : 0.3
        drawMote(m, base + twinkle * (dark ? 0.45 : 0.3))
      }

      for (let i = trail.length - 1; i >= 0; i--) {
        const m = trail[i]
        m.life -= dt
        if (m.life <= 0) {
          trail.splice(i, 1)
          continue
        }
        m.vx *= 0.96
        m.vy = m.vy * 0.96 - 0.012 * dt
        m.x += m.vx * dt
        m.y += m.vy * dt
        drawMote(m, Math.min(1, (m.life / m.maxLife) * 1.4) * 0.9)
      }

      schedule()
    }

    function schedule() {
      if (raf || !visible || document.hidden) return
      raf = requestAnimationFrame(frame)
    }

    const wake = () => {
      last = performance.now()
      schedule()
    }

    const toLocal = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    let lastSpawn = 0
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const now = performance.now()
      if (now - lastSpawn < 28) return
      lastSpawn = now
      const p = toLocal(e)
      spawnTrail(p.x, p.y, 1 + Math.round(Math.random()), 0.9)
    }
    const onDown = (e: PointerEvent) => {
      const p = toLocal(e)
      spawnTrail(p.x, p.y, 12, 3.2)
    }

    const themeObserver = new MutationObserver(() => {
      const next = document.documentElement.classList.contains('dark')
      if (next === dark) return
      dark = next
      palette = dark ? DARK : LIGHT
      for (const m of ambient) m.color = pick(palette)
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) wake()
    })
    io.observe(canvas)

    resize()
    host.addEventListener('pointermove', onMove)
    host.addEventListener('pointerdown', onDown)
    document.addEventListener('visibilitychange', wake)
    wake()

    return () => {
      if (raf) cancelAnimationFrame(raf)
      themeObserver.disconnect()
      resizeObserver.disconnect()
      io.disconnect()
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerdown', onDown)
      document.removeEventListener('visibilitychange', wake)
    }
  }, [hostRef])

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />
}
