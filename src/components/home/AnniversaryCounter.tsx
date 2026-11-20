'use client'

import { useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { CalendarHeart } from 'lucide-react'
import { timeSince } from '@/lib/siteConfig'
import { useInterval } from '@/lib/hooks'
import RollingNumber from './RollingNumber'
import { EYEBROW, GLASS_CARD } from './types'

function plural(n: number, one: string, many: string) {
  return n === 1 ? one : many
}

/** Live "together for" counter. Render only after mount (it reads the clock). */
export default function AnniversaryCounter({ date }: { date: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })
  const [now, setNow] = useState(() => new Date())
  useInterval(() => setNow(new Date()), 1000)

  const t = timeSince(date, now)
  const since = new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
  const units = [
    { value: t.years, label: plural(t.years, 'year', 'years') },
    { value: t.months, label: plural(t.months, 'month', 'months') },
    { value: t.days, label: plural(t.days, 'day', 'days') },
  ]
  const clock = [
    { value: t.hours, label: 'hours' },
    { value: t.minutes, label: 'minutes' },
    { value: t.seconds, label: 'seconds' },
  ]

  return (
    <div ref={ref} className={`${GLASS_CARD} relative overflow-hidden p-5 text-center sm:p-8`}>
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-rose-200/40 blur-3xl dark:bg-purple-500/20" />
      <p className={`${EYEBROW} flex flex-wrap items-center justify-center gap-2`}>
        <CalendarHeart className="h-4 w-4" aria-hidden /> Together since {since}
      </p>

      <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-4">
        {units.map((u) => (
          <div key={u.label} className="rounded-2xl bg-white/70 px-1 py-4 shadow-sm ring-1 ring-rose-100/70 sm:py-5 dark:bg-white/5 dark:ring-white/10">
            <RollingNumber
              value={u.value}
              active={inView}
              className="justify-center font-serif text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl dark:text-gray-100"
            />
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-400 sm:text-xs dark:text-purple-300">{u.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-start justify-center gap-1.5 sm:gap-3" role="timer" aria-label="Hours, minutes and seconds">
        {clock.map((c, i) => (
          <div key={c.label} className="flex items-start gap-1.5 sm:gap-3">
            {i > 0 && (
              <span aria-hidden className="font-serif text-2xl font-semibold leading-[1.15em] text-rose-300 motion-safe:animate-pulse sm:text-4xl dark:text-purple-400">
                :
              </span>
            )}
            <div className="flex flex-col items-center">
              <RollingNumber
                value={c.value}
                minDigits={2}
                active={inView}
                className="font-serif text-2xl font-semibold text-rose-500 sm:text-4xl dark:text-purple-200"
              />
              <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-400 sm:text-[10px] dark:text-gray-500">{c.label}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-6 max-w-md text-pretty font-serif text-sm italic text-rose-900/75 sm:text-base dark:text-rose-100/75">
        That&rsquo;s{' '}
        <strong className="font-semibold not-italic text-rose-600 dark:text-purple-200">{t.totalDays.toLocaleString()}</strong> days of us,
        and every single one is my favourite.
      </p>
    </div>
  )
}
