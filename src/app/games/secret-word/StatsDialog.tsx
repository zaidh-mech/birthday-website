'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ChartColumn, Clock, Flame, Trophy } from 'lucide-react'
import { getBest } from '@/lib/gameStorage'
import { GAME_ID, MAX_GUESSES, liveDailyStreak, type Stats } from './logic'
import { Countdown, Dialog } from './ui'
import { cx } from './tileStyles'

interface StatsDialogProps {
  open: boolean
  onClose: () => void
  stats: Stats
  today: string
  /** Show "next word in…" (today's word is finished) */
  dailyDone: boolean
  onDayChange: () => void
}

export default function StatsDialog({ open, onClose, stats, today, dailyDone, onDayChange }: StatsDialogProps) {
  const reduce = useReducedMotion()
  const winPct = stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0
  const daily = today ? liveDailyStreak(stats, today) : 0
  const maxCount = Math.max(1, ...stats.distribution)
  const best = open ? getBest(GAME_ID) : null

  const tiles = [
    { label: 'Played', value: stats.played },
    { label: 'Win %', value: winPct },
    { label: 'Streak', value: stats.currentStreak },
    { label: 'Best streak', value: stats.maxStreak },
  ]

  return (
    <Dialog open={open} onClose={onClose} labelledBy="secret-word-stats-title">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-rose-300 to-pink-500 text-white shadow-lg shadow-rose-300/40 dark:from-purple-400 dark:to-fuchsia-500 dark:shadow-purple-500/30">
          <ChartColumn className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 id="secret-word-stats-title" className="font-serif text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-100">
          Your word stats
        </h2>
        <p className="mt-1 font-cursive text-lg text-rose-500 dark:text-purple-300">every word is a little love note</p>
      </div>

      <dl className="mt-5 grid grid-cols-4 gap-1.5 sm:gap-2">
        {tiles.map((t) => (
          <div key={t.label} className="flex flex-col-reverse items-center rounded-2xl bg-rose-50 px-1 py-2.5 dark:bg-white/5">
            <dt className="mt-0.5 text-center text-[9px] font-semibold uppercase leading-tight tracking-[0.12em] text-rose-400 sm:text-[10px] dark:text-purple-300">{t.label}</dt>
            <dd className="font-serif text-2xl font-bold tabular-nums text-gray-900 sm:text-3xl dark:text-gray-100">{t.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200">
          <Flame className="h-3.5 w-3.5" aria-hidden="true" />
          {daily > 0 ? `${daily}-day daily streak` : 'Solve today’s word to start a streak'}
        </span>
        {best !== null && (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-rose-600 dark:bg-white/5 dark:text-purple-200">
            <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
            Best: {best} {best === 1 ? 'try' : 'tries'}
          </span>
        )}
      </div>

      <h3 className="mt-6 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Guess distribution</h3>
      {stats.wins === 0 ? (
        <p className="mt-3 text-center text-sm italic text-gray-500 dark:text-gray-400">No wins yet. Your first one is going to feel amazing.</p>
      ) : (
        <ol className="mt-3 space-y-1.5" aria-label="Wins by number of tries">
          {Array.from({ length: MAX_GUESSES }, (_, i) => {
            const count = stats.distribution[i] ?? 0
            const pct = Math.max(9, Math.round((count / maxCount) * 100))
            const highlight = stats.lastWinTries === i + 1
            return (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="w-3 shrink-0 text-right font-semibold tabular-nums text-gray-500 dark:text-gray-400">{i + 1}</span>
                <div className="h-6 flex-1">
                  <motion.div
                    initial={reduce ? false : { width: '9%' }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, delay: 0.15 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    className={cx(
                      'flex h-full min-w-[1.75rem] items-center justify-end rounded-md px-2 text-xs font-bold tabular-nums',
                      highlight
                        ? 'bg-gradient-to-r from-rose-400 to-pink-600 text-white shadow-sm shadow-rose-400/40 dark:from-purple-500 dark:to-fuchsia-500'
                        : 'bg-stone-200 text-stone-600 dark:bg-white/10 dark:text-gray-300',
                    )}
                    style={{ width: `${pct}%` }}
                  >
                    {count}
                  </motion.div>
                </div>
              </li>
            )
          })}
        </ol>
      )}

      {dailyDone && (
        <p className="mt-5 flex items-center justify-center gap-1.5 rounded-2xl bg-white/70 px-3 py-2 text-sm text-gray-600 dark:bg-white/5 dark:text-gray-300">
          <Clock className="h-4 w-4 text-rose-400 dark:text-purple-300" aria-hidden="true" />
          Next word in <Countdown onExpire={onDayChange} className="font-semibold text-gray-900 dark:text-gray-100" />
        </p>
      )}

      <button
        type="button"
        data-autofocus
        onClick={onClose}
        className="mt-5 w-full rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-rose-500/25 transition hover:bg-rose-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 dark:bg-purple-500 dark:hover:bg-purple-400 dark:focus-visible:ring-purple-300 dark:focus-visible:ring-offset-[#14151d]"
      >
        Keep playing
      </button>
    </Dialog>
  )
}
