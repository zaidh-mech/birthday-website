'use client'

import { useMemo, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, CalendarHeart, Check } from 'lucide-react'
import { burstFromElement } from '@/lib/celebrate'
import { sfx } from '@/lib/sound'
import {
  DRESS_COLORS,
  addDays,
  daysFromToday,
  friendlyDate,
  luminance,
  nextOccurrenceISO,
  nextWeekdayISO,
  parseISODate,
  relativeDays,
  toISODate,
  todayISO,
} from './giftData'

const glassCard =
  'relative w-full rounded-[2rem] border border-rose-100 bg-white/60 shadow-xl shadow-rose-200/30 backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:shadow-black/30'

const nextButton =
  'inline-flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 px-10 py-4 font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-black active:scale-95 disabled:pointer-events-none disabled:opacity-40 sm:w-auto dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'

/* ------------------------------------------------------------------ */
/* Step 3 — pick a day                                                 */
/* ------------------------------------------------------------------ */

interface DateStepProps {
  date: string
  birthdayDate: string
  anniversaryDate: string
  reduce: boolean
  onChange: (iso: string) => void
  onNext: () => void
}

function dayMood(iso: string): string {
  const d = parseISODate(iso)
  if (!d) return ''
  const day = d.getDay()
  if (day === 0 || day === 6) return "A weekend! That's fineeee 🎉"
  if (day === 5) return 'A Friday! I’ll sneak out of work early 😉'
  return 'A weekday? Tell me early so your babyboy can take leave 🫡'
}

export function DateStep({ date, birthdayDate, anniversaryDate, reduce, onChange, onNext }: DateStepProps) {
  const min = todayISO()
  const offset = date ? daysFromToday(date) : null
  const invalid = Boolean(date) && (offset === null || offset < 0)

  const quickPicks = useMemo(() => {
    const picks: { label: string; iso: string }[] = []
    const saturday = nextWeekdayISO(6)
    picks.push({ label: 'This Saturday', iso: saturday })
    const sat = parseISODate(saturday)
    if (sat) picks.push({ label: 'Next Saturday', iso: toISODate(addDays(sat, 7)) })
    const bday = birthdayDate ? nextOccurrenceISO(birthdayDate) : null
    if (bday) picks.push({ label: 'On your birthday 🎂', iso: bday })
    const anniv = anniversaryDate ? nextOccurrenceISO(anniversaryDate) : null
    if (anniv) picks.push({ label: 'Our anniversary 💍', iso: anniv })
    const seen = new Set<string>()
    return picks.filter((p) => {
      if (seen.has(p.iso)) return false
      seen.add(p.iso)
      return true
    })
  }, [birthdayDate, anniversaryDate])

  return (
    <div className={`${glassCard} mx-auto max-w-2xl px-5 py-9 text-center sm:px-10 sm:py-12`}>
      <CalendarHeart className="mx-auto mb-4 h-10 w-10 text-rose-400 dark:text-purple-300" aria-hidden="true" />
      <h2 className="font-serif text-2xl font-bold leading-snug text-gray-900 sm:text-4xl dark:text-gray-100">
        Pick a day you want to spend with me 💕
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm font-medium text-gray-600 sm:text-base dark:text-gray-300">
        If it&apos;s a weekday, tell me beforehand so your babyboy can take leave.{' '}
        <span className="italic text-rose-400 dark:text-purple-300">But if it&apos;s a weekend, it&apos;s fineeee!</span>
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-2">
        {quickPicks.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              sfx.tick()
              onChange(p.iso)
            }}
            aria-pressed={date === p.iso}
            className={`rounded-full px-3.5 py-2 text-xs font-semibold transition active:scale-95 ${
              date === p.iso
                ? 'bg-rose-500 text-white shadow-md dark:bg-purple-500'
                : 'border border-rose-100 bg-white/80 text-gray-700 hover:bg-rose-50 dark:border-white/10 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <label htmlFor="date-pick" className="mt-6 block text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-400 dark:text-purple-300">
        Or choose any day
      </label>
      <input
        id="date-pick"
        type="date"
        value={date}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
        aria-describedby="date-feedback"
        className="mx-auto mt-2 block min-h-14 w-full max-w-xs rounded-xl border border-gray-200 bg-white/90 p-4 text-center text-base font-medium [&::-webkit-date-and-time-value]:text-center text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-300 dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:[color-scheme:dark] dark:focus:ring-purple-400"
      />

      <div id="date-feedback" className="mt-5 min-h-[4.5rem]" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          {date && (
            <motion.div
              key={date}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {invalid ? (
                <p className="font-medium text-amber-700 dark:text-amber-300">That day has already passed, silly 🙈 Pick one from today on.</p>
              ) : (
                <>
                  <p className="font-serif text-xl font-bold text-gray-900 dark:text-gray-100">{friendlyDate(date)}</p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-semibold text-rose-500 dark:text-purple-300">{offset !== null ? relativeDays(offset) : ''}</span>
                    {' · '}
                    {dayMood(date)}
                  </p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4">
        <button type="button" disabled={!date || invalid} onClick={onNext} className={nextButton}>
          Next step <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Step 4 — dress colour                                               */
/* ------------------------------------------------------------------ */

interface ColorStepProps {
  color: string
  reduce: boolean
  onChange: (name: string) => void
  onNext: () => void
}

export function ColorStep({ color, reduce, onChange, onNext }: ColorStepProps) {
  const refs = useRef(new Map<string, HTMLButtonElement>())
  const selected = DRESS_COLORS.find((c) => c.name === color) ?? null

  const pick = (name: string, hex: string) => {
    onChange(name)
    sfx.pop()
    burstFromElement(refs.current.get(name) ?? null, { particleCount: 28, spread: 70, colors: [hex, '#ffffff', '#fda4af'], scalar: 0.8 })
  }

  return (
    <div className={`${glassCard} mx-auto max-w-2xl px-5 py-9 text-center sm:px-10 sm:py-12`}>
      <h2 className="font-serif text-2xl font-bold text-gray-900 sm:text-4xl dark:text-gray-100">Before choosing where to go…</h2>
      <p className="mx-auto mt-3 max-w-md text-base font-medium text-gray-600 sm:text-lg dark:text-gray-300">
        Choose a colour for our dress theme. <span className="italic text-rose-400 dark:text-purple-300">It&apos;s a secret.</span> 🤫
      </p>

      <div className="mx-auto mt-8 grid max-w-md grid-cols-4 gap-x-2 gap-y-5 sm:gap-x-4" role="group" aria-label="Dress theme colour">
        {DRESS_COLORS.map((c) => {
          const active = color === c.name
          const light = luminance(c.hex) > 0.6
          return (
            <button
              key={c.name}
              ref={(el) => {
                if (el) refs.current.set(c.name, el)
                else refs.current.delete(c.name)
              }}
              type="button"
              aria-pressed={active}
              aria-label={`${c.name}, ${c.note}`}
              onClick={() => pick(c.name, c.hex)}
              className="group flex flex-col items-center gap-2 rounded-2xl p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 dark:focus-visible:ring-purple-300"
            >
              <motion.span
                animate={{ scale: active ? 1.12 : 1 }}
                whileHover={reduce ? undefined : { scale: active ? 1.15 : 1.08 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                className={`grid h-12 w-12 place-items-center rounded-full shadow-md ring-1 ring-black/10 sm:h-16 sm:w-16 dark:ring-white/20 ${
                  active ? 'outline outline-[3px] outline-offset-4 outline-gray-900 dark:outline-white' : ''
                }`}
                style={{ backgroundColor: c.hex }}
              >
                {active && <Check className={`h-6 w-6 ${light ? 'text-gray-900' : 'text-white'}`} strokeWidth={3} aria-hidden="true" />}
              </motion.span>
              <span
                className={`text-[11px] font-semibold leading-tight sm:text-xs ${
                  active ? 'text-gray-900 dark:text-gray-50' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {c.name}
              </span>
            </button>
          )
        })}
      </div>

      <p className="mt-7 min-h-[1.75rem] text-base text-gray-700 dark:text-gray-200" aria-live="polite">
        {selected ? (
          <>
            You picked{' '}
            <span className="inline-flex items-center gap-1.5 font-bold">
              <span className="inline-block h-3.5 w-3.5 rounded-full ring-1 ring-black/15 dark:ring-white/30" style={{ backgroundColor: selected.hex }} aria-hidden="true" />
              {selected.name}
            </span>{' '}
            — {selected.note} ✨
          </>
        ) : (
          <span className="text-sm italic text-gray-400">Tap a colour to choose</span>
        )}
      </p>

      <div className="mt-6">
        <button type="button" disabled={!color} onClick={onNext} className={nextButton}>
          Explore places ✨
        </button>
      </div>
    </div>
  )
}
