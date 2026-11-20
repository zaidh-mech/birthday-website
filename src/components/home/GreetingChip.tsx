'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useInterval, useMounted, usePrefersReducedMotion } from '@/lib/hooks'

function partOfDay(hour: number): { lead: string; punct: string; emoji: string } {
  if (hour >= 5 && hour < 12) return { lead: 'Good morning', punct: '', emoji: '☀️' }
  if (hour >= 12 && hour < 17) return { lead: 'Good afternoon', punct: '', emoji: '🌸' }
  if (hour >= 17 && hour < 22) return { lead: 'Good evening', punct: '', emoji: '✨' }
  return { lead: 'Still awake', punct: '?', emoji: '🌙' }
}

interface GreetingChipProps {
  herName: string
  nicknames: string[]
}

/**
 * "Good evening, cutie ✨" — the time of day is only known on the client,
 * so the chip shows a neutral line until it has mounted.
 */
export default function GreetingChip({ herName, nicknames }: GreetingChipProps) {
  const mounted = useMounted()
  const reduce = usePrefersReducedMotion()
  const names = useMemo(() => {
    const unique = Array.from(new Set([herName.trim(), ...nicknames.map((n) => n.trim())].filter(Boolean)))
    return unique.length > 0 ? unique : ['my love']
  }, [herName, nicknames])

  const [nameIndex, setNameIndex] = useState(0)
  const [hour, setHour] = useState(12)

  useEffect(() => {
    setHour(new Date().getHours())
    setNameIndex(herName.trim() ? 0 : Math.floor(Math.random() * names.length))
  }, [names, herName])

  // Rotate through her names, and keep the greeting right if the page stays open for hours.
  useInterval(
    () => {
      setNameIndex((i) => (i + 1) % names.length)
      setHour(new Date().getHours())
    },
    mounted && !reduce && names.length > 1 ? 3600 : null,
  )

  const { lead, punct, emoji } = partOfDay(hour)
  const name = names[nameIndex % names.length]

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }}
      className="inline-flex max-w-full items-center justify-center gap-1.5 rounded-full border border-rose-100 bg-white/70 px-3 py-1.5 shadow-sm backdrop-blur-md sm:gap-2 sm:px-4 dark:border-white/20 dark:bg-white/10"
    >
      <motion.span layout="position" className="hidden shrink-0 min-[360px]:inline-flex">
        <Sparkles className="h-3.5 w-3.5 text-rose-400 dark:text-purple-300" aria-hidden />
      </motion.span>
      {mounted ? (
        <motion.span
          layout="position"
          className="flex flex-wrap items-baseline justify-center gap-x-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-500 sm:text-[11px] sm:tracking-[0.2em] dark:text-purple-200"
          aria-live="off"
        >
          <span>{lead},</span>
          <span className="inline-flex items-baseline">
            <span className="relative inline-flex overflow-hidden py-[0.15em]">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={name}
                  initial={{ y: '0.9em', opacity: 0 }}
                  animate={{ y: '0em', opacity: 1 }}
                  exit={{ y: '-0.9em', opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="inline-block font-cursive text-[15px] font-bold normal-case leading-none tracking-normal text-rose-600 sm:text-lg dark:text-purple-100"
                >
                  {name}
                </motion.span>
              </AnimatePresence>
            </span>
            {punct && <span className="tracking-normal">{punct}</span>}
          </span>
          <span aria-hidden className="tracking-normal">
            {emoji}
          </span>
        </motion.span>
      ) : (
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-500 sm:text-[11px] dark:text-purple-200">
          A little world, made for you
        </span>
      )}
    </motion.div>
  )
}
