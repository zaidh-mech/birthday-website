'use client'

import { ChartColumn, Clock, HeartHandshake, Shuffle } from 'lucide-react'
import type { LocalPhoto } from '@/lib/photos'
import { formatPhotoDate } from '@/lib/photos'
import { getWordMessage, loseLine } from './messages'
import { Countdown, Dialog, MiniWord } from './ui'

interface LoseDialogProps {
  open: boolean
  onClose: () => void
  word: string
  name: string
  daily: boolean
  seed: number
  photo: LocalPhoto | null
  onPractice: () => void
  onStats: () => void
  onDayChange: () => void
}

/** Shown when all six guesses are used: reveals the word kindly and offers another go. */
export default function LoseDialog({ open, onClose, word, name, daily, seed, photo, onPractice, onStats, onDayChange }: LoseDialogProps) {
  const caption = photo ? formatPhotoDate(photo.date) ?? 'us ♡' : null
  return (
    <Dialog open={open} onClose={onClose} labelledBy="secret-word-lose-title">
      <div className="text-center">
        {photo ? (
          <div className="mx-auto mb-4 w-28 -rotate-3 rounded-sm bg-white p-1.5 pb-2 shadow-xl sm:w-32">
            <img
              src={photo.thumb}
              alt="A photo of us"
              loading="lazy"
              decoding="async"
              className="aspect-[3/4] w-full rounded-[2px] object-cover"
              style={{ objectPosition: 'center 30%', backgroundColor: photo.color }}
            />
            {caption && <p className="mt-1 truncate font-cursive text-sm leading-tight text-gray-700">{caption}</p>}
          </div>
        ) : (
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-300 to-pink-500 text-white shadow-lg shadow-rose-300/40 dark:from-purple-400 dark:to-fuchsia-500 dark:shadow-purple-500/30">
            <HeartHandshake className="h-7 w-7" aria-hidden="true" />
          </div>
        )}

        <h2 id="secret-word-lose-title" className="font-serif text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-100">
          So close, {name}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">The secret word was</p>
        <MiniWord word={word} states="correct" size={40} animate delayMs={250} className="mt-3" />
        <p className="mt-3 font-cursive text-xl leading-snug text-rose-500 sm:text-2xl dark:text-purple-300">“{getWordMessage(word)}”</p>
        <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{loseLine(seed)}</p>

        {daily && (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            A new word arrives in <Countdown onExpire={onDayChange} className="font-semibold text-gray-800 dark:text-gray-200" />
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            data-autofocus
            onClick={onPractice}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-500 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-rose-500/25 transition hover:bg-rose-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 dark:bg-purple-500 dark:hover:bg-purple-400 dark:focus-visible:ring-purple-300 dark:focus-visible:ring-offset-[#14151d]"
          >
            <Shuffle className="h-4 w-4" aria-hidden="true" />
            {daily ? 'Try a practice word' : 'Try another word'}
          </button>
          <button
            type="button"
            onClick={onStats}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gray-100 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15 dark:focus-visible:ring-purple-300"
          >
            <ChartColumn className="h-4 w-4" aria-hidden="true" />
            Stats
          </button>
        </div>
      </div>
    </Dialog>
  )
}
