'use client'

import { ArrowLeft, CalendarHeart, Check, MapPin, Palette, Ticket } from 'lucide-react'
import { STEP, type Step } from './giftData'

const PLAN = [
  { step: STEP.date, label: 'Date', Icon: CalendarHeart },
  { step: STEP.colour, label: 'Colour', Icon: Palette },
  { step: STEP.place, label: 'Place', Icon: MapPin },
  { step: STEP.ticket, label: 'Ticket', Icon: Ticket },
] as const

interface StepProgressProps {
  step: Step
  onBack: () => void
  onJump: (step: Step) => void
}

export default function StepProgress({ step, onBack, onJump }: StepProgressProps) {
  const canGoBack = step > STEP.date
  return (
    <nav aria-label="Date planning progress" className="mx-auto mb-6 flex w-full max-w-xl items-center gap-2 sm:mb-8 sm:gap-4">
      <button
        type="button"
        onClick={onBack}
        disabled={!canGoBack}
        aria-label="Go back one step"
        className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white/70 px-3 text-xs font-semibold text-gray-600 shadow-sm ring-1 ring-rose-100 backdrop-blur-md transition hover:-translate-x-0.5 hover:text-rose-500 disabled:pointer-events-none disabled:opacity-30 sm:px-4 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10 dark:hover:text-purple-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Back</span>
      </button>

      <ol className="flex flex-1 items-start">
        {PLAN.map(({ step: s, label, Icon }, i) => {
          const done = step > s
          const current = step === s
          const clickable = done && s !== STEP.ticket
          return (
            <li key={s} className="flex flex-1 items-start last:flex-none">
              <button
                type="button"
                onClick={() => clickable && onJump(s)}
                disabled={!clickable}
                aria-current={current ? 'step' : undefined}
                aria-label={`${label}${done ? ' (done)' : current ? ' (current step)' : ''}`}
                className="flex w-12 shrink-0 flex-col items-center gap-1 disabled:cursor-default"
              >
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full transition-all duration-300 sm:h-9 sm:w-9 ${
                    done
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 dark:bg-purple-500 dark:shadow-purple-900/40'
                      : current
                        ? 'bg-white text-rose-500 ring-2 ring-rose-400 shadow-md dark:bg-white/10 dark:text-purple-200 dark:ring-purple-300'
                        : 'bg-white/60 text-gray-400 ring-1 ring-rose-100 dark:bg-white/5 dark:text-gray-500 dark:ring-white/10'
                  }`}
                >
                  {done ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
                </span>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider ${
                    current ? 'text-rose-500 dark:text-purple-200' : done ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {label}
                </span>
              </button>
              {i < PLAN.length - 1 && (
                <span className="mt-4 h-0.5 min-w-2 flex-1 overflow-hidden rounded-full bg-rose-100 sm:mt-[1.1rem] dark:bg-white/10" aria-hidden="true">
                  <span
                    className="block h-full origin-left rounded-full bg-rose-400 transition-transform duration-500 dark:bg-purple-400"
                    style={{ transform: `scaleX(${done ? 1 : 0})` }}
                  />
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
