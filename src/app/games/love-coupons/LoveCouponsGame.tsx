'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Eye, Gift, Heart, Undo2 } from 'lucide-react'
import GameShell from '@/components/games/GameShell'
import { useSiteConfig } from '@/lib/siteConfig'
import { getGameData, recordWin, setGameData } from '@/lib/gameStorage'
import { burst, burstFromElement, heartRain } from '@/lib/celebrate'
import { haptic, sfx } from '@/lib/sound'
import { useMounted, usePrefersReducedMotion } from '@/lib/hooks'
import CouponTicket from './CouponTicket'

const GAME = 'love-coupons'

function readIds(key: 'revealed' | 'redeemed'): string[] {
  const raw = getGameData<unknown>(GAME, key, [])
  return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : []
}

export default function LoveCouponsGame() {
  const { config } = useSiteConfig()
  const coupons = config.coupons
  const reducedMotion = usePrefersReducedMotion()
  const mounted = useMounted()
  const { resolvedTheme } = useTheme()
  const dark = mounted && resolvedTheme === 'dark'

  const [ready, setReady] = useState(false)
  const [revealed, setRevealed] = useState<string[]>([])
  const [redeemed, setRedeemed] = useState<string[]>([])
  const [freshStamp, setFreshStamp] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  // Mirrors of the state for synchronous checks inside handlers.
  const revealedRef = useRef<string[]>([])
  const redeemedRef = useRef<string[]>([])
  const couponIdsRef = useRef<string[]>(coupons.map((c) => c.id))
  const timers = useRef<number[]>([])

  useEffect(() => {
    couponIdsRef.current = coupons.map((c) => c.id)
  }, [coupons])

  useEffect(() => {
    const r = readIds('revealed')
    const d = readIds('redeemed')
    revealedRef.current = r
    redeemedRef.current = d
    setRevealed(r)
    setRedeemed(d)
    setReady(true)
    const pending = timers.current
    return () => pending.forEach((t) => window.clearTimeout(t))
  }, [])

  const commitRevealed = (next: string[]) => {
    revealedRef.current = next
    setRevealed(next)
    setGameData(GAME, 'revealed', next)
  }

  const commitRedeemed = (next: string[]) => {
    redeemedRef.current = next
    setRedeemed(next)
    setGameData(GAME, 'redeemed', next)
  }

  const allRevealedWith = (ids: string[]) => couponIdsRef.current.length > 0 && couponIdsRef.current.every((id) => ids.includes(id))

  const handleReveal = useCallback((id: string, el: HTMLElement | null) => {
    if (revealedRef.current.includes(id)) return
    const next = [...revealedRef.current, id]
    commitRevealed(next)
    sfx.chime()
    haptic(15)
    burstFromElement(el, { hearts: true, particleCount: 60, spread: 80 })
    if (allRevealedWith(next)) {
      recordWin(GAME)
      timers.current.push(
        window.setTimeout(() => {
          sfx.win()
          heartRain()
        }, 650),
      )
    }
  }, [])

  const handleRedeem = useCallback((id: string) => {
    sfx.pop()
    haptic([8, 30, 14])
    if (redeemedRef.current.includes(id)) return
    commitRedeemed([...redeemedRef.current, id])
    setFreshStamp(id)
  }, [])

  const revealAll = () => {
    const missing = couponIdsRef.current.filter((id) => !revealedRef.current.includes(id))
    if (missing.length === 0) return
    setConfirmReset(false)
    sfx.sparkle()
    // Peel them off one after another for a little domino effect.
    const gap = reducedMotion ? 0 : 90
    missing.forEach((id, i) => {
      timers.current.push(
        window.setTimeout(() => {
          if (revealedRef.current.includes(id)) return
          commitRevealed([...revealedRef.current, id])
          if (i === missing.length - 1) {
            sfx.chime()
            burst({ hearts: true, particleCount: 70, y: 0.55 })
          }
        }, i * gap),
      )
    })
  }

  const resetAll = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    // Empty in place: the unmount cleanup holds this same array.
    timers.current.length = 0
    commitRevealed([])
    commitRedeemed([])
    setFreshStamp(null)
    setConfirmReset(false)
    sfx.whoosh()
  }

  const revealedSet = useMemo(() => new Set(revealed), [revealed])
  const redeemedSet = useMemo(() => new Set(redeemed), [redeemed])
  const total = coupons.length
  const revealedCount = coupons.filter((c) => revealedSet.has(c.id)).length
  const redeemedCount = coupons.filter((c) => redeemedSet.has(c.id)).length
  const allRevealed = ready && total > 0 && revealedCount === total
  const progress = total > 0 ? revealedCount / total : 0
  const nickname = config.herName || config.nicknames[0] || 'my love'

  const stats = [
    { label: 'Revealed', value: `${revealedCount} / ${total}` },
    { label: 'Redeemed', value: redeemedCount },
  ]

  return (
    <GameShell
      title="Love Coupons"
      emoji="🎟️"
      tagline={`Scratch off the foil to see what I owe you, ${nickname}. They never expire.`}
      stats={stats}
      wide
      help={
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Scratch the shiny foil with your finger, mouse or pen. Once most of it is gone, the coupon pops free.</li>
          <li>Tap <strong>Redeem</strong> to send it to me on WhatsApp. It gets a little stamp, and I have to make it happen.</li>
          <li>No expiry, no fine print. Well, maybe a little fine print. 😘</li>
          <li>Keyboard: Tab to a covered coupon and press <kbd>Enter</kbd> to reveal it.</li>
        </ul>
      }
    >
      <div className="mx-auto mb-6 max-w-xl">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
          <span aria-live="polite" className="whitespace-nowrap">
            <span className="tabular-nums text-rose-500 dark:text-purple-300">
              {revealedCount} / {total}
            </span>{' '}
            revealed
          </span>
          <span className="flex items-center gap-1">
            {confirmReset ? (
              <>
                <span className="mr-1 text-gray-600 dark:text-gray-300">Cover them all again?</span>
                <button
                  type="button"
                  onClick={resetAll}
                  className="rounded-full bg-rose-500 px-2.5 py-1 font-semibold text-white transition hover:bg-rose-600 dark:bg-purple-500 dark:hover:bg-purple-400"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="rounded-full px-2.5 py-1 font-semibold text-gray-500 transition hover:bg-rose-50 dark:text-gray-300 dark:hover:bg-white/10"
                >
                  Keep
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={revealAll}
                  disabled={!ready || revealedCount === total}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 transition hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500 dark:hover:bg-white/10 dark:hover:text-purple-200"
                >
                  <Eye className="h-3.5 w-3.5" /> Reveal all
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  disabled={!ready || (revealed.length === 0 && redeemed.length === 0)}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 transition hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500 dark:hover:bg-white/10 dark:hover:text-purple-200"
                >
                  <Undo2 className="h-3.5 w-3.5" /> Reset coupons
                </button>
              </>
            )}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Coupons revealed"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={revealedCount}
          className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-rose-100 dark:bg-white/10"
        >
          <motion.div
            className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-gradient-to-r from-rose-400 via-pink-400 to-fuchsia-400 dark:from-purple-400 dark:via-fuchsia-400 dark:to-pink-400"
            initial={false}
            animate={{ scaleX: progress }}
            transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      <AnimatePresence>
        {allRevealed && (
          <motion.div
            key="all-revealed"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="mx-auto mb-6 flex max-w-xl items-center gap-3 rounded-3xl border border-rose-100 bg-white/60 px-5 py-4 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-md shadow-rose-400/30 dark:from-purple-400 dark:to-fuchsia-500">
              <Gift className="h-5 w-5" />
            </span>
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-200">
              <span className="font-serif text-base font-bold text-gray-900 dark:text-gray-100">Every coupon is yours. </span>
              Cash them in whenever you like. I'll be waiting{' '}
              <Heart aria-hidden="true" className="inline h-3.5 w-3.5 fill-rose-500 text-rose-500 dark:fill-pink-400 dark:text-pink-400" />
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {ready ? (
        <ul className="grid list-none grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((coupon, i) => (
            <motion.li
              key={coupon.id}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 18, rotate: i % 2 ? 1.2 : -1.2 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ delay: Math.min(i, 12) * 0.05, type: 'spring', stiffness: 220, damping: 24 }}
              className="min-w-0"
            >
              <CouponTicket
                coupon={coupon}
                index={i}
                revealed={revealedSet.has(coupon.id)}
                redeemed={redeemedSet.has(coupon.id)}
                stampFresh={freshStamp === coupon.id}
                dark={dark}
                reducedMotion={reducedMotion}
                whatsappNumber={config.whatsappNumber}
                fromName={config.fromName}
                onReveal={handleReveal}
                onRedeem={handleRedeem}
              />
            </motion.li>
          ))}
        </ul>
      ) : (
        <div aria-hidden="true" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((c) => (
            <div key={c.id} className="h-[13.5rem] animate-pulse rounded-2xl bg-white/50 motion-reduce:animate-none dark:bg-white/5" />
          ))}
        </div>
      )}
    </GameShell>
  )
}
