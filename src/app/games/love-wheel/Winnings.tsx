'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { formatDistanceToNowStrict } from 'date-fns'
import { Gift, MessageCircleHeart, Sparkles } from 'lucide-react'
import type { WheelPrize } from '@/lib/siteConfig'
import { whatsappLink } from '@/lib/siteConfig'
import { claimMessage, type WinEntry } from './history'

const card =
  'rounded-3xl border border-rose-100 bg-white/60 p-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5'

function when(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  if (Date.now() - d.getTime() < 60_000) return 'just now'
  return formatDistanceToNowStrict(d, { addSuffix: true })
}

export function Winnings({
  history,
  whatsappNumber,
  onClear,
  reducedMotion,
}: {
  history: WinEntry[]
  whatsappNumber: string
  onClear: () => void
  reducedMotion: boolean
}) {
  return (
    <section aria-labelledby="wheel-winnings-title" className={card}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="wheel-winnings-title" className="flex items-center gap-2 font-serif text-xl font-bold text-gray-900 dark:text-gray-100">
          <Gift className="h-5 w-5 text-rose-500 dark:text-purple-300" /> Your winnings
        </h2>
        {history.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-full px-2.5 py-1 text-xs font-semibold text-gray-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-white/10 dark:hover:text-purple-200"
          >
            Clear
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-rose-200 px-4 py-5 text-center text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
          <Sparkles className="mx-auto mb-1.5 h-5 w-5 text-rose-300 dark:text-purple-300" />
          Nothing yet. Give it a spin, my love.
        </p>
      ) : (
        <ol className="space-y-2">
          <AnimatePresence initial={false}>
            {history.map((entry, i) => (
              <motion.li
                key={entry.id}
                layout={!reducedMotion}
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -16, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${
                  i === 0 ? 'bg-gradient-to-r from-rose-50 to-pink-50 ring-1 ring-rose-200 dark:from-purple-500/15 dark:to-pink-500/10 dark:ring-purple-400/30' : 'bg-white/60 dark:bg-white/[0.03]'
                }`}
              >
                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm dark:bg-white/10">
                  {entry.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{entry.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    <time dateTime={entry.at}>{when(entry.at)}</time>
                  </p>
                </div>
                <a
                  href={whatsappLink(whatsappNumber, claimMessage(entry))}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Claim ${entry.label} on WhatsApp`}
                  className="shrink-0 rounded-full p-2 text-rose-500 transition hover:bg-rose-100 dark:text-purple-200 dark:hover:bg-white/10"
                >
                  <MessageCircleHeart className="h-5 w-5" />
                </a>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )}
      <p className="mt-3 text-center text-[11px] text-gray-400 dark:text-gray-500">Your last 5 wins live here. They never expire.</p>
    </section>
  )
}

export function PrizeList({ prizes }: { prizes: WheelPrize[] }) {
  return (
    <section aria-labelledby="wheel-prizes-title" className={card}>
      <h2 id="wheel-prizes-title" className="mb-3 font-serif text-xl font-bold text-gray-900 dark:text-gray-100">
        On the wheel
      </h2>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
        {prizes.map((p) => (
          <li key={p.id} className="flex items-start gap-2.5 rounded-2xl bg-white/50 px-3 py-2 dark:bg-white/[0.03]">
            <span aria-hidden="true" className="mt-0.5 text-lg leading-none">
              {p.emoji}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-gray-800 dark:text-gray-100">{p.label}</span>
              {p.detail && <span className="block text-xs leading-snug text-gray-500 dark:text-gray-400">{p.detail}</span>}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-center text-[11px] text-gray-400 dark:text-gray-500">Every prize has exactly the same chance.</p>
    </section>
  )
}
