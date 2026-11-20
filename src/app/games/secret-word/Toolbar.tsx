'use client'

import type { MouseEvent, Ref } from 'react'
import { motion } from 'framer-motion'
import { CalendarHeart, ChartColumn, Lightbulb, Shuffle } from 'lucide-react'
import type { Mode } from './logic'
import { cx } from './tileStyles'

interface ToolbarProps {
  mode: Mode
  onMode: (mode: Mode) => void
  /** Mode can't change while a row is flipping */
  locked: boolean
  hint: 'available' | 'used' | 'off'
  onHint: () => void
  onStats: () => void
  streak: number
  anchorRef: Ref<HTMLDivElement>
}

const MODES: { id: Mode; short: string; long: string; Icon: typeof CalendarHeart }[] = [
  { id: 'daily', short: 'Today', long: 'Today’s word', Icon: CalendarHeart },
  { id: 'practice', short: 'Practice', long: 'Practice', Icon: Shuffle },
]

/** Pointer clicks shouldn't leave focus on a toolbar button (a physical Enter would re-click it). */
function blurIfPointer(e: MouseEvent<HTMLButtonElement>) {
  if (e.detail > 0) e.currentTarget.blur()
}

const roundButton =
  'relative inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-full border border-rose-100 bg-white/70 px-2.5 text-sm font-semibold text-gray-600 shadow-sm backdrop-blur-md transition hover:text-rose-500 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-gray-600 sm:px-3.5 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:text-purple-200 dark:focus-visible:ring-purple-300 dark:disabled:hover:text-gray-300'

export default function Toolbar({ mode, onMode, locked, hint, onHint, onStats, streak, anchorRef }: ToolbarProps) {
  return (
    <div ref={anchorRef} className="flex items-center justify-center gap-1.5 sm:gap-2">
      <div
        role="group"
        aria-label="Game mode"
        className="flex rounded-full border border-rose-100 bg-white/70 p-1 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5"
      >
        {MODES.map(({ id, short, long, Icon }) => {
          const active = mode === id
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              disabled={locked && !active}
              onClick={(e) => {
                blurIfPointer(e)
                onMode(id)
              }}
              className={cx(
                'relative isolate inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:cursor-not-allowed sm:px-4 sm:text-sm dark:focus-visible:ring-purple-300',
                active ? 'text-white' : 'text-gray-600 hover:text-rose-500 dark:text-gray-300 dark:hover:text-purple-200',
              )}
            >
              {active && (
                <motion.span
                  layoutId="secret-word-mode-pill"
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 shadow-md shadow-rose-400/30 dark:from-purple-500 dark:to-fuchsia-500 dark:shadow-purple-500/30"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <Icon className="hidden h-3.5 w-3.5 min-[380px]:block" aria-hidden="true" />
              <span className="sm:hidden">{short}</span>
              <span className="hidden sm:inline">{long}</span>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={(e) => {
          blurIfPointer(e)
          onHint()
        }}
        disabled={hint !== 'available'}
        aria-label={hint === 'used' ? 'Hint already used for this word' : 'Use a hint: reveal one letter'}
        title={hint === 'used' ? 'One hint per word' : 'Reveal one letter'}
        className={cx(roundButton, hint === 'available' && 'text-amber-600 hover:text-amber-500 dark:text-amber-300 dark:hover:text-amber-200')}
      >
        <Lightbulb className={cx('h-4 w-4', hint === 'used' && 'fill-amber-300/60')} aria-hidden="true" />
        <span className="hidden sm:inline">{hint === 'used' ? 'Hint used' : 'Hint'}</span>
      </button>

      <button
        type="button"
        onClick={(e) => {
          blurIfPointer(e)
          onStats()
        }}
        aria-label={streak > 0 ? `Statistics (win streak ${streak})` : 'Statistics'}
        className={roundButton}
      >
        <ChartColumn className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Stats</span>
        {streak > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-400 px-1 text-[10px] font-bold text-amber-950 shadow ring-2 ring-[#fdfbf7] dark:ring-[#0B0C10]"
          >
            {streak}
          </span>
        )}
      </button>
    </div>
  )
}
