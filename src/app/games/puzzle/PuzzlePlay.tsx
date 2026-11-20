'use client'

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Keyboard, Trophy } from 'lucide-react'
import type { LocalPhoto } from '@/lib/photos'
import { formatClock } from '@/lib/hooks'
import PuzzleBoard, { type Stage } from './PuzzleBoard'
import { ActionButton, PeekButton, ToggleButton, icons } from './PuzzleControls'
import { countCorrect, type PuzzleSize } from './puzzleLogic'
import { photoDateLabel } from './puzzleText'
import { FRAME_PAD, useBoardSize } from './useBoardSize'

export interface PuzzleGameState {
  photo: LocalPhoto
  n: PuzzleSize
  board: number[]
  /** Changes for every new photo/size so the board remounts fresh */
  round: number
}

interface PuzzlePlayProps {
  game: PuzzleGameState
  stage: Stage
  showNumbers: boolean
  peek: boolean
  shuffling: boolean
  reducedMotion: boolean
  canHover: boolean
  best: number | null
  bestTime: number | null
  winOpen: boolean
  onMove: (pos: number) => boolean
  onPeekHold: (held: boolean) => void
  onPeekToggle: () => void
  onPeekDismiss: () => void
  onToggleNumbers: () => void
  onChangePhoto: () => void
  onReplay: () => void
}

const HINT_ID = 'puzzle-board-instructions'

export default function PuzzlePlay({
  game,
  stage,
  showNumbers,
  peek,
  shuffling,
  reducedMotion,
  canHover,
  best,
  bestTime,
  winOpen,
  onMove,
  onPeekHold,
  onPeekToggle,
  onPeekDismiss,
  onToggleNumbers,
  onChangePhoto,
  onReplay,
}: PuzzlePlayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const size = useBoardSize(containerRef, game.n)
  const pieces = game.n * game.n - 1
  const solved = stage.startsWith('win')
  const correct = solved ? pieces : countCorrect(game.board)
  const pct = Math.round((correct / pieces) * 100)
  const dateLabel = photoDateLabel(game.photo)
  const ready = size > 0

  // Bring the board into view when a game starts (the Start button can be far down on phones).
  useEffect(() => {
    if (!ready) return
    const id = window.requestAnimationFrame(() => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const boardBottom = rect.top + size + FRAME_PAD * 2
      if (rect.top >= 96 && boardBottom <= window.innerHeight) return
      // Leave room above for the moves / time chips.
      const top = Math.max(0, rect.top + window.scrollY - 170)
      window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' })
    })
    return () => window.cancelAnimationFrame(id)
  }, [ready, game.round])

  return (
    <motion.div
      ref={containerRef}
      initial={reducedMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
      style={{ visibility: ready ? 'visible' : 'hidden' }}
    >
      <p id={HINT_ID} className="sr-only">
        Tap a tile in the same row or column as the empty space to slide it, swipe on the board, or use the arrow keys or W A S D. Tiles move in
        the direction you press. P toggles peek, N toggles numbers.
      </p>

      <div className="flex flex-col items-center gap-5 lg:flex-row lg:items-start lg:justify-center lg:gap-8">
        {/* Board column */}
        <div className="flex min-w-0 flex-col items-center">
          <PuzzleBoard
            key={game.round}
            board={game.board}
            n={game.n}
            photo={game.photo}
            size={size}
            stage={stage}
            showNumbers={showNumbers}
            peek={peek}
            shuffling={shuffling}
            reducedMotion={reducedMotion}
            canHover={canHover}
            onMove={onMove}
            onPeekDismiss={onPeekDismiss}
            describedBy={HINT_ID}
          />

          <div className="mt-4 min-h-[1.75rem] text-center">
            <AnimatePresence mode="wait" initial={false}>
              {stage === 'win-done' && !winOpen ? (
                <motion.p
                  key="caption"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="font-cursive text-xl text-rose-600 sm:text-2xl dark:text-purple-200"
                >
                  {dateLabel}
                </motion.p>
              ) : stage.startsWith('intro') ? (
                <motion.p
                  key="intro"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-serif text-sm italic text-rose-900/70 dark:text-rose-100/70"
                >
                  Remember this one? Now put it back together…
                </motion.p>
              ) : (
                !solved && (
                  <motion.p
                    key="hint"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-500 lg:hidden dark:text-gray-400"
                  >
                    Tap or swipe tiles into the <Heart className="h-3 w-3 text-rose-400 dark:text-purple-300" fill="currentColor" strokeWidth={0} /> space
                  </motion.p>
                )
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Controls: a row under the board on phones/tablets, a side panel on lg */}
        <aside
          aria-label="Puzzle controls"
          className="flex w-full max-w-[var(--bw)] flex-col gap-3 lg:w-[17rem] lg:max-w-none"
          style={{ '--bw': `${size + FRAME_PAD * 2}px` } as CSSProperties}
        >
          <Polaroid photo={game.photo} label={dateLabel} onClick={onPeekToggle} disabled={stage !== 'play'} />

          <div className="order-2 rounded-2xl border border-rose-100 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-md lg:order-none dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-400 dark:text-purple-300">
              <span>Pieces home</span>
              <span className="tabular-nums text-gray-700 dark:text-gray-200">
                {correct}/{pieces}
              </span>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-rose-100 dark:bg-white/10"
              role="progressbar"
              aria-label="Pieces in place"
              aria-valuemin={0}
              aria-valuemax={pieces}
              aria-valuenow={correct}
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 dark:from-purple-400 dark:via-fuchsia-400 dark:to-pink-300"
                initial={false}
                animate={{ width: `${Math.max(4, pct)}%` }}
                transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 20 }}
              />
            </div>
          </div>

          <div className="order-1 grid grid-cols-3 gap-2 lg:order-none lg:grid-cols-1">
            {solved ? (
              <ActionButton onClick={onReplay} label="Again" hint="reshuffle" icon={icons.again} title="Shuffle this photo again" />
            ) : (
              <PeekButton active={peek} disabled={stage !== 'play'} onHold={onPeekHold} onToggle={onPeekToggle} />
            )}
            <ToggleButton
              active={showNumbers}
              onClick={onToggleNumbers}
              label="Numbers"
              hint="N"
              icon={icons.numbers}
              title="Show where each piece belongs (N)"
            />
            <ActionButton onClick={onChangePhoto} label="Photos" hint="change" icon={icons.photos} title="Choose another photo or size" />
          </div>

          <div className="order-3 hidden rounded-2xl border border-rose-100 bg-white/60 px-4 py-3 text-xs text-gray-600 backdrop-blur-md lg:order-none lg:block dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
            <p className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-100">
              <Trophy className="h-3.5 w-3.5 text-amber-500" /> Your best at {game.n}×{game.n}
            </p>
            <p className="mt-1 tabular-nums">
              {best !== null ? `${best} moves` : 'Not solved yet'}
              {bestTime !== null && <span className="text-gray-400 dark:text-gray-500"> · fastest {formatClock(bestTime)}</span>}
            </p>
          </div>

          {canHover && (
            <div className="order-4 hidden rounded-2xl border border-rose-100 bg-white/60 px-4 py-3 text-xs text-gray-600 backdrop-blur-md lg:order-none lg:block dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
              <p className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-100">
                <Keyboard className="h-3.5 w-3.5 text-rose-400 dark:text-purple-300" /> Shortcuts
              </p>
              <ul className="mt-2 space-y-1.5">
                <li className="flex flex-wrap items-center gap-1">
                  <Kbd>←</Kbd>
                  <Kbd>↑</Kbd>
                  <Kbd>→</Kbd>
                  <Kbd>↓</Kbd> or <Kbd>WASD</Kbd> slide
                </li>
                <li className="flex items-center gap-1">
                  <Kbd>P</Kbd> peek · <Kbd>N</Kbd> numbers
                </li>
                <li className="text-gray-400 dark:text-gray-500">Tiles move the way you press.</li>
              </ul>
            </div>
          )}
        </aside>
      </div>
    </motion.div>
  )
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.4rem] items-center justify-center rounded-md border border-gray-200 bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold text-gray-700 shadow-[0_1px_0_rgba(0,0,0,0.08)] dark:border-white/15 dark:bg-white/10 dark:text-gray-200">
      {children}
    </kbd>
  )
}

/** The target picture (lg screens). Clicking it toggles peek. */
function Polaroid({ photo, label, onClick, disabled }: { photo: LocalPhoto; label: string | null; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Peek at the full picture"
      className="group hidden rotate-[-2deg] rounded-[4px] bg-white p-2 pb-9 text-left shadow-[0_16px_36px_-14px_rgba(0,0,0,0.35)] outline-none transition duration-500 hover:rotate-0 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-rose-400 disabled:cursor-default lg:relative lg:block dark:bg-[#f6f1ea]"
    >
      <span className="relative block aspect-square overflow-hidden rounded-[2px]" style={{ backgroundColor: photo.color }}>
        <img
          src={photo.thumb}
          alt=""
          decoding="async"
          draggable={false}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          style={{ objectPosition: '50% 35%' }}
        />
      </span>
      <span className="absolute inset-x-2 bottom-2 truncate text-center font-cursive text-lg text-gray-700">{label}</span>
    </button>
  )
}
