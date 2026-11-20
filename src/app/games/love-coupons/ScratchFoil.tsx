'use client'

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { haptic, sfx } from '@/lib/sound'
import { clearedRatio, eraseCurve, eraseDot, eraseLine, paintFoil, replayStrokes, setupBrush, type Pt } from './foil'
import styles from './coupons.module.css'

interface ScratchFoilProps {
  /** Varies the foil pattern per coupon */
  seed: number
  dark: boolean
  /** Accessible name of the keyboard "reveal" button */
  revealLabel: string
  /** `viaKeyboard` is true when the reveal button was used instead of scratching */
  onReveal: (viaKeyboard: boolean) => void
  /** Fraction of foil that must be cleared before it falls away */
  threshold?: number
}

interface ActiveStroke {
  id: number
  last: Pt
  mid: Pt
  /** Normalised points (0–1) so the stroke can be replayed after a resize */
  points: Pt[]
}

const SOUND_GAP_MS = 60
const HAPTIC_GAP_MS = 110
const SAMPLE_GAP_MS = 220

/**
 * A DPR-aware canvas painted as metallic foil. Scratch it with mouse, touch
 * or pen; once enough is cleared it calls `onReveal` (the parent fades it
 * out). A focusable button on top lets keyboard users reveal instantly.
 */
export default function ScratchFoil({ seed, dark, revealLabel, onReveal, threshold = 0.55 }: ScratchFoilProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [started, setStarted] = useState(false)

  const st = useRef({
    w: 0,
    h: 0,
    strokes: [] as Pt[][],
    active: null as ActiveStroke | null,
    lastSound: 0,
    lastHaptic: 0,
    lastSample: 0,
    done: false,
    font: 'sans-serif',
  })

  const live = useRef({ seed, dark, threshold, onReveal })
  useEffect(() => {
    live.current = { seed, dark, threshold, onReveal }
  })

  const paint = () => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const w = wrap.clientWidth
    const h = wrap.clientHeight
    if (w < 2 || h < 2) return
    const s = st.current
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    s.w = w
    s.h = h
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    paintFoil(ctx, w, h, { dark: live.current.dark, seed: live.current.seed, fontFamily: s.font })
    if (s.strokes.length) {
      replayStrokes(
        ctx,
        s.strokes.map((stroke) => stroke.map((p) => ({ x: p.x * w, y: p.y * h }))),
      )
    }
  }

  // Paint on mount and whenever the card changes size.
  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const s = st.current
    const readFont = () => {
      s.font = getComputedStyle(canvas).fontFamily || 'sans-serif'
    }
    readFont()
    paint()

    let raf = 0
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        if (wrap.clientWidth !== s.w || wrap.clientHeight !== s.h) paint()
      })
    })
    ro.observe(wrap)

    let cancelled = false
    document.fonts?.ready
      .then(() => {
        if (cancelled || s.done) return
        readFont()
        paint()
      })
      .catch(() => {})

    return () => {
      cancelled = true
      ro.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [])

  // Theme switch: repaint in the other colours, keeping what was scratched.
  const firstTheme = useRef(true)
  useEffect(() => {
    if (firstTheme.current) {
      firstTheme.current = false
      return
    }
    paint()
  }, [dark])

  const finish = (viaKeyboard = false) => {
    const s = st.current
    if (s.done) return
    s.done = true
    s.active = null
    live.current.onReveal(viaKeyboard)
  }

  const checkCleared = (force: boolean) => {
    const s = st.current
    const canvas = canvasRef.current
    if (!canvas || s.done) return
    const now = performance.now()
    if (!force && now - s.lastSample < SAMPLE_GAP_MS) return
    s.lastSample = now
    if (clearedRatio(canvas) >= live.current.threshold) finish()
  }

  const toLocal = (clientX: number, clientY: number): Pt => {
    const s = st.current
    const r = canvasRef.current?.getBoundingClientRect()
    if (!r || !r.width || !r.height) return { x: 0, y: 0 }
    return { x: ((clientX - r.left) * s.w) / r.width, y: ((clientY - r.top) * s.h) / r.height }
  }

  const feedback = (pointerType: string) => {
    const s = st.current
    const now = performance.now()
    if (now - s.lastSound >= SOUND_GAP_MS) {
      s.lastSound = now
      sfx.scratch()
    }
    if (pointerType === 'touch' && now - s.lastHaptic >= HAPTIC_GAP_MS) {
      s.lastHaptic = now
      haptic(5)
    }
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const s = st.current
    if (s.done || s.active || !s.w) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.preventDefault()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* best effort */
    }
    const ctx = e.currentTarget.getContext('2d')
    if (!ctx) return
    const p = toLocal(e.clientX, e.clientY)
    setupBrush(ctx)
    eraseDot(ctx, p)
    const points = [{ x: p.x / s.w, y: p.y / s.h }]
    s.strokes.push(points)
    s.active = { id: e.pointerId, last: p, mid: p, points }
    setStarted(true)
    feedback(e.pointerType)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const s = st.current
    const a = s.active
    if (!a || a.id !== e.pointerId || s.done) return
    const ctx = e.currentTarget.getContext('2d')
    if (!ctx) return
    setupBrush(ctx)
    const native = e.nativeEvent
    const coalesced = typeof native.getCoalescedEvents === 'function' ? native.getCoalescedEvents() : []
    const events: { clientX: number; clientY: number }[] = coalesced.length > 0 ? coalesced : [native]
    let moved = 0
    for (const ev of events) {
      const p = toLocal(ev.clientX, ev.clientY)
      const d = Math.hypot(p.x - a.last.x, p.y - a.last.y)
      if (d < 1.5) continue
      moved += d
      const m = { x: (a.last.x + p.x) / 2, y: (a.last.y + p.y) / 2 }
      eraseCurve(ctx, a.mid, a.last, m)
      a.mid = m
      a.last = p
      a.points.push({ x: p.x / s.w, y: p.y / s.h })
    }
    if (moved > 0) {
      feedback(e.pointerType)
      checkCleared(false)
    }
  }

  const endStroke = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const s = st.current
    const a = s.active
    if (!a || a.id !== e.pointerId) return
    const ctx = e.currentTarget.getContext('2d')
    if (ctx && !s.done) {
      setupBrush(ctx)
      eraseLine(ctx, a.mid, a.last)
    }
    s.active = null
    checkCleared(true)
  }

  const shimmerStyle = { '--shimmer-delay': `${(seed % 5) * 0.7}s` } as CSSProperties

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden rounded-[inherit]">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        onContextMenu={(e) => e.preventDefault()}
        className={`${styles.foilCursor} absolute inset-0 block h-full w-full select-none font-sans [touch-action:none] [-webkit-touch-callout:none]`}
      />
      {!started && <div aria-hidden="true" className={`${styles.shimmer} pointer-events-none absolute inset-0`} style={shimmerStyle} />}
      <button
        type="button"
        onClick={() => finish(true)}
        aria-label={revealLabel}
        className="pointer-events-none absolute inset-0 flex items-end justify-center rounded-[inherit] pb-3 opacity-0 outline-none ring-inset ring-rose-400 transition-opacity focus-visible:opacity-100 focus-visible:ring-4 dark:ring-purple-400"
      >
        <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-rose-600 shadow dark:bg-[#1a1724]/95 dark:text-purple-200">
          Press Enter to reveal
        </span>
      </button>
    </div>
  )
}
