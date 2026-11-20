'use client'

import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimate } from 'framer-motion'
import { ChevronDown, Heart, ScrollText } from 'lucide-react'
import { useSiteConfig } from '@/lib/siteConfig'
import { useLocalStorageState, usePrefersReducedMotion } from '@/lib/hooks'
import { haptic, sfx } from '@/lib/sound'
import { burstFromElement, heartRain } from '@/lib/celebrate'
import JarSvg from './JarSvg'
import ReasonNote from './ReasonNote'
import Reveal from './Reveal'
import SectionHeading from './SectionHeading'
import { BUTTON_SECONDARY, petName } from './types'

interface JarProgress {
  /** Every reason she has ever unfolded, in the order she found them */
  discovered: string[]
  /** Reasons drawn in the current pass through the jar (no repeats until all are seen) */
  round: string[]
}

const EMPTY: JarProgress = { discovered: [], round: [] }

export default function ReasonsJarSection() {
  const { config } = useSiteConfig()
  // Duplicate lines from the admin textarea would keep the jar from ever emptying or completing.
  const reasons = useMemo(() => Array.from(new Set(config.reasons)), [config.reasons])
  const name = petName(config.herName, config.nicknames)
  const reduce = usePrefersReducedMotion()
  const [progress, setProgress] = useLocalStorageState<JarProgress>('home_reasons_jar_v1', EMPTY)
  const [current, setCurrent] = useState<string | null>(null)
  const [pullKey, setPullKey] = useState(0)
  const [showAll, setShowAll] = useState(false)
  const [jarScope, animateJar] = useAnimate<HTMLDivElement>()
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Stored data may be from an older version or edited by hand: only trust arrays of known reasons.
  const discovered = (Array.isArray(progress?.discovered) ? progress.discovered : []).filter((r) => reasons.includes(r))
  const round = (Array.isArray(progress?.round) ? progress.round : []).filter((r) => reasons.includes(r))
  const remaining = reasons.length - round.length
  const allFound = reasons.length > 0 && discovered.length >= reasons.length

  const pull = () => {
    if (reasons.length === 0) return
    let nextRound = round
    let pool = reasons.filter((r) => !nextRound.includes(r))
    if (pool.length === 0) {
      nextRound = []
      pool = reasons.filter((r) => r !== current)
      if (pool.length === 0) pool = reasons
    }
    const pick = pool[Math.floor(Math.random() * pool.length)]
    const wasNew = !discovered.includes(pick)
    const nextDiscovered = wasNew ? [...discovered, pick] : discovered
    setProgress({ discovered: nextDiscovered, round: [...nextRound, pick] })
    setCurrent(pick)
    setPullKey((k) => k + 1)

    sfx.pop()
    haptic(10)
    if (!reduce && jarScope.current) {
      void animateJar(jarScope.current, { rotate: [0, -7, 6, -4, 2, 0], y: [0, -6, 0, -2, 0, 0] }, { duration: 0.65, ease: 'easeInOut' })
    }
    if (wasNew && nextDiscovered.length === reasons.length) {
      window.setTimeout(() => {
        heartRain()
        sfx.win()
      }, 500)
    } else {
      window.setTimeout(() => sfx.flip(), 260)
      if (wasNew) burstFromElement(buttonRef.current, { hearts: true, particleCount: 14, spread: 50 })
    }
  }

  const pct = reasons.length ? Math.round((discovered.length / reasons.length) * 100) : 0
  const number = current ? reasons.indexOf(current) + 1 : 0

  return (
    <section id="reasons" className="relative scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24">
      <SectionHeading
        eyebrow="Reasons I love you"
        icon={<Heart className="h-3.5 w-3.5 fill-rose-400 text-rose-400 dark:fill-purple-300 dark:text-purple-300" aria-hidden />}
        title="A jar full of reasons"
        subtitle={`I wrote down ${reasons.length} of them. Honestly, I ran out of paper, not reasons.`}
      />

      <Reveal className="mx-auto grid w-full max-w-5xl items-center gap-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-14">
        <div className="relative mx-auto w-full max-w-[15rem] sm:max-w-[17rem] md:max-w-[19rem]">
          <div aria-hidden className="pointer-events-none absolute inset-[8%] rounded-full bg-rose-300/30 blur-3xl dark:bg-purple-500/25" />
          <button
            ref={buttonRef}
            type="button"
            onClick={pull}
            aria-label="Pull a reason from the jar"
            className="group relative block w-full rounded-[2rem] transition-transform duration-500 ease-out hover:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300/60 active:scale-[0.97] dark:focus-visible:ring-purple-400/50"
          >
            <div ref={jarScope} style={{ transformOrigin: '50% 90%' }}>
              <div className="transition-[filter] duration-500 group-hover:drop-shadow-[0_18px_30px_rgba(244,63,94,0.25)] dark:group-hover:drop-shadow-[0_18px_30px_rgba(192,132,252,0.3)]">
                <JarSvg filled={reasons.length ? remaining / reasons.length : 0} />
              </div>
            </div>
            <AnimatePresence>
              {pullKey > 0 && (
                <motion.span
                  key={pullKey}
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-[14%] -ml-4 block h-5 w-8 rounded-sm bg-amber-200 shadow-md ring-1 ring-black/5"
                  initial={{ y: 30, opacity: 0, rotate: 0, scale: 0.6 }}
                  animate={{ y: -90, opacity: [0, 1, 1, 0], rotate: 28, scale: [0.6, 1, 1, 0.8] }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                />
              )}
            </AnimatePresence>
            <span className="mt-2 block text-center text-xs font-semibold uppercase tracking-[0.2em] text-rose-400 transition-colors group-hover:text-rose-500 dark:text-purple-300 dark:group-hover:text-purple-200">
              {remaining === 0 && reasons.length > 0 ? 'Tap to refill the jar' : 'Tap the jar'}
            </span>
          </button>
        </div>

        <div className="w-full">
          <ReasonNote reason={current} number={number} pullKey={pullKey} signature={config.fromName} name={name} />

          <div className="mt-6">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                <span className="tabular-nums">
                  {discovered.length} / {reasons.length}
                </span>{' '}
                <span className="font-normal text-gray-500 dark:text-gray-400">discovered</span>
              </span>
              {discovered.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAll((v) => !v)}
                  aria-expanded={showAll}
                  aria-controls="reasons-list"
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-rose-500 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300/60 dark:text-purple-200 dark:hover:bg-white/10"
                >
                  <ScrollText className="h-3.5 w-3.5" aria-hidden />
                  {showAll ? 'Hide list' : 'Show all'}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAll ? 'rotate-180' : ''}`} aria-hidden />
                </button>
              )}
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-rose-100 dark:bg-white/10"
              role="progressbar"
              aria-label="Reasons discovered"
              aria-valuemin={0}
              aria-valuemax={reasons.length}
              aria-valuenow={discovered.length}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-300 via-rose-400 to-pink-500 transition-[width] duration-700 ease-out dark:from-purple-400 dark:via-fuchsia-400 dark:to-pink-400"
                style={{ width: `${pct}%` }}
              />
            </div>
            {allFound && (
              <p className="mt-3 font-serif text-sm italic text-rose-900/80 dark:text-rose-100/80">
                You found every single one. The jar refills itself, because my reasons never run out 💗
              </p>
            )}

            <AnimatePresence initial={false}>
              {showAll && discovered.length > 0 && (
                <motion.div
                  id="reasons-list"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <ol className="mt-4 max-h-80 space-y-2 overflow-y-auto overscroll-contain rounded-2xl border border-rose-100 bg-white/60 p-3 backdrop-blur-md sm:p-4 dark:border-white/10 dark:bg-white/5">
                    {discovered.map((r) => (
                      <li key={r} className="flex gap-3 rounded-xl bg-white/70 px-3 py-2.5 text-sm leading-relaxed text-gray-700 dark:bg-white/5 dark:text-gray-200">
                        <span className="font-serif text-xs font-bold tabular-nums text-rose-400 dark:text-purple-300">#{reasons.indexOf(r) + 1}</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ol>
                </motion.div>
              )}
            </AnimatePresence>

            {discovered.length === 0 && (
              <button type="button" onClick={pull} className={`${BUTTON_SECONDARY} mt-5`}>
                <Heart className="h-4 w-4" aria-hidden /> Pull my first note
              </button>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  )
}
