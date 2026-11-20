'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Dices, Gamepad2, Heart } from 'lucide-react'
import { GAMES } from '@/data/games'
import { getAllRecords } from '@/lib/gameStorage'
import { useCanHover, usePrefersReducedMotion } from '@/lib/hooks'
import { useSiteConfig } from '@/lib/siteConfig'
import { sfx, haptic } from '@/lib/sound'
import HubCard from './HubCard'
import styles from './HubCard.module.css'

type Records = ReturnType<typeof getAllRecords>

interface CardStatus {
  text: string
  hasRecord: boolean
}

function statusFor(records: Records | null, index: number): CardStatus | null {
  if (!records) return null
  const game = GAMES[index]
  const rec = records[game.id] ?? {}
  if (game.bestLabel) {
    if (typeof rec.best === 'number') return { text: game.bestLabel(rec.best), hasRecord: true }
    return { text: 'No score yet', hasRecord: false }
  }
  const plays = rec.plays ?? 0
  return { text: plays > 0 ? `Played ${plays}×` : 'Just for fun', hasRecord: false }
}

export default function GamesHub() {
  const router = useRouter()
  const reduceMotion = usePrefersReducedMotion()
  const canHover = useCanHover()
  const canTilt = canHover && !reduceMotion
  const { config } = useSiteConfig()
  const name = config.herName || 'my love'

  // localStorage is read after mount so the server HTML and first client render match.
  const [records, setRecords] = useState<Records | null>(null)
  useEffect(() => {
    const refresh = () => setRecords(getAllRecords())
    refresh()
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    window.addEventListener('storage', refresh)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('storage', refresh)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  const totals = records
    ? Object.values(records).reduce<{ plays: number; wins: number }>(
        (acc, rec) => ({ plays: acc.plays + (rec.plays ?? 0), wins: acc.wins + (rec.wins ?? 0) }),
        { plays: 0, wins: 0 },
      )
    : null

  // "Surprise me": a little roulette that lights up the games, then opens one.
  const [spinIndex, setSpinIndex] = useState<number | null>(null)
  const [landed, setLanded] = useState(false)
  const timers = useRef<number[]>([])
  useEffect(() => {
    const list = timers.current
    return () => list.forEach((t) => window.clearTimeout(t))
  }, [])

  const surprise = () => {
    if (spinIndex !== null) return
    const target = Math.floor(Math.random() * GAMES.length)
    haptic(10)
    if (reduceMotion) {
      setSpinIndex(target)
      setLanded(true)
      sfx.chime()
      timers.current.push(window.setTimeout(() => router.push(GAMES[target].href), 350))
      return
    }
    const steps = GAMES.length * 2 + target
    let step = 0
    const tick = () => {
      setSpinIndex(step % GAMES.length)
      if (step >= steps) {
        setLanded(true)
        sfx.chime()
        haptic([12, 40, 18])
        timers.current.push(window.setTimeout(() => router.push(GAMES[target].href), 750))
        return
      }
      sfx.tick()
      step += 1
      const t = step / steps
      timers.current.push(window.setTimeout(tick, 55 + t * t * 300))
    }
    tick()
  }

  const spinGame = spinIndex !== null ? GAMES[spinIndex] : null

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-24 sm:px-6 sm:pt-28 md:pb-16">
      {/* Header */}
      <header className="relative mx-auto mb-10 max-w-2xl text-center sm:mb-14">
        <span aria-hidden className={`${styles.sparkle} left-[6%] top-10 text-lg text-rose-300 dark:text-purple-300 sm:left-0`}>
          ✦
        </span>
        <span aria-hidden className={`${styles.sparkle} right-[8%] top-2 text-sm text-amber-300 sm:right-2`} style={{ animationDelay: '1.1s' }}>
          ✦
        </span>
        <span aria-hidden className={`${styles.sparkle} bottom-6 right-[4%] text-base text-pink-300 dark:text-pink-200`} style={{ animationDelay: '2s' }}>
          ♥
        </span>

        <motion.span
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-white/70 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-500 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-purple-200"
        >
          <Gamepad2 className="h-3.5 w-3.5" aria-hidden />
          {GAMES.length} little games, all about us
        </motion.span>

        <motion.h1
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 font-serif text-[2.6rem] font-bold leading-[1.05] tracking-tight text-gray-900 sm:text-6xl md:text-7xl dark:text-gray-100"
        >
          Game Night{' '}
          <span className="relative inline-block whitespace-nowrap font-cursive font-semibold text-rose-500 dark:text-purple-300">
            for Two
            <svg aria-hidden viewBox="0 0 200 20" className="absolute -bottom-2 left-0 h-3 w-full text-rose-300/80 dark:text-purple-400/60" preserveAspectRatio="none">
              <path d="M2 14 C 50 4, 120 4, 198 12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mx-auto mt-5 max-w-xl font-serif text-base italic leading-relaxed text-rose-900/75 sm:text-lg dark:text-rose-100/75"
        >
          Grab a blanket and get comfy, {name}. Every game in here is made out of us: our photos, our words, our silly little
          inside jokes. Win or lose, the prize is still me.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-7 flex justify-center"
        >
          <button
            type="button"
            onClick={surprise}
            disabled={spinIndex !== null}
            className="group inline-flex min-w-[13rem] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:shadow-xl hover:shadow-rose-500/35 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300 active:scale-95 disabled:cursor-default dark:from-purple-500 dark:via-fuchsia-500 dark:to-pink-500 dark:shadow-purple-500/25 dark:focus-visible:ring-purple-400"
          >
            {spinGame ? (
              <span className="inline-flex items-center gap-2">
                <span aria-hidden className="text-lg leading-none">
                  {spinGame.emoji}
                </span>
                {landed ? `${spinGame.title}!` : spinGame.title}
              </span>
            ) : (
              <>
                <Dices className="h-4 w-4 transition-transform duration-500 group-hover:rotate-[200deg]" aria-hidden />
                Surprise me
              </>
            )}
          </button>
          <span className="sr-only" aria-live="polite">
            {landed && spinGame ? `Opening ${spinGame.title}` : ''}
          </span>
        </motion.div>
      </header>

      {/* Game cards */}
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7">
        {GAMES.map((game, i) => {
          const status = statusFor(records, i)
          return (
            <HubCard
              key={game.id}
              game={game}
              index={i}
              bestText={status?.text ?? null}
              hasRecord={status?.hasRecord ?? false}
              highlighted={spinIndex === i}
              canTilt={canTilt}
              reduceMotion={reduceMotion}
            />
          )
        })}
      </ul>

      {/* Footer stat */}
      <motion.footer
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.7 }}
        className="mt-12 text-center sm:mt-16"
      >
        <div
          className={`inline-flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full border border-rose-100 bg-white/70 px-5 py-2.5 text-sm text-gray-700 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-gray-200 ${
            totals ? '' : 'invisible'
          }`}
        >
          <Heart className="h-4 w-4 shrink-0 fill-rose-400 text-rose-400 dark:fill-purple-300 dark:text-purple-300" aria-hidden />
          {totals && totals.plays > 0 ? (
            <span>
              <strong className="font-serif text-base tabular-nums">{totals.plays}</strong> {totals.plays === 1 ? 'round' : 'rounds'} played
              {totals.wins > 0 && (
                <>
                  {' '}
                  · <strong className="font-serif text-base tabular-nums">{totals.wins}</strong> {totals.wins === 1 ? 'win' : 'wins'}
                </>
              )}
            </span>
          ) : (
            <span>No rounds played yet. I'm waiting for you</span>
          )}
        </div>
        <p className="mt-4 font-cursive text-xl text-rose-500 sm:text-2xl dark:text-purple-300">
          Winner gets a kiss. Loser also gets a kiss.
        </p>
      </motion.footer>
    </main>
  )
}
