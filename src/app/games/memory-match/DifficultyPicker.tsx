'use client'

import { motion } from 'framer-motion'
import { DIFFICULTIES, type Difficulty } from './logic'

interface DifficultyPickerProps {
  value: Difficulty
  onChange: (value: Difficulty) => void
  reduceMotion: boolean
}

/** Segmented control: Easy / Medium / Hard with a sliding pill. */
export default function DifficultyPicker({ value, onChange, reduceMotion }: DifficultyPickerProps) {
  return (
    <div
      role="group"
      aria-label="Difficulty"
      className="inline-flex items-center rounded-full border border-rose-100 bg-white/70 p-1 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5"
    >
      {DIFFICULTIES.map((d) => {
        const active = d.id === value
        return (
          <button
            key={d.id}
            type="button"
            aria-pressed={active}
            aria-label={`${d.label}, ${d.pairs} pairs`}
            onClick={() => {
              if (!active) onChange(d.id)
            }}
            className={`relative rounded-full px-3.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 sm:px-4 dark:focus-visible:ring-purple-400 ${
              active ? 'text-white' : 'text-gray-600 hover:text-rose-500 dark:text-gray-300 dark:hover:text-purple-200'
            }`}
          >
            {active && (
              <motion.span
                layoutId="memory-difficulty-pill"
                className="absolute inset-0 rounded-full bg-rose-500 shadow-md shadow-rose-500/30 dark:bg-purple-500 dark:shadow-purple-500/30"
                transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative">
              {d.label}
              <span className={`ml-1 tabular-nums ${active ? 'text-white/75' : 'text-gray-400 dark:text-gray-500'}`}>{d.pairs}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
