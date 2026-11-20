'use client'

import { useEffect, useRef } from 'react'
import { heartRain } from '@/lib/celebrate'
import { sfx } from '@/lib/sound'
import { MagicEngine } from './magicEngine'
import { isDarkTheme, registerMagicEngine } from './magic'
import { pick } from './canvasUtils'
import { toast } from './Toast'

/** Taps here never pop hearts (typing, media, game canvases, opted-out areas). */
const NO_BURST =
  'input, textarea, select, option, [contenteditable]:not([contenteditable="false"]), [data-no-burst], canvas, video, audio, iframe, [role="slider"]'
/** On game pages, the board's own buttons give their own feedback. */
const GAME_CONTROLS = 'button, a, [role="button"], [role="gridcell"], label'
/** No sparkle trail over these. */
const NO_TRAIL = 'canvas, [data-no-burst], [data-no-trail], input, textarea, select, [contenteditable]:not([contenteditable="false"])'

const STREAK_LINES = [
  'Okay okay, I love you too!',
  'That is a lot of love taps… I felt every single one',
  'Keep tapping, my heart can take it',
  'Somebody is extra clingy today and I adore it',
]

const TRAIL_STEP = 10

function matches(target: EventTarget | null, selector: string): boolean {
  return target instanceof Element && target.closest(selector) !== null
}

interface MagicLayerProps {
  /** true on /games/<game> pages: no hearts on board buttons, no tap-streak egg */
  inGame: boolean
}

/**
 * One fixed, pointer-events-none canvas above everything that draws:
 *  - a sparkle / tiny-heart trail behind the mouse (fine pointers only, off with reduced motion)
 *  - a small burst of hearts wherever she taps or clicks
 *  - a secret: a dozen quick taps makes it rain hearts
 */
export default function MagicLayer({ inGame }: MagicLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inGameRef = useRef(inGame)

  useEffect(() => {
    inGameRef.current = inGame
  }, [inGame])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new MagicEngine(canvas)
    const unregister = registerMagicEngine(engine)
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    // --- cursor trail -------------------------------------------------
    let lastX = Number.NaN
    let lastY = Number.NaN
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || !finePointer.matches || reducedMotion.matches) return
      if (Number.isNaN(lastX)) {
        lastX = e.clientX
        lastY = e.clientY
        return
      }
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      const dist = Math.hypot(dx, dy)
      if (dist < TRAIL_STEP) return
      if (!matches(e.target, NO_TRAIL)) {
        const steps = Math.min(3, Math.floor(dist / TRAIL_STEP))
        const dark = isDarkTheme()
        for (let i = 1; i <= steps; i++) engine.trail(lastX + (dx * i) / steps, lastY + (dy * i) / steps, dark)
      }
      lastX = e.clientX
      lastY = e.clientY
    }
    const onLeave = () => {
      lastX = Number.NaN
      lastY = Number.NaN
    }

    // --- tap / click hearts ------------------------------------------
    const downs = new Map<number, { x: number; y: number; t: number; ok: boolean }>()
    let taps: number[] = []
    let streakReadyAt = 0

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      const blocked = matches(e.target, NO_BURST) || (inGameRef.current && matches(e.target, GAME_CONTROLS))
      downs.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now(), ok: !blocked })
    }

    const onUp = (e: PointerEvent) => {
      const down = downs.get(e.pointerId)
      downs.delete(e.pointerId)
      if (!down || !down.ok) return
      const now = performance.now()
      if (now - down.t > 700 || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 12) return
      const selection = window.getSelection?.()
      if (selection && !selection.isCollapsed && selection.toString().trim()) return

      engine.burst(e.clientX, e.clientY, { dark: isDarkTheme(), reduced: reducedMotion.matches })

      if (inGameRef.current) return
      taps = taps.filter((t) => now - t < 4000)
      taps.push(now)
      if (taps.length >= 12 && now >= streakReadyAt) {
        taps = []
        streakReadyAt = now + 30000
        heartRain()
        sfx.sparkle()
        toast(pick(STREAK_LINES), { emoji: '🥹' })
      }
    }

    const onCancel = (e: PointerEvent) => {
      downs.delete(e.pointerId)
    }

    let resizeFrame = 0
    const onResize = () => {
      cancelAnimationFrame(resizeFrame)
      resizeFrame = requestAnimationFrame(() => engine.resize())
    }

    const capture: AddEventListenerOptions = { capture: true, passive: true }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('pointerdown', onDown, capture)
    window.addEventListener('pointerup', onUp, capture)
    window.addEventListener('pointercancel', onCancel, capture)
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointerdown', onDown, capture)
      window.removeEventListener('pointerup', onUp, capture)
      window.removeEventListener('pointercancel', onCancel, capture)
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(resizeFrame)
      unregister()
      engine.destroy()
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[9998] h-full w-full" />
}
