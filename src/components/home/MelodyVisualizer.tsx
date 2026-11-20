'use client'

import { HAPPY_BIRTHDAY_NOTE_COUNT } from '@/lib/sound'

/** Pitches of the music-box melody in src/lib/sound.ts (MIDI), used for bar heights. */
const PITCHES = [67, 67, 69, 67, 72, 71, 67, 67, 69, 67, 74, 72, 67, 67, 79, 76, 72, 71, 69, 77, 77, 76, 72, 74, 72]
const MIN = 64
const MAX = 80

/** A row of bars, one per note; the note that is playing lights up and hops. */
export default function MelodyVisualizer({ active }: { active: number }) {
  const notes = PITCHES.length === HAPPY_BIRTHDAY_NOTE_COUNT ? PITCHES : Array.from({ length: HAPPY_BIRTHDAY_NOTE_COUNT }, () => 72)
  return (
    <div aria-hidden className="flex h-14 items-end justify-center gap-[3px] sm:h-16 sm:gap-1">
      {notes.map((pitch, i) => {
        const height = 24 + ((pitch - MIN) / (MAX - MIN)) * 76
        const state = i === active ? 'now' : i < active ? 'past' : 'next'
        return (
          <span
            key={i}
            className={`w-1.5 rounded-full transition-[background-color,translate,box-shadow] duration-300 sm:w-2 ${
              state === 'now'
                ? '-translate-y-1.5 bg-rose-500 shadow-[0_0_14px_rgba(244,63,94,0.7)] dark:bg-purple-300 dark:shadow-[0_0_14px_rgba(216,180,254,0.8)]'
                : state === 'past'
                  ? 'bg-rose-300 dark:bg-purple-400/70'
                  : 'bg-rose-200/60 dark:bg-white/15'
            }`}
            style={{ height: `${height}%` }}
          />
        )
      })}
    </div>
  )
}
