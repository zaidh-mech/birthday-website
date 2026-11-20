'use client'

import { useEffect, useState, type RefObject } from 'react'

/** Padding of the glass frame around the board, per side (px). */
export const FRAME_PAD = 8
/** Width of the side panel on lg screens plus the gap before it (px). */
const SIDE_PANEL = 17 * 16 + 32

/**
 * Board edge length in px: min(92vw, 62vh, 560px), never wider than the space
 * the layout gives it, rounded down to a multiple of `n` so tiles land on whole
 * pixels. Recomputes on resize / orientation change / container changes.
 */
export function useBoardSize(containerRef: RefObject<HTMLElement | null>, n: number): number {
  const [size, setSize] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let frame = 0
    let last = { vw: 0, vh: 0 }
    const compute = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const vw = window.innerWidth
        let vh = window.innerHeight
        // Mobile browsers resize the viewport height as the URL bar slides in and
        // out while scrolling; ignore those small changes so the board doesn't pump.
        if (vw === last.vw && Math.abs(vh - last.vh) < 160) vh = last.vh
        last = { vw, vh }
        const wide = window.matchMedia('(min-width: 1024px)').matches
        const available = el.clientWidth - (wide ? SIDE_PANEL : 0) - FRAME_PAD * 2
        let s = Math.min(vw * 0.92, vh * 0.62, 560)
        s = Math.max(s, 200) // short landscape phones: keep tiles tappable…
        s = Math.min(s, available) // …but never overflow the layout
        s = Math.max(n * 24, Math.floor(s / n) * n)
        setSize(s)
      })
    }

    compute()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(compute) : null
    ro?.observe(el)
    window.addEventListener('resize', compute)
    window.addEventListener('orientationchange', compute)
    return () => {
      cancelAnimationFrame(frame)
      ro?.disconnect()
      window.removeEventListener('resize', compute)
      window.removeEventListener('orientationchange', compute)
    }
  }, [containerRef, n])

  return size
}
