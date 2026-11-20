'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { formatClock } from '@/lib/hooks'

export interface HudMessage {
  id: number
  text: string
  tone: 'match' | 'miss' | 'info'
}

interface BoardHudProps {
  width: number
  pairs: number
  found: number
  moves: number
  seconds: number
  message: HudMessage | null
  reduceMotion: boolean
}

/**
 * Compact status strip that sits right above the cards, so progress stays in
 * view even when the page is scrolled down to the board on small screens.
 */
export default function BoardHud({ width, pairs, found, moves, seconds, message, reduceMotion }: BoardHudProps) {
  const heartSize = pairs > 8 ? 12 : 14

  return (
    <div className="mx-auto mb-3 flex h-7 max-w-full items-center justify-between gap-3" style={{ width }}>
      <div className="flex shrink-0 items-center gap-0.5" role="img" aria-label={`${found} of ${pairs} pairs found`}>
        {Array.from({ length: pairs }, (_, i) => {
          const filled = i < found
          return (
            <motion.span
              key={i}
              className="inline-flex"
              initial={false}
              animate={{ scale: filled && !reduceMotion ? [1, 1.45, 1] : 1 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <Heart
                style={{ width: heartSize, height: heartSize }}
                strokeWidth={2}
                className={
                  filled
                    ? 'fill-rose-500 text-rose-500 drop-shadow-[0_0_4px_rgba(244,63,94,0.5)] dark:fill-pink-400 dark:text-pink-400'
                    : 'text-rose-200 dark:text-white/20'
                }
              />
            </motion.span>
          )
        })}
      </div>

      <div className="relative min-w-0 flex-1 text-right text-xs font-semibold">
        <AnimatePresence mode="wait" initial={false}>
          {message ? (
            <motion.span
              key={message.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className={`block truncate ${
                message.tone === 'match'
                  ? 'text-rose-500 dark:text-pink-300'
                  : message.tone === 'miss'
                    ? 'text-gray-500 dark:text-gray-400'
                    : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {message.text}
            </motion.span>
          ) : (
            <motion.span
              key="stats"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="block truncate tabular-nums text-gray-500 dark:text-gray-400"
            >
              {moves} {moves === 1 ? 'move' : 'moves'} · {formatClock(seconds)}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
