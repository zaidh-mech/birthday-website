'use client'

import Link from 'next/link'
import { useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, RotateCcw, Volume2, VolumeX, CircleHelp } from 'lucide-react'
import { useSoundEnabled, sfx } from '@/lib/sound'

export interface GameStat {
  label: string
  value: ReactNode
  /** Optional emoji or icon shown before the value */
  icon?: ReactNode
}

interface GameShellProps {
  title: string
  tagline?: string
  emoji?: string
  stats?: GameStat[]
  /** Receives the click event (detail === 0 means it was pressed with the keyboard) */
  onRestart?: (e: ReactMouseEvent<HTMLButtonElement>) => void
  restartLabel?: string
  /** "How to play" content, shown in a collapsible panel */
  help?: ReactNode
  /** Extra controls rendered next to restart (difficulty pickers etc.) */
  actions?: ReactNode
  /** Use the full 6xl width instead of 4xl */
  wide?: boolean
  children: ReactNode
}

/**
 * A mouse/touch click leaves focus on the button, so a later physical Space or
 * Enter (meant for the game) would press it again. Keyboard presses (detail 0)
 * keep their focus.
 */
function blurIfPointer(e: ReactMouseEvent<HTMLButtonElement>) {
  if (e.detail > 0) e.currentTarget.blur()
}

/**
 * The shared frame for every game page: back link, title, live stats,
 * restart / sound / help buttons. Children are the board.
 *
 * Layout notes: the site nav is fixed at the top (≈80px), and on phones a
 * floating theme/sound control sits in the bottom-right corner, so the page
 * pads accordingly.
 */
export default function GameShell({
  title,
  tagline,
  emoji,
  stats = [],
  onRestart,
  restartLabel = 'Restart',
  help,
  actions,
  wide = false,
  children,
}: GameShellProps) {
  const [soundOn, setSoundOn] = useSoundEnabled()
  const [showHelp, setShowHelp] = useState(false)

  return (
    <main className={`flex-1 w-full mx-auto px-4 sm:px-6 pt-24 sm:pt-28 md:pt-32 pb-28 md:pb-16 ${wide ? 'max-w-6xl' : 'max-w-4xl'}`}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mb-5">
        <Link
          href="/games"
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-rose-100 bg-white/70 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-rose-500 shadow-sm backdrop-blur-md transition hover:-translate-x-0.5 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-purple-200 dark:hover:bg-white/10"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All games
        </Link>

        <div className="ml-auto flex items-center gap-1.5">
          {help && (
            <button
              type="button"
              onClick={(e) => {
                blurIfPointer(e)
                setShowHelp((v) => !v)
              }}
              aria-expanded={showHelp}
              aria-label="How to play"
              className={`rounded-full p-2.5 shadow-sm backdrop-blur-md transition ${
                showHelp
                  ? 'bg-rose-500 text-white dark:bg-purple-500'
                  : 'bg-white/70 text-gray-500 hover:text-rose-500 dark:bg-white/5 dark:text-gray-300 dark:hover:text-purple-200'
              }`}
            >
              <CircleHelp className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              blurIfPointer(e)
              const next = !soundOn
              setSoundOn(next)
              if (next) sfx.chime()
            }}
            aria-label={soundOn ? 'Mute sounds' : 'Unmute sounds'}
            className="rounded-full bg-white/70 p-2.5 text-gray-500 shadow-sm backdrop-blur-md transition hover:text-rose-500 dark:bg-white/5 dark:text-gray-300 dark:hover:text-purple-200"
          >
            {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          {onRestart && (
            <button
              type="button"
              onClick={(e) => {
                blurIfPointer(e)
                onRestart(e)
              }}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-black active:scale-95 dark:bg-white/15 dark:hover:bg-white/25"
            >
              <RotateCcw className="h-3.5 w-3.5" /> {restartLabel}
            </button>
          )}
        </div>
      </div>

      <header className="mb-5 text-center sm:mb-6">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl dark:text-gray-100">
          {emoji && <span className="mr-2 inline-block align-middle">{emoji}</span>}
          {title}
        </h1>
        {tagline && (
          <p className="mx-auto mt-2 max-w-xl font-serif text-sm italic text-rose-900/75 sm:text-base dark:text-rose-100/75">{tagline}</p>
        )}
      </header>

      <AnimatePresence initial={false}>
        {showHelp && help && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mx-auto mb-5 max-w-xl rounded-2xl border border-rose-100 bg-white/70 p-4 text-sm leading-relaxed text-gray-700 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
              {help}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(stats.length > 0 || actions) && (
        <div className="mb-5 flex flex-wrap items-center justify-center gap-2 sm:mb-6">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex min-w-[5.5rem] flex-col items-center rounded-2xl border border-rose-100 bg-white/70 px-3.5 py-1.5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-400 dark:text-purple-300">{s.label}</span>
              <span className="flex items-center gap-1 font-serif text-lg font-bold tabular-nums text-gray-900 dark:text-gray-100">
                {s.icon}
                {s.value}
              </span>
            </div>
          ))}
          {actions}
        </div>
      )}

      {children}
    </main>
  )
}
