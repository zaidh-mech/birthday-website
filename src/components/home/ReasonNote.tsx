'use client'

import { AnimatePresence, motion } from 'framer-motion'

interface ReasonNoteProps {
  /** null = nothing pulled yet */
  reason: string | null
  number: number
  pullKey: number
  signature: string
  name: string
}

const PAPER_LINES = {
  backgroundImage:
    'repeating-linear-gradient(to bottom, transparent 0, transparent 31px, rgba(244,63,94,0.13) 31px, rgba(244,63,94,0.13) 32px)',
  backgroundPosition: '0 22px',
}

/** The note that unfolds out of the jar. */
export default function ReasonNote({ reason, number, pullKey, signature, name }: ReasonNoteProps) {
  return (
    <div className="relative min-h-[15rem] [perspective:1000px] sm:min-h-[16rem]">
      <AnimatePresence mode="wait" initial={false}>
        {reason ? (
          <motion.figure
            key={pullKey}
            initial={{ opacity: 0, rotateX: -85, scaleY: 0.35, y: 50 }}
            animate={{ opacity: 1, rotateX: 0, scaleY: 1, y: 0 }}
            exit={{ opacity: 0, y: -24, rotate: -3, scale: 0.96, transition: { duration: 0.25 } }}
            transition={{ type: 'spring', stiffness: 120, damping: 15 }}
            style={{ transformOrigin: '50% 0%', ...PAPER_LINES }}
            className="relative rounded-md bg-[#fffdf7] px-6 pb-6 pt-10 text-left shadow-xl shadow-rose-200/30 ring-1 ring-black/5 sm:px-8 dark:shadow-black/40"
          >
            <span aria-hidden className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 -rotate-3 rounded-sm bg-rose-200/80 shadow-sm dark:bg-purple-300/70" />
            <span aria-hidden className="absolute inset-y-0 left-5 w-px bg-rose-300/50 sm:left-6" />
            <motion.span
              aria-hidden
              className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0.35 }}
              transition={{ duration: 1.2, delay: 0.4 }}
            />
            <p className="pl-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-rose-400">Reason #{number}</p>
            <blockquote className="mt-2 pl-2 font-cursive text-2xl leading-snug text-gray-800 sm:text-3xl">{reason}</blockquote>
            <figcaption className="mt-4 text-right font-cursive text-lg text-rose-500">— {signature}</figcaption>
          </motion.figure>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="flex min-h-[15rem] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-rose-200 bg-white/40 px-6 py-8 text-center backdrop-blur-sm sm:min-h-[16rem] dark:border-white/15 dark:bg-white/5"
          >
            <p className="font-cursive text-3xl text-rose-500 dark:text-purple-200">Psst, {name}…</p>
            <p className="mt-2 max-w-xs text-pretty text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              Tap the jar. There&rsquo;s a little folded note waiting for you, and lots more where that came from.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
