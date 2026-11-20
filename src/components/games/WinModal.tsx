'use client'

import { useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, RotateCcw, X } from 'lucide-react'
import { celebrate } from '@/lib/celebrate'
import { sfx } from '@/lib/sound'

interface WinModalProps {
  open: boolean
  title?: string
  message?: ReactNode
  /** Small stat chips, e.g. [{label:'Moves', value: 18}] */
  stats?: { label: string; value: ReactNode }[]
  isNewBest?: boolean
  /** Optional photo (already base-path prefixed) shown as a reward */
  photo?: { src: string; alt?: string; caption?: string }
  onPlayAgain?: () => void
  onClose?: () => void
  playAgainLabel?: string
  /** Extra content under the stats (share buttons, unlocked messages…) */
  children?: ReactNode
  /** Skip the confetti/sound (e.g. for "game over" rather than a win) */
  quiet?: boolean
}

/** Celebration dialog shown when a game is won. Fires confetti + a fanfare when it opens. */
export default function WinModal({
  open,
  title = 'You did it!',
  message,
  stats = [],
  isNewBest = false,
  photo,
  onPlayAgain,
  onClose,
  playAgainLabel = 'Play again',
  children,
  quiet = false,
}: WinModalProps) {
  useEffect(() => {
    if (!open || quiet) return
    sfx.win()
    celebrate()
  }, [open, quiet])

  useEffect(() => {
    if (!open || !onClose) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            initial={{ scale: 0.85, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/60 bg-[#fffaf6] p-6 text-center shadow-2xl sm:p-8 dark:border-white/10 dark:bg-[#14151d]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400" />
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-3 top-3 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {photo ? (
              <motion.div
                initial={{ rotate: -8, scale: 0.8 }}
                animate={{ rotate: -3, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
                className="mx-auto mb-5 w-40 rounded-sm bg-white p-2 pb-3 shadow-xl sm:w-48"
              >
                <img src={photo.src} alt={photo.alt ?? ''} className="aspect-[3/4] w-full rounded-[2px] object-cover" />
                {photo.caption && <p className="mt-1.5 font-cursive text-base leading-tight text-gray-700">{photo.caption}</p>}
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 12, delay: 0.1 }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-rose-400 text-white shadow-lg shadow-rose-300/40"
              >
                <Trophy className="h-8 w-8" />
              </motion.div>
            )}

            {isNewBest && (
              <div className="mx-auto mb-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
                ✨ New personal best
              </div>
            )}
            <h2 className="font-serif text-3xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
            {message && <div className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{message}</div>}

            {stats.length > 0 && (
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {stats.map((s) => (
                  <div key={s.label} className="min-w-[5rem] rounded-2xl bg-rose-50 px-3 py-2 dark:bg-white/5">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-400 dark:text-purple-300">{s.label}</div>
                    <div className="font-serif text-xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{s.value}</div>
                  </div>
                ))}
              </div>
            )}

            {children && <div className="mt-5">{children}</div>}

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              {onPlayAgain && (
                <button
                  type="button"
                  onClick={onPlayAgain}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-rose-500/25 transition hover:bg-rose-600 active:scale-95 dark:bg-purple-500 dark:hover:bg-purple-400"
                >
                  <RotateCcw className="h-4 w-4" /> {playAgainLabel}
                </button>
              )}
              <Link
                href="/games"
                className="inline-flex items-center justify-center rounded-full bg-gray-100 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
              >
                More games
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
