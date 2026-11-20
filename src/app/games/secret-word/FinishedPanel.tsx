'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ChartColumn, Clock, Heart, Shuffle } from 'lucide-react'
import { formatPhotoDate, type LocalPhoto } from '@/lib/photos'
import type { GameData } from './logic'
import { getWordMessage } from './messages'
import { Countdown, MiniWord } from './ui'

interface FinishedPanelProps {
  game: GameData
  daily: boolean
  /** Short screens: keep it to the keyboard's height */
  compact: boolean
  minHeight: number | null
  /** A reason-I-love-you for the day, shown after the daily word */
  reason: string | null
  /** A little polaroid of us beside the result (wider screens) */
  photo: LocalPhoto | null
  onPractice: () => void
  onNewWord: () => void
  onStats: () => void
  onDayChange: () => void
}

/** Takes the keyboard's place once a word is finished. */
export default function FinishedPanel({ game, daily, compact, minHeight, reason, photo, onPractice, onNewWord, onStats, onDayChange }: FinishedPanelProps) {
  const reduce = useReducedMotion()
  const won = game.status === 'won'
  const tries = game.guesses.length
  const caption = photo ? formatPhotoDate(photo.date) : null

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className="mx-auto flex w-full max-w-[520px] items-center justify-center gap-4 rounded-3xl border border-rose-100 bg-white/60 px-4 py-3 shadow-sm backdrop-blur-md sm:px-5 sm:py-4 dark:border-white/10 dark:bg-white/5"
      style={minHeight ? { minHeight } : undefined}
    >
      {photo && !compact && (
        <figure className="group hidden shrink-0 sm:block">
          <div className="w-[72px] -rotate-6 rounded-[3px] bg-white p-1 pb-2.5 shadow-lg shadow-rose-900/10 transition-transform duration-500 ease-out group-hover:rotate-0 group-hover:scale-110 motion-reduce:transition-none dark:shadow-black/40">
            <img
              src={photo.thumb}
              alt="A photo of us"
              loading="lazy"
              decoding="async"
              className="aspect-[3/4] w-full rounded-[2px] object-cover"
              style={{ objectPosition: 'center 30%', backgroundColor: photo.color }}
            />
          </div>
          {caption && <figcaption className="mt-1.5 max-w-[80px] truncate text-center font-cursive text-xs text-rose-900/70 dark:text-rose-100/70">{caption}</figcaption>}
        </figure>
      )}

      <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-2 text-center sm:gap-2.5">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
          <p className="font-cursive text-xl leading-none text-rose-500 sm:text-2xl dark:text-purple-300">
            {won ? (daily ? `Solved in ${tries}!` : `Got it in ${tries}!`) : 'The word was'}
          </p>
          <MiniWord word={game.word} states={won ? 'correct' : 'present'} size={compact ? 26 : 30} />
        </div>

        {daily ? (
          <p className="flex flex-wrap items-center justify-center gap-x-1.5 text-xs text-gray-600 sm:text-sm dark:text-gray-300">
            <Clock className="h-3.5 w-3.5 text-rose-400 dark:text-purple-300" aria-hidden="true" />
            Come back tomorrow for a new word:
            <Countdown onExpire={onDayChange} className="font-semibold text-gray-900 dark:text-gray-100" />
          </p>
        ) : (
          <p className="line-clamp-2 max-w-sm font-serif text-xs italic text-gray-600 sm:text-sm dark:text-gray-300">“{getWordMessage(game.word)}”</p>
        )}

        {daily && reason && !compact && (
          <p className="line-clamp-2 max-w-md font-serif text-xs italic leading-snug text-rose-900/75 sm:text-sm dark:text-rose-100/75">
            <Heart className="mr-1 inline h-3 w-3 -translate-y-px fill-rose-400 text-rose-400 dark:fill-purple-300 dark:text-purple-300" aria-hidden="true" />
            Today’s reason I love you: {reason}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              if (e.detail > 0) e.currentTarget.blur()
              if (daily) onPractice()
              else onNewWord()
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-rose-400/30 transition hover:brightness-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 sm:text-sm dark:from-purple-500 dark:to-fuchsia-500 dark:shadow-purple-500/30 dark:focus-visible:ring-purple-300 dark:focus-visible:ring-offset-[#0B0C10]"
          >
            <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
            {daily ? 'Play practice words' : 'New word'}
          </button>
          <button
            type="button"
            onClick={(e) => {
              if (e.detail > 0) e.currentTarget.blur()
              onStats()
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-100 bg-white/80 px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 sm:text-sm dark:border-white/10 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15 dark:focus-visible:ring-purple-300"
          >
            <ChartColumn className="h-3.5 w-3.5" aria-hidden="true" />
            Stats
          </button>
        </div>
      </div>
    </motion.div>
  )
}
