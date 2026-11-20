'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { motion, AnimatePresence, type Transition } from 'framer-motion'
import { Eye, Heart } from 'lucide-react'
import type { LocalPhoto } from '@/lib/photos'
import { sfx, haptic } from '@/lib/sound'
import { chainToGap, cropGeometry, directionOf, emptyId, sourceForDirection, type Direction } from './puzzleLogic'
import { FRAME_PAD } from './useBoardSize'
import styles from './puzzle.module.css'

export type Stage = 'intro-whole' | 'intro-crack' | 'play' | 'win-merge' | 'win-fill' | 'win-shimmer' | 'win-done'

interface PuzzleBoardProps {
  board: number[]
  n: number
  photo: LocalPhoto
  /** Board edge in px (multiple of n) */
  size: number
  stage: Stage
  showNumbers: boolean
  peek: boolean
  /** Tiles are flying to a fresh scramble: use a softer, staggered spring */
  shuffling: boolean
  reducedMotion: boolean
  canHover: boolean
  /** Try to slide the tile at a grid position toward the gap. Returns false for an illegal move. */
  onMove: (pos: number) => boolean
  /** Tapping the board while the full picture is showing hides it again */
  onPeekDismiss: () => void
  describedBy?: string
}

const SWIPE_PX = 24
const EASE = 'cubic-bezier(.22,1,.36,1)'
const GAP_MS = 650

const HINT_OFFSET: Record<Direction, [number, number]> = {
  left: [-3, 0],
  right: [3, 0],
  up: [0, -3],
  down: [0, 3],
}

const TILE_SHADOW =
  'inset 0 1px 0 rgba(255,255,255,.45), inset 0 0 0 1px rgba(255,255,255,.16), inset 0 -12px 20px -10px rgba(0,0,0,.38), 0 4px 10px -3px rgba(0,0,0,.28)'

/** Rough perceived brightness of a #rrggbb colour, 0–1. */
function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return 0.5
  const v = parseInt(m[1], 16)
  return (0.299 * ((v >> 16) & 255) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255)) / 255
}

export default function PuzzleBoard({
  board,
  n,
  photo,
  size,
  stage,
  showNumbers,
  peek,
  shuffling,
  reducedMotion,
  canHover,
  onMove,
  onPeekDismiss,
  describedBy,
}: PuzzleBoardProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const gesture = useRef<{ id: number; x: number; y: number; startPos: number | null } | null>(null)
  const [hoverPos, setHoverPos] = useState<number | null>(null)
  const [nudge, setNudge] = useState<{ id: number; key: number } | null>(null)

  const total = n * n
  const empty = emptyId(n)
  const cell = size / n
  const merged = stage === 'intro-whole' || stage.startsWith('win')
  const filled = stage === 'intro-whole' || stage === 'win-fill' || stage === 'win-shimmer' || stage === 'win-done'
  const interactive = stage === 'play'
  const solvedGlow = stage.startsWith('win')

  // Gap / corner transitions only while the gaps open or close, so a resize
  // (new tile size) snaps instead of sliding the picture around inside tiles.
  const [lastMerged, setLastMerged] = useState(merged)
  const [gapAnimating, setGapAnimating] = useState(false)
  if (lastMerged !== merged) {
    setLastMerged(merged)
    setGapAnimating(true)
  }
  useEffect(() => {
    if (!gapAnimating) return
    const t = window.setTimeout(() => setGapAnimating(false), GAP_MS + 150)
    return () => window.clearTimeout(t)
  }, [gapAnimating])

  // Tiles that just slid into their home position get a brief golden glow.
  // (Skipped for whole-board changes like a reshuffle.)
  const [prevBoard, setPrevBoard] = useState(board)
  const [homeFlash, setHomeFlash] = useState<{ ids: number[]; key: number } | null>(null)
  if (prevBoard !== board) {
    setPrevBoard(board)
    let changed = 0
    const landed: number[] = []
    for (let pos = 0; pos < board.length; pos++) {
      if (board[pos] === prevBoard[pos]) continue
      changed++
      if (board[pos] === pos && board[pos] !== board.length - 1) landed.push(pos)
    }
    if (landed.length > 0 && changed <= n + 1 && stage === 'play') {
      setHomeFlash((prev) => ({ ids: landed, key: (prev?.key ?? 0) + 1 }))
    }
  }
  useEffect(() => {
    if (!homeFlash) return
    const t = window.setTimeout(() => setHomeFlash(null), 950)
    return () => window.clearTimeout(t)
  }, [homeFlash])

  // Clear a finished wiggle so it can't replay when the tile re-renders.
  useEffect(() => {
    if (!nudge) return
    const t = window.setTimeout(() => setNudge(null), 420)
    return () => window.clearTimeout(t)
  }, [nudge])

  const baseGap = size < 300 ? 3 : n >= 5 ? 3 : 4
  const gap = merged ? 0 : baseGap
  const radius = merged ? 0 : Math.round(Math.min(14, Math.max(5, cell * 0.09)))
  const { bgW, bgH, offX, offY } = useMemo(() => cropGeometry(photo, size), [photo, size])
  const bgImage = `url("${photo.src}"), url("${photo.blur}")`

  const posOf = useMemo(() => {
    const arr = new Array<number>(board.length)
    board.forEach((id, pos) => {
      arr[id] = pos
    })
    return arr
  }, [board])
  const emptyPos = posOf[empty] ?? total - 1

  const chain = useMemo(() => {
    if (!canHover || !interactive || peek || hoverPos === null) return null
    return chainToGap(board, n, hoverPos)
  }, [canHover, interactive, peek, hoverPos, board, n])
  const chainSet = useMemo(() => new Set(chain ?? []), [chain])
  const chainDir = chain && hoverPos !== null ? directionOf(board, n, hoverPos) : null

  const moveSpring: Transition = reducedMotion
    ? { duration: 0.08 }
    : { type: 'spring', stiffness: 560, damping: 40, mass: 0.7 }
  const shuffleSpring = (id: number): Transition =>
    reducedMotion
      ? { duration: 0.12 }
      : { type: 'spring', stiffness: 150, damping: 19, mass: 0.9, delay: ((id * 37) % 13) * 0.022 }

  const gapTransition = gapAnimating ? `padding ${GAP_MS}ms ${EASE}` : undefined
  const innerTransition = [
    gapAnimating ? `background-position ${GAP_MS}ms ${EASE}, border-radius ${GAP_MS}ms ${EASE}, box-shadow ${GAP_MS}ms ease` : null,
    'transform 180ms ease, filter 180ms ease',
  ]
    .filter(Boolean)
    .join(', ')

  // ---- pointer input: taps, swipes, hover hints ---------------------------------
  const posFromPoint = (clientX: number, clientY: number): number | null => {
    const el = boardRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return null
    const c = Math.min(n - 1, Math.floor(x / (rect.width / n)))
    const r = Math.min(n - 1, Math.floor(y / (rect.height / n)))
    return r * n + c
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Ignore a second finger; a new primary pointer replaces any stale gesture.
    if (gesture.current && !e.isPrimary) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, startPos: posFromPoint(e.clientX, e.clientY) }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* not supported */
    }
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    const frame = frameRef.current
    if (frame) {
      const rect = frame.getBoundingClientRect()
      frame.style.setProperty('--mx', `${e.clientX - rect.left}px`)
      frame.style.setProperty('--my', `${e.clientY - rect.top}px`)
    }
    if (!gesture.current) {
      const pos = posFromPoint(e.clientX, e.clientY)
      setHoverPos((prev) => (prev === pos ? prev : pos))
    }
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (!g || g.id !== e.pointerId) return
    gesture.current = null
    if (!interactive) return
    if (peek) {
      onPeekDismiss()
      return
    }
    const dx = e.clientX - g.x
    const dy = e.clientY - g.y
    if (Math.max(Math.abs(dx), Math.abs(dy)) >= SWIPE_PX) {
      const dir: Direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'
      // Pushing a tile that's in line with the gap moves that tile (and the ones before it);
      // otherwise the swipe moves whichever tile borders the gap on that side.
      const target = g.startPos !== null && directionOf(board, n, g.startPos) === dir ? g.startPos : sourceForDirection(board, n, dir)
      if (target === null || !onMove(target)) haptic(8)
      return
    }
    const pos = g.startPos
    if (pos === null) return
    if (!onMove(pos) && board[pos] !== empty) {
      setNudge((prev) => ({ id: board[pos], key: (prev?.key ?? 0) + 1 }))
      sfx.miss()
      haptic(18)
    }
  }

  const onPointerCancel = () => {
    gesture.current = null
  }

  const auraColor = luminance(photo.color) < 0.18 || luminance(photo.color) > 0.92 ? '#fb7185' : photo.color

  const frameStyle = {
    width: size + FRAME_PAD * 2,
    padding: FRAME_PAD,
    '--mx': '50%',
    '--my': '50%',
  } as CSSProperties

  return (
    <div className="relative isolate mx-auto" style={{ width: size + FRAME_PAD * 2 }}>
      {/* Soft aura in the photo's own colour */}
      <div
        aria-hidden
        className={`pointer-events-none absolute -inset-3 -z-10 rounded-[3rem] blur-2xl sm:-inset-6 ${styles.aura}`}
        style={{ background: `radial-gradient(closest-side, ${auraColor}88, ${auraColor}22 60%, transparent)` }}
      />

      <div
        ref={frameRef}
        className={`group relative rounded-[1.6rem] border bg-white/55 backdrop-blur-md transition-[box-shadow,border-color] duration-700 dark:bg-white/[0.04] ${
          solvedGlow
            ? 'border-amber-200 shadow-[0_0_0_3px_rgba(251,191,36,0.28),0_24px_70px_-20px_rgba(244,63,94,0.6)] dark:border-amber-200/40 dark:shadow-[0_0_0_3px_rgba(251,191,36,0.2),0_24px_70px_-20px_rgba(168,85,247,0.6)]'
            : 'border-white/70 shadow-[0_24px_60px_-24px_rgba(244,63,94,0.45)] dark:border-white/10 dark:shadow-[0_24px_60px_-24px_rgba(168,85,247,0.5)]'
        }`}
        style={frameStyle}
      >
        {/* Cursor spotlight (mouse only) */}
        {canHover && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{ background: 'radial-gradient(220px circle at var(--mx) var(--my), rgba(255,255,255,0.55), transparent 70%)' }}
          />
        )}

        <div
          ref={boardRef}
          role="group"
          aria-roledescription="sliding puzzle"
          aria-label={`Picture puzzle, ${n} by ${n}`}
          aria-describedby={describedBy}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onLostPointerCapture={onPointerCancel}
          onPointerLeave={() => setHoverPos(null)}
          onContextMenu={(e) => e.preventDefault()}
          className={`relative touch-none overflow-hidden rounded-[1.1rem] bg-rose-200/45 shadow-[inset_0_2px_12px_rgba(0,0,0,0.14)] outline-none ring-rose-300/70 ring-offset-2 ring-offset-transparent focus-visible:ring-4 dark:bg-black/45 dark:ring-purple-400/60 ${styles.noCallout}`}
          style={{ width: size, height: size, cursor: interactive ? (chain ? 'pointer' : 'default') : 'default' }}
        >
          {/* Empty slot */}
          {!merged && size > 0 && (
            <div
              aria-hidden
              className="absolute left-0 top-0"
              style={{ width: cell, height: cell, padding: gap / 2, transform: `translate(${(emptyPos % n) * cell}px, ${Math.floor(emptyPos / n) * cell}px)` }}
            >
              <div
                className="flex h-full w-full items-center justify-center border-2 border-dashed border-rose-300/80 bg-white/20 dark:border-purple-300/30 dark:bg-white/[0.03]"
                style={{ borderRadius: radius }}
              >
                <Heart
                  className={`text-rose-400 dark:text-purple-300 ${styles.heartbeat}`}
                  style={{ width: Math.max(12, cell * 0.22), height: Math.max(12, cell * 0.22) }}
                  fill="currentColor"
                  strokeWidth={0}
                />
              </div>
            </div>
          )}

          {/* Tiles */}
          {size > 0 &&
            Array.from({ length: total - 1 }, (_, id) => {
              const pos = posOf[id]
              const r = Math.floor(pos / n)
              const c = pos % n
              const hr = Math.floor(id / n)
              const hc = id % n
              const highlighted = chainSet.has(pos)
              const [hx, hy] = highlighted && chainDir ? HINT_OFFSET[chainDir] : [0, 0]
              const nudgeKey = nudge && nudge.id === id ? nudge.key : null
              const nudged = nudgeKey !== null
              const home = pos === id
              return (
                <motion.div
                  key={id}
                  aria-hidden
                  className="absolute left-0 top-0 z-10"
                  style={{ width: cell, height: cell, padding: gap / 2, transition: gapTransition }}
                  initial={false}
                  animate={{ x: c * cell, y: r * cell }}
                  transition={shuffling ? shuffleSpring(id) : moveSpring}
                >
                  <div
                    key={nudged ? `nudge-${nudgeKey}` : 'tile'}
                    className={`relative h-full w-full overflow-hidden ${nudged ? styles.wiggle : ''}`}
                    style={{
                      backgroundImage: bgImage,
                      backgroundSize: `${bgW}px ${bgH}px`,
                      backgroundPosition: `${-(offX + hc * cell + gap / 2)}px ${-(offY + hr * cell + gap / 2)}px`,
                      backgroundRepeat: 'no-repeat',
                      backgroundColor: photo.color,
                      borderRadius: radius,
                      boxShadow: merged ? 'none' : TILE_SHADOW,
                      transform: `translate(${hx}px, ${hy}px)`,
                      filter: highlighted ? 'brightness(1.08) saturate(1.08)' : undefined,
                      transition: innerTransition,
                    }}
                  >
                    <span
                      className={`pointer-events-none absolute inset-0 ring-2 ring-inset ring-white/80 transition-opacity duration-200 ${highlighted ? 'opacity-100' : 'opacity-0'}`}
                      style={{ borderRadius: radius, background: 'linear-gradient(135deg, rgba(255,255,255,0.22), transparent 55%)' }}
                    />
                    {homeFlash && homeFlash.ids.includes(id) && (
                      <span
                        key={`flash-${homeFlash.key}`}
                        className={`pointer-events-none absolute inset-0 ring-2 ring-inset ring-amber-200 ${styles.homeFlash}`}
                        style={{ borderRadius: radius, boxShadow: 'inset 0 0 18px rgba(253,230,138,0.85)' }}
                      />
                    )}
                    {showNumbers && !merged && (
                      <span
                        className={`pointer-events-none absolute left-1 top-1 flex items-center justify-center rounded-md px-1 font-sans font-bold text-white shadow-sm backdrop-blur-sm transition-colors duration-300 ${
                          home ? 'bg-rose-500/90 dark:bg-purple-500/90' : 'bg-black/45'
                        } ${cell < 64 ? 'min-w-[1rem] text-[9px] leading-4' : 'min-w-[1.25rem] text-[11px] leading-5'}`}
                      >
                        {id + 1}
                      </span>
                    )}
                  </div>
                </motion.div>
              )
            })}

          {/* The missing last piece — fades in when the picture is complete */}
          {size > 0 && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute left-0 top-0 z-20"
              style={{ width: cell, height: cell, x: (n - 1) * cell, y: (n - 1) * cell, padding: gap / 2, transition: gapTransition }}
              initial={false}
              animate={{ opacity: filled ? 1 : 0, scale: filled ? 1 : 0.82 }}
              transition={reducedMotion ? { duration: 0.1 } : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                className="h-full w-full"
                style={{
                  backgroundImage: bgImage,
                  backgroundSize: `${bgW}px ${bgH}px`,
                  backgroundPosition: `${-(offX + (n - 1) * cell + gap / 2)}px ${-(offY + (n - 1) * cell + gap / 2)}px`,
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: photo.color,
                  borderRadius: radius,
                  transition: innerTransition,
                }}
              />
            </motion.div>
          )}

          {/* Peek: the whole picture */}
          <AnimatePresence>
            {peek && size > 0 && (
              <motion.div
                key="peek"
                aria-hidden
                className="pointer-events-none absolute inset-0 z-30"
                initial={{ opacity: 0, scale: reducedMotion ? 1 : 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: reducedMotion ? 1 : 1.02 }}
                transition={{ duration: 0.22 }}
                style={{
                  backgroundImage: bgImage,
                  backgroundSize: `${bgW}px ${bgH}px`,
                  backgroundPosition: `${-offX}px ${-offY}px`,
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: photo.color,
                }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.28))]" />
                <div className="absolute inset-x-0 top-3 flex justify-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md">
                    <Eye className="h-3.5 w-3.5" /> Peeking
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Shimmer across the finished photo */}
          {stage === 'win-shimmer' && !reducedMotion && (
            <div aria-hidden className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 w-1/2"
                style={{
                  background:
                    'linear-gradient(105deg, rgba(255,255,255,0) 15%, rgba(255,255,255,0.18) 35%, rgba(255,255,255,0.62) 50%, rgba(255,255,255,0.18) 65%, rgba(255,255,255,0) 85%)',
                }}
                initial={{ x: '-110%' }}
                animate={{ x: '220%' }}
                transition={{ duration: 1.05, ease: [0.45, 0, 0.25, 1] }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
