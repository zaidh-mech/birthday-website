'use client'

import { useCallback, useLayoutEffect, useState, type RefObject } from 'react'

/** Card height / width (cards are 3:4 portrait, like our photos). */
export const CARD_ASPECT = 4 / 3

/** The fixed nav pill covers roughly this much of the top of the screen. */
export const NAV_CLEARANCE = 96
/** Height of the little status strip rendered above the grid (incl. its margin). */
export const HUD_HEIGHT = 40

/** Phones have a floating theme/sound cluster in the bottom-right corner. */
export function bottomReserve(viewportWidth: number): number {
  return viewportWidth < 768 ? 80 : 24
}

export interface BoardLayout {
  cols: number
  rows: number
  cardW: number
  cardH: number
  gap: number
  boardW: number
  boardH: number
  /** Width of the container the board was fitted into */
  availW: number
  /**
   * below    – fits under the page header with no scrolling at all
   * viewport – fits on screen once scrolled to (we scroll it into view on start)
   * scroll   – too many cards for this screen; the board scrolls with the page
   */
  mode: 'below' | 'viewport' | 'scroll'
}

interface Candidate {
  cols: number
  rows: number
  byW: number
  byH: number
  fit: number
}

function candidatesFor(total: number, availW: number, availH: number, gap: number): Candidate[] {
  const out: Candidate[] = []
  for (let cols = 2; cols <= 8; cols++) {
    if (total % cols !== 0) continue
    const rows = total / cols
    if (rows < 2 || rows > 8) continue
    const byW = (availW - gap * (cols - 1)) / cols
    const byH = (availH - gap * (rows - 1)) / rows / CARD_ASPECT
    out.push({ cols, rows, byW, byH, fit: Math.min(byW, byH) })
  }
  if (out.length === 0) {
    // Awkward counts (e.g. 22 = 2 × 11, when there are only 11 photos): allow a
    // partly filled last row instead of returning nothing.
    for (let cols = 2; cols <= Math.min(8, total); cols++) {
      const rows = Math.ceil(total / cols)
      if (rows > 8) continue
      const byW = (availW - gap * (cols - 1)) / cols
      const byH = (availH - gap * (rows - 1)) / rows / CARD_ASPECT
      out.push({ cols, rows, byW, byH, fit: Math.min(byW, byH) })
    }
  }
  return out
}

function bestFit(list: Candidate[]): Candidate {
  return list.reduce((best, c) => (c.fit > best.fit ? c : best), list[0])
}

export interface LayoutInput {
  total: number
  availW: number
  /** Height left under the header when the page is at the top */
  belowH: number
  /** Height of the visible area once the board is scrolled under the nav */
  viewH: number
}

/**
 * Chooses the column count and card size that make the cards as large as
 * possible while the whole board stays on screen. Pure: easy to reason about.
 */
export function computeLayout({ total, availW, belowH, viewH }: LayoutInput): BoardLayout {
  const gap = availW < 420 ? 8 : availW < 768 ? 10 : 14
  const maxCard = availW < 640 ? 150 : 188
  const comfortable = availW < 640 ? 78 : 104
  const minFit = 56
  const minScroll = 60

  const below = bestFit(candidatesFor(total, availW, belowH, gap))
  const view = bestFit(candidatesFor(total, availW, viewH, gap))

  let chosen: { cols: number; rows: number; width: number }
  let mode: BoardLayout['mode']
  if (below.fit >= comfortable || (below.fit >= minFit && below.fit >= view.fit * 0.88)) {
    chosen = { cols: below.cols, rows: below.rows, width: below.fit }
    mode = 'below'
  } else if (view.fit >= minFit) {
    chosen = { cols: view.cols, rows: view.rows, width: view.fit }
    mode = 'viewport'
  } else {
    // Can't fit at a usable size: allow page scrolling, using the most columns
    // that still give a tappable card.
    const byWidth = candidatesFor(total, availW, Number.POSITIVE_INFINITY, gap)
    const usable = byWidth.filter((c) => c.byW >= minScroll)
    const pick = usable.length > 0 ? usable[usable.length - 1] : byWidth.reduce((a, b) => (b.byW > a.byW ? b : a), byWidth[0])
    chosen = { cols: pick.cols, rows: pick.rows, width: pick.byW }
    mode = 'scroll'
  }

  const cardW = Math.max(40, Math.floor(Math.min(chosen.width, maxCard)))
  const cardH = Math.round(cardW * CARD_ASPECT)
  return {
    cols: chosen.cols,
    rows: chosen.rows,
    cardW,
    cardH,
    gap,
    boardW: chosen.cols * cardW + (chosen.cols - 1) * gap,
    boardH: chosen.rows * cardH + (chosen.rows - 1) * gap,
    availW,
    mode,
  }
}

/** Document-relative top of an element, ignoring CSS transforms (e.g. the page-enter slide). */
function documentTop(el: HTMLElement): number {
  let y = 0
  let node: HTMLElement | null = el
  while (node) {
    y += node.offsetTop
    node = node.offsetParent instanceof HTMLElement ? node.offsetParent : null
  }
  return y
}

/**
 * Measures the board container and the viewport, and returns a layout for
 * `total` cards. Re-measures on width changes and real height changes (not
 * the small jumps from mobile browser toolbars showing/hiding).
 */
export function useBoardLayout(containerRef: RefObject<HTMLElement | null>, total: number): BoardLayout | null {
  const [layout, setLayout] = useState<BoardLayout | null>(null)

  const measure = useCallback(() => {
    const el = containerRef.current
    if (!el || total <= 0) return
    const availW = el.clientWidth
    if (availW <= 0) return
    const vh = window.innerHeight
    const top = documentTop(el)
    const reserve = bottomReserve(window.innerWidth)
    const belowH = vh - top - reserve - HUD_HEIGHT
    const viewH = vh - NAV_CLEARANCE - reserve - HUD_HEIGHT
    const next = computeLayout({ total, availW, belowH, viewH })
    setLayout((prev) =>
      prev &&
      prev.cols === next.cols &&
      prev.cardW === next.cardW &&
      prev.gap === next.gap &&
      prev.mode === next.mode &&
      prev.availW === next.availW
        ? prev
        : next,
    )
  }, [containerRef, total])

  useLayoutEffect(() => {
    measure()
    const el = containerRef.current
    let lastW = window.innerWidth
    let lastH = window.innerHeight
    const onResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      // Mobile toolbars change the height by ~50–110px while scrolling; ignore those.
      if (w !== lastW || Math.abs(h - lastH) > 140) {
        lastW = w
        lastH = h
        measure()
      }
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', measure)

    let ro: ResizeObserver | null = null
    let lastWidth = el?.clientWidth ?? 0
    if (el && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        if (el.clientWidth !== lastWidth) {
          lastWidth = el.clientWidth
          measure()
        }
      })
      ro.observe(el)
    }

    // The page-enter animation and late web fonts shift the header a little: measure again once settled.
    const settle = window.setTimeout(measure, 900)
    let cancelled = false
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) measure()
      })
    }

    return () => {
      cancelled = true
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', measure)
      window.clearTimeout(settle)
      ro?.disconnect()
    }
  }, [measure, containerRef])

  return layout
}
