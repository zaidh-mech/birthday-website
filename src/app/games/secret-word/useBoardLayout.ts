'use client'

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'

/**
 * Sizes the board so the six rows *and* the keyboard fit on screen at once.
 *
 * The board is measured against the real page layout: if everything fits
 * below the page header at a comfortable size it simply does. On short
 * screens (e.g. a 375×667 phone or a landscape phone) the tiles are sized
 * for the area between the fixed nav and the bottom of the screen instead,
 * and the page glides down once so the game area sits right under the nav.
 */
export interface BoardLayout {
  /** Tile edge in px */
  tile: number
  /** Gap between tiles in px */
  gap: number
  /** On-screen key height in px (always >= 42 for comfortable tapping) */
  keyH: number
  /** Gap between keys / key rows in px */
  keyGap: number
  /** Short landscape screens: board and keyboard side by side */
  side: boolean
  /** Keyboard width in side-by-side mode */
  kbWidth: number
}

/** Room the fixed site navigation takes at the top of the viewport. */
const NAV_CLEARANCE = 92
/** Small screens have a floating theme/sound cluster in the bottom-right corner. */
const MOBILE_BOTTOM_CLEARANCE = 76
const DESKTOP_BOTTOM_CLEARANCE = 28
const MIN_TILE = 24

/** Document offset that ignores transforms (the page fades in with a translate). */
function docTop(el: HTMLElement): number {
  let y = 0
  let node: HTMLElement | null = el
  while (node) {
    y += node.offsetTop
    node = node.offsetParent as HTMLElement | null
  }
  return y
}

export function computeLayout(root: HTMLElement, anchor: HTMLElement | null): BoardLayout & { scrollTo: number | null } {
  // innerWidth (scrollbar included) is what CSS breakpoints compare against.
  const vw = window.innerWidth
  const vh = window.innerHeight
  const side = vw > vh && vh < 540 && vw >= 560
  const small = vw < 640
  const keyH = side || vh < 720 ? 42 : small || vh < 860 ? 48 : 54
  const keyGap = small || side ? 5 : 7
  const kbH = 3 * keyH + 2 * keyGap
  const gap = small || side ? 5 : 6
  const between = side ? 0 : small ? 12 : 18
  const bottom = vw < 768 ? MOBILE_BOTTOM_CLEARANCE : DESKTOP_BOTTOM_CLEARANCE

  const rootTop = docTop(root)
  const anchorTop = side || !anchor ? rootTop : Math.min(rootTop, docTop(anchor))
  const below = side ? 0 : kbH + between
  const rows = (height: number) => (height - 5 * gap) / 6

  const rootW = root.clientWidth || vw - 32
  const kbWidth = side ? Math.min(Math.round(rootW * 0.54), 440) : 0
  // Leave a little room for the board's soft glow so it never pokes past the screen edge.
  const boardW = side ? rootW - kbWidth - 20 : rootW - 12
  const cap = Math.min((boardW - 4 * gap) / 5, vw >= 1024 ? 66 : small ? 60 : 62)

  // 1) Everything fits under the page header without scrolling?
  const fromTop = rows(vh - rootTop - below - (side ? 12 : bottom))
  // 2) Otherwise size for "game area right under the nav" and scroll there.
  const fromAnchor = rows(vh - NAV_CLEARANCE - 8 - (rootTop - anchorTop) - below - (side ? 12 : bottom))

  // Below this, tiles look lost next to the keyboard: better to glide down.
  const comfortable = small ? 38 : 44
  let tile: number
  let scrollTo: number | null = null
  if (fromTop >= Math.min(cap, comfortable)) {
    tile = Math.min(fromTop, cap)
  } else {
    tile = Math.min(Math.max(fromAnchor, fromTop), cap)
    scrollTo = Math.max(0, anchorTop - NAV_CLEARANCE - 8)
  }
  tile = Math.max(MIN_TILE, Math.floor(tile))

  return { tile, gap, keyH, keyGap, side, kbWidth, scrollTo }
}

export function useBoardLayout(
  rootRef: RefObject<HTMLElement | null>,
  anchorRef: RefObject<HTMLElement | null>,
  {
    autoScroll = true,
    reducedMotion = false,
    relayoutKey,
  }: {
    autoScroll?: boolean
    reducedMotion?: boolean
    /** Change it when something above the board may change height (e.g. the mode, which adds a header button). */
    relayoutKey?: string
  } = {},
): BoardLayout | null {
  const [layout, setLayout] = useState<BoardLayout | null>(null)
  const scrolledFor = useRef<string | null>(null)
  // Where the automatic glide put the page (null until it has happened).
  const autoScrolledTo = useRef<number | null>(null)
  const lastSize = useRef<{ w: number; h: number } | null>(null)
  // Read at scroll time; kept out of the effect deps so its post-hydration
  // flip doesn't cancel the pending scroll.
  const reducedRef = useRef(reducedMotion)
  useEffect(() => {
    reducedRef.current = reducedMotion
  }, [reducedMotion])

  useLayoutEffect(() => {
    const timers: number[] = []
    let scrollTimer: number | null = null
    const measure = (force: boolean) => {
      const root = rootRef.current
      if (!root) return
      const w = window.innerWidth
      const h = window.innerHeight
      // Mobile browsers fire resize while the URL bar slides in and out; ignore
      // small height-only changes so the board doesn't jiggle mid-game.
      const prev = lastSize.current
      if (!force && prev && prev.w === w && Math.abs(prev.h - h) < 100) return
      lastSize.current = { w, h }

      const { scrollTo, ...next } = computeLayout(root, anchorRef.current)
      setLayout((cur) =>
        cur &&
        cur.tile === next.tile &&
        cur.keyH === next.keyH &&
        cur.side === next.side &&
        cur.gap === next.gap &&
        cur.kbWidth === next.kbWidth &&
        cur.keyGap === next.keyGap
          ? cur
          : next,
      )

      // Glide the game into view once per orientation if it doesn't fit as laid out.
      const orientation = w > h ? 'landscape' : 'portrait'
      if (autoScroll && scrollTo !== null && scrolledFor.current !== orientation) {
        if (scrollTimer !== null) window.clearTimeout(scrollTimer)
        scrollTimer = window.setTimeout(() => {
          scrollTimer = null
          scrolledFor.current = orientation
          // Don't fight her if she has already scrolled somewhere herself.
          if (window.scrollY < 40 || orientation === 'landscape') {
            window.scrollTo({ top: scrollTo, behavior: reducedRef.current ? 'auto' : 'smooth' })
            autoScrolledTo.current = scrollTo
          }
        }, 350)
      } else if (
        autoScroll &&
        scrollTo !== null &&
        autoScrolledTo.current !== null &&
        scrollTo !== autoScrolledTo.current &&
        Math.abs(window.scrollY - autoScrolledTo.current) < 2
      ) {
        // Something above the game changed height after the glide (and she hasn't
        // scrolled since): keep the game where it was instead of sliding it under
        // the floating controls.
        window.scrollTo({ top: scrollTo, behavior: 'auto' })
        autoScrolledTo.current = scrollTo
      }
    }

    measure(true)
    const onResize = () => measure(false)
    const onOrientation = () => {
      timers.push(window.setTimeout(() => measure(true), 250))
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onOrientation)
    let cancelled = false
    // Web fonts can change the header height a little once they arrive.
    document.fonts?.ready
      .then(() => {
        if (!cancelled) measure(true)
      })
      .catch(() => {})
    return () => {
      cancelled = true
      timers.forEach((t) => window.clearTimeout(t))
      if (scrollTimer !== null) window.clearTimeout(scrollTimer)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onOrientation)
    }
  }, [autoScroll, relayoutKey])

  return layout
}
