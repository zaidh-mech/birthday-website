'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Cake, PartyPopper } from 'lucide-react'
import { daysUntilNext } from '@/lib/siteConfig'
import { useInterval } from '@/lib/hooks'
import { celebrate, heartRain } from '@/lib/celebrate'
import { sfx } from '@/lib/sound'
import RollingNumber from './RollingNumber'
import { BUTTON_PRIMARY, EYEBROW, GLASS_CARD } from './types'

/** Local midnight of the next month/day occurrence (today counts). */
function nextOccurrence(dateStr: string, now: Date): Date {
  const [, m, d] = dateStr.split('-').map(Number)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let next = new Date(now.getFullYear(), m - 1, d)
  if (next < today) next = new Date(now.getFullYear() + 1, m - 1, d)
  return next
}

const RING_R = 52
const RING_C = 2 * Math.PI * RING_R

/** Countdown to her next birthday. Render only after mount (it reads the clock). */
export default function BirthdayCountdown({ date, name }: { date: string; name: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })
  const [now, setNow] = useState(() => new Date())
  useInterval(() => setNow(new Date()), 1000)

  const days = daysUntilNext(date, now)
  const isToday = days === 0

  // A little heart rain the first time she sees it on her birthday.
  useEffect(() => {
    if (isToday && inView) heartRain()
  }, [isToday, inView])

  if (isToday) {
    return (
      <div ref={ref} className={`${GLASS_CARD} relative overflow-hidden p-6 text-center sm:p-10`}>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rose-200/40 via-amber-100/30 to-purple-200/30 dark:from-purple-500/15 dark:via-rose-500/10 dark:to-amber-400/10" />
        <motion.div
          initial={{ scale: 0.6, rotate: -12 }}
          animate={inView ? { scale: [0.6, 1.15, 1], rotate: [-12, 6, 0] } : {}}
          transition={{ duration: 0.9 }}
          className="relative mx-auto mb-3 text-6xl sm:text-7xl"
          aria-hidden
        >
          🎂
        </motion.div>
        <h3 className="relative text-balance font-serif text-2xl font-bold text-gray-900 sm:text-4xl dark:text-gray-100">
          Happy Birthday, today is your day! 🎂
        </h3>
        <p className="relative mx-auto mt-3 max-w-md font-serif text-sm italic text-rose-900/75 sm:text-base dark:text-rose-100/75">
          The whole world got a little brighter the day you arrived, {name}.
        </p>
        <button
          type="button"
          onClick={() => {
            celebrate()
            sfx.win()
          }}
          className={`${BUTTON_PRIMARY} relative mt-6`}
        >
          <PartyPopper className="h-4 w-4" aria-hidden /> Celebrate again
        </button>
      </div>
    )
  }

  const next = nextOccurrence(date, now)
  const ms = Math.max(0, next.getTime() - now.getTime())
  const dLeft = Math.floor(ms / 86400000)
  const hLeft = Math.floor(ms / 3600000) % 24
  const mLeft = Math.floor(ms / 60000) % 60
  const sLeft = Math.floor(ms / 1000) % 60
  const progress = Math.min(1, Math.max(0.02, 1 - days / 365))
  const nextLabel = next.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  const parts = [
    { value: dLeft, label: 'days' },
    { value: hLeft, label: 'hrs' },
    { value: mLeft, label: 'min' },
    { value: sLeft, label: 'sec' },
  ]

  return (
    <div ref={ref} className={`${GLASS_CARD} relative overflow-hidden p-5 text-center sm:p-8`}>
      <div aria-hidden className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-amber-200/40 blur-3xl dark:bg-rose-500/15" />
      <p className={`${EYEBROW} flex items-center justify-center gap-2`}>
        <Cake className="h-4 w-4" aria-hidden /> Your birthday
      </p>

      <div className="relative mx-auto mt-5 h-36 w-36 sm:h-40 sm:w-40">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
          <circle cx="60" cy="60" r={RING_R} fill="none" strokeWidth="8" className="stroke-rose-100 dark:stroke-white/10" />
          <circle
            cx="60"
            cy="60"
            r={RING_R}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={RING_C}
            strokeDashoffset={inView ? RING_C * (1 - progress) : RING_C}
            className="stroke-rose-400 transition-[stroke-dashoffset] duration-[1600ms] ease-out motion-reduce:transition-none dark:stroke-purple-400"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <RollingNumber value={days} active={inView} className="font-serif text-4xl font-bold text-gray-900 sm:text-5xl dark:text-gray-100" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-400 dark:text-purple-300">
            {days === 1 ? 'sleep to go' : 'sleeps to go'}
          </span>
        </div>
      </div>

      <p className="mt-4 font-serif text-sm italic text-rose-900/75 sm:text-base dark:text-rose-100/75">
        until {nextLabel} 🎂
      </p>

      <div className="mt-5 flex items-start justify-center gap-1.5 sm:gap-3" role="timer" aria-label="Time left until your birthday">
        {parts.map((p) => (
          <div key={p.label} className="flex min-w-[3.1rem] flex-col items-center rounded-2xl bg-white/70 px-1.5 py-2 shadow-sm ring-1 ring-rose-100/70 sm:min-w-[4.5rem] sm:px-2 dark:bg-white/5 dark:ring-white/10">
            <RollingNumber
              value={p.value}
              minDigits={2}
              active={inView}
              className="font-serif text-xl font-semibold text-rose-500 sm:text-3xl dark:text-purple-200"
            />
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-400 sm:text-[10px] dark:text-gray-500">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
