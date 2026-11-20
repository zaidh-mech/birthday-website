'use client'

import { memo, useEffect, useMemo, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { burstFromElement } from '@/lib/celebrate'
import { MAX_GUESSES, WORD_LENGTH, describeGuess, evaluateGuess, type GameData, type LetterState } from './logic'
import { TILE_STATE_CLASSES, cx } from './tileStyles'
import styles from './secretWord.module.css'

export const FLIP_MS = 520
export const FLIP_STAGGER_MS = 250

/** Web Animations API call that quietly does nothing on browsers without it. */
function play(el: HTMLElement | null | undefined, keyframes: Keyframe[], options: KeyframeAnimationOptions) {
  if (!el || typeof el.animate !== 'function') return
  try {
    el.animate(keyframes, options)
  } catch {
    /* ignore */
  }
}

interface TileProps {
  letter: string
  state: LetterState | null
  /** Turned over to show its colour */
  flipped: boolean
  /** Animate the turn (only the row being revealed right now) */
  animate: boolean
  col: number
  row: number
  caret: boolean
  hintLetter: string | null
  staggerMs: number
  flipMs: number
  tileRef: (el: HTMLDivElement | null) => void
}

const Tile = memo(function Tile({ letter, state, flipped, animate, col, row, caret, hintLetter, staggerMs, flipMs, tileRef }: TileProps) {
  const showHint = !letter && hintLetter
  // Kept independent of `animate` so the sweep doesn't jump when the reveal ends.
  const shineDelay = col * staggerMs + flipMs * 0.75 + row * 40
  const style = {
    '--flip-ms': `${flipMs}ms`,
    '--flip-delay': animate ? `${col * staggerMs}ms` : '0ms',
    '--shine-delay': `${Math.round(shineDelay)}ms`,
  } as CSSProperties

  return (
    <div ref={tileRef} className={cx(styles.tile, flipped && styles.flipped, !animate && styles.still)} style={style} aria-hidden="true">
      <div className={styles.inner}>
        <div
          className={cx(
            styles.face,
            'rounded-[22%] border-2 font-serif font-bold uppercase leading-none transition-colors duration-150',
            letter
              ? 'border-rose-400 bg-white/85 text-gray-900 shadow-[0_6px_16px_-8px_rgba(244,63,94,0.55)] dark:border-purple-300/70 dark:bg-white/10 dark:text-white dark:shadow-[0_6px_16px_-8px_rgba(168,85,247,0.6)]'
              : showHint
                ? 'border-amber-300 bg-amber-50/85 text-amber-500/75 dark:border-amber-300/50 dark:bg-amber-300/10 dark:text-amber-200/70'
                : 'border-rose-200/80 bg-white/40 dark:border-white/15 dark:bg-white/[0.04]',
            caret && styles.caret,
            showHint && styles.hintGlow,
          )}
        >
          {letter || hintLetter || ''}
        </div>
        {state && (
          <div className={cx(styles.face, styles.back, 'rounded-[22%] font-serif font-bold uppercase leading-none', TILE_STATE_CLASSES[state], state === 'correct' && styles.shine)}>
            {letter}
          </div>
        )}
      </div>
    </div>
  )
})

interface BoardProps {
  game: GameData | null
  tile: number | null
  gap: number | null
  /** Row currently flipping over (in this game), or null */
  revealingRow: number | null
  /** Changes every time the current row should shake */
  shakeNonce: number
  /** The winning row to celebrate */
  bounce: { row: number; nonce: number } | null
  toast: { id: number; text: string } | null
  reducedMotion: boolean
  canHover: boolean
}

interface RowModel {
  letters: string
  states: (LetterState | null)[]
  kind: 'done' | 'active' | 'empty'
  label: string
}

export default function Board({ game, tile, gap, revealingRow, shakeNonce, bounce, toast, reducedMotion, canHover }: BoardProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const tiltRef = useRef<HTMLDivElement>(null)
  const rowEls = useRef<(HTMLDivElement | null)[]>([])
  const tileEls = useRef<(HTMLDivElement | null)[]>([])
  const tileRefSetters = useMemo(
    () =>
      Array.from({ length: MAX_GUESSES * WORD_LENGTH }, (_, i) => (el: HTMLDivElement | null) => {
        tileEls.current[i] = el
      }),
    [],
  )
  const rowRefSetters = useMemo(
    () =>
      Array.from({ length: MAX_GUESSES }, (_, i) => (el: HTMLDivElement | null) => {
        rowEls.current[i] = el
      }),
    [],
  )

  const staggerMs = reducedMotion ? 0 : FLIP_STAGGER_MS
  const flipMs = reducedMotion ? 0 : FLIP_MS
  const activeRow = game && game.status === 'playing' ? game.guesses.length : -1
  const current = game?.current ?? ''

  const rows: RowModel[] = useMemo(() => {
    return Array.from({ length: MAX_GUESSES }, (_, r): RowModel => {
      if (game && r < game.guesses.length) {
        const guess = game.guesses[r]
        return { letters: guess, states: evaluateGuess(guess, game.word), kind: 'done', label: `Guess ${r + 1}: ${describeGuess(guess, game.word)}` }
      }
      if (r === activeRow) {
        return {
          letters: current,
          states: Array.from({ length: WORD_LENGTH }, () => null),
          kind: 'active',
          label: current ? `Guess ${r + 1}, typing: ${current.split('').join(' ')}` : `Guess ${r + 1}, empty`,
        }
      }
      return { letters: '', states: Array.from({ length: WORD_LENGTH }, () => null), kind: 'empty', label: `Guess ${r + 1}, empty` }
    })
  }, [game, activeRow, current])

  // Pop the tile that just received a letter.
  const prevLen = useRef(0)
  useEffect(() => {
    const len = current.length
    if (len > prevLen.current && activeRow >= 0 && !reducedMotion) {
      play(
        tileEls.current[activeRow * WORD_LENGTH + len - 1],
        [{ transform: 'scale(1)' }, { transform: 'scale(1.13)' }, { transform: 'scale(1)' }],
        { duration: 150, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
      )
    }
    prevLen.current = len
  }, [current, activeRow, reducedMotion])

  // Shake the current row ("not enough letters").
  useEffect(() => {
    if (!shakeNonce || reducedMotion || activeRow < 0) return
    play(
      rowEls.current[activeRow],
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-9px)' },
        { transform: 'translateX(8px)' },
        { transform: 'translateX(-6px)' },
        { transform: 'translateX(5px)' },
        { transform: 'translateX(-2px)' },
        { transform: 'translateX(0)' },
      ],
      { duration: 460, easing: 'ease-in-out' },
    )
  }, [shakeNonce])

  // The winning row does a little wave, then hearts fly out of it.
  useEffect(() => {
    if (!bounce) return
    const rowEl = rowEls.current[bounce.row]
    if (!reducedMotion) {
      for (let c = 0; c < WORD_LENGTH; c++) {
        play(
          tileEls.current[bounce.row * WORD_LENGTH + c],
          [
            { transform: 'translateY(0) scale(1)' },
            { transform: 'translateY(-38%) scale(1.06)', offset: 0.35 },
            { transform: 'translateY(6%) scale(0.98)', offset: 0.65 },
            { transform: 'translateY(0) scale(1)' },
          ],
          { duration: 620, delay: c * 95, easing: 'ease-out' },
        )
      }
    }
    const t = window.setTimeout(() => burstFromElement(rowEl ?? null, { hearts: true, particleCount: 45, spread: 80 }), reducedMotion ? 0 : 260)
    return () => window.clearTimeout(t)
  }, [bounce?.nonce])

  // Gentle 3D tilt + spotlight that follows the mouse (desktop only).
  const interactive = canHover && !reducedMotion
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactive || e.pointerType !== 'mouse') return
    const wrap = wrapRef.current
    const tilt = tiltRef.current
    if (!wrap || !tilt) return
    const rect = wrap.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    wrap.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`)
    wrap.style.setProperty('--my', `${(y * 100).toFixed(1)}%`)
    tilt.style.setProperty('--tilt-x', `${((0.5 - y) * 7).toFixed(2)}deg`)
    tilt.style.setProperty('--tilt-y', `${((x - 0.5) * 9).toFixed(2)}deg`)
    wrap.classList.add(styles.spotOn)
  }
  const onPointerLeave = () => {
    const wrap = wrapRef.current
    const tilt = tiltRef.current
    if (!wrap || !tilt) return
    tilt.style.setProperty('--tilt-x', '0deg')
    tilt.style.setProperty('--tilt-y', '0deg')
    wrap.classList.remove(styles.spotOn)
  }

  const sizeStyle = {
    '--tile': tile ? `${tile}px` : 'clamp(26px, min(12.5vw, calc((100dvh - 330px) / 7.2)), 60px)',
    '--gap': gap ? `${gap}px` : '5px',
    gap: 'var(--gap)',
    fontSize: 'calc(var(--tile) * 0.5)',
  } as CSSProperties

  return (
    <div ref={wrapRef} className={styles.boardWrap} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
      <div
        aria-hidden="true"
        className={cx(
          styles.glow,
          'bg-gradient-to-br from-rose-200/80 via-pink-100/50 to-amber-100/70 dark:from-purple-600/30 dark:via-fuchsia-500/10 dark:to-indigo-500/30',
        )}
      />
      <div aria-hidden="true" className={styles.spot} />

      <div ref={tiltRef} role="group" aria-label="Secret word board" className={cx('flex flex-col', interactive && styles.tilt)} style={sizeStyle}>
        {rows.map((row, r) => (
          <div key={r} ref={rowRefSetters[r]} role="group" aria-label={row.label} className="flex" style={{ gap: 'var(--gap)' }}>
            {Array.from({ length: WORD_LENGTH }, (_, c) => {
              const isActive = row.kind === 'active'
              const hintLetter = isActive && game && game.hint === c ? game.word[c] : null
              return (
                <Tile
                  key={c}
                  letter={row.letters[c] ?? ''}
                  state={row.states[c]}
                  flipped={row.kind === 'done'}
                  animate={row.kind === 'done' && r === revealingRow && !reducedMotion}
                  col={c}
                  row={r}
                  caret={isActive && c === row.letters.length}
                  hintLetter={hintLetter}
                  staggerMs={staggerMs}
                  flipMs={flipMs}
                  tileRef={tileRefSetters[r * WORD_LENGTH + c]}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Little messages ("Not enough letters", hints) float over the top of the board. */}
      <div className="pointer-events-none absolute left-1/2 top-0 z-10 flex w-max max-w-[min(calc(100vw-2rem),20rem)] -translate-x-1/2 -translate-y-1/2 justify-center">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -8, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="max-w-full rounded-full bg-gray-900/90 px-4 py-2 text-center text-xs font-semibold text-white shadow-lg backdrop-blur-md sm:text-sm dark:bg-white/90 dark:text-gray-900"
            >
              {toast.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
