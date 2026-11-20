'use client'

import { useEffect, useRef, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { Heart, LoaderCircle, Play } from 'lucide-react'
import cardStyles from './MemoryCard.module.css'

interface StartOverlayProps {
  name: string
  pairs: number
  loading: boolean
  progress: { done: number; total: number }
  onStart: () => void
  reduceMotion: boolean
}

const FAN = [
  { rotate: -14, x: -34, y: 6 },
  { rotate: 0, x: 0, y: -4 },
  { rotate: 14, x: 34, y: 6 },
]

/** A mini card back, using the real card's styles. */
function MiniBack({ style }: { style?: CSSProperties }) {
  return (
    <span className="absolute left-1/2 top-0 block h-[72px] w-[54px] -ml-[27px] rounded-lg shadow-lg" style={{ '--r': '9px', ...style } as CSSProperties}>
      <span className={`${cardStyles.face} ${cardStyles.back}`}>
        <span className={cardStyles.frame} />
        <span className={cardStyles.medallion}>
          <Heart fill="currentColor" strokeWidth={1.25} />
        </span>
      </span>
    </span>
  )
}

/** "Ready?" card shown before the first round; the deck is dealt when she presses play. */
export default function StartOverlay({ name, pairs, loading, progress, onStart, reduceMotion }: StartOverlayProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // Only move focus on keyboard/mouse devices; on phones it could scroll the page.
    if (window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) {
      buttonRef.current?.focus({ preventScroll: true })
    }
  }, [])

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 240, damping: 24 }}
      className="mx-auto w-full max-w-sm rounded-[2rem] border border-rose-100 bg-white/75 p-6 text-center shadow-xl shadow-rose-200/40 backdrop-blur-md sm:p-7 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/40"
    >
      <div className="relative mx-auto mb-5 h-[84px] w-40" aria-hidden>
        {FAN.map((f, i) => (
          <motion.span
            key={i}
            className="absolute inset-0"
            initial={reduceMotion ? false : { rotate: 0, x: 0, y: 0 }}
            animate={{ rotate: f.rotate, x: f.x, y: f.y }}
            transition={{ type: 'spring', stiffness: 160, damping: 14, delay: reduceMotion ? 0 : 0.25 + i * 0.06 }}
            style={{ transformOrigin: '50% 100%' }}
          >
            <MiniBack />
          </motion.span>
        ))}
      </div>

      <h2 className="font-serif text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-100">Ready, {name}?</h2>
      <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
        {pairs} pairs of our photos are about to be dealt face down. Flip two at a time and find every one of us.
      </p>

      <button
        ref={buttonRef}
        type="button"
        onClick={onStart}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-rose-500/30 transition hover:bg-rose-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300 active:scale-95 dark:bg-purple-500 dark:shadow-purple-500/30 dark:hover:bg-purple-400 dark:focus-visible:ring-purple-400/60"
      >
        {loading ? (
          <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
        ) : (
          <Play className="h-4 w-4 fill-current" aria-hidden />
        )}
        Deal the cards
      </button>
      <div
        className={`mt-3 h-4 text-[11px] font-medium text-gray-400 transition-opacity dark:text-gray-500 ${loading ? 'opacity-100' : 'opacity-0'}`}
        aria-live="polite"
      >
        {loading ? `Shuffling our photos… ${pct}%` : ''}
      </div>
    </motion.div>
  )
}
