'use client'

import { memo, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, MessageCircleHeart } from 'lucide-react'
import type { Coupon } from '@/lib/siteConfig'
import { whatsappLink } from '@/lib/siteConfig'
import ScratchFoil from './ScratchFoil'
import styles from './coupons.module.css'

const ACCENTS = [
  {
    stub: 'bg-rose-100/70 text-rose-500 dark:bg-rose-400/10 dark:text-rose-300',
    header: 'text-rose-500 dark:text-rose-300',
    perf: 'text-rose-300 dark:text-rose-300/40',
    emoji: 'bg-rose-100 dark:bg-rose-400/15',
  },
  {
    stub: 'bg-violet-100/70 text-violet-500 dark:bg-violet-400/10 dark:text-violet-300',
    header: 'text-violet-500 dark:text-violet-300',
    perf: 'text-violet-300 dark:text-violet-300/40',
    emoji: 'bg-violet-100 dark:bg-violet-400/15',
  },
  {
    stub: 'bg-amber-100/70 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300',
    header: 'text-amber-600 dark:text-amber-300',
    perf: 'text-amber-300 dark:text-amber-300/40',
    emoji: 'bg-amber-100 dark:bg-amber-400/15',
  },
  {
    stub: 'bg-pink-100/70 text-pink-500 dark:bg-fuchsia-400/10 dark:text-fuchsia-300',
    header: 'text-pink-500 dark:text-fuchsia-300',
    perf: 'text-pink-300 dark:text-fuchsia-300/40',
    emoji: 'bg-pink-100 dark:bg-fuchsia-400/15',
  },
] as const

export function redeemMessage(coupon: Coupon): string {
  return `I'm redeeming my love coupon: ${coupon.title} 💌`
}

interface CouponTicketProps {
  coupon: Coupon
  index: number
  revealed: boolean
  redeemed: boolean
  /** Redeemed just now: slam the stamp down with an animation */
  stampFresh: boolean
  dark: boolean
  reducedMotion: boolean
  whatsappNumber: string
  fromName: string
  onReveal: (id: string, el: HTMLElement | null) => void
  onRedeem: (id: string) => void
}

function CouponTicket({
  coupon,
  index,
  revealed,
  redeemed,
  stampFresh,
  dark,
  reducedMotion,
  whatsappNumber,
  fromName,
  onReveal,
  onRedeem,
}: CouponTicketProps) {
  const cardRef = useRef<HTMLElement>(null)
  const redeemRef = useRef<HTMLAnchorElement>(null)
  const accent = ACCENTS[index % ACCENTS.length]
  const serial = String(index + 1).padStart(3, '0')

  return (
    <div className={`${styles.lift} ${revealed ? styles.open : ''} h-full`}>
      <article
        ref={cardRef}
        aria-label={revealed ? `Love coupon number ${serial}: ${coupon.title}` : `Love coupon number ${serial}, still covered`}
        className={`${styles.ticket} ${styles.paper} relative flex h-full min-h-[13.5rem] overflow-hidden rounded-2xl [--stub:3.5rem] sm:[--stub:4rem]`}
      >
        {/* tear-off stub */}
        <div aria-hidden="true" className={`flex w-[var(--stub)] shrink-0 flex-col items-center justify-between py-5 ${accent.stub}`}>
          <Heart className="h-4 w-4 fill-current" />
          <span className="rotate-180 font-serif text-xs font-bold tracking-[0.25em] [writing-mode:vertical-rl]">No. {serial}</span>
          <span className={`${styles.barcode} block h-10 w-5 opacity-60`} />
        </div>
        <span aria-hidden="true" className={`${styles.perforation} ${accent.perf}`} />

        <div className="relative flex min-w-0 flex-1 flex-col">
          <header className={`flex items-center justify-between gap-2 pb-1.5 pl-4 pr-4 pt-3 text-[10px] font-bold uppercase tracking-[0.22em] ${accent.header}`}>
            <span className="truncate">Love coupon • No expiry</span>
            <span aria-hidden="true">♥</span>
          </header>

          <div className="relative flex flex-1 flex-col px-4 pb-4 pt-1">
            <div inert={!revealed} className="flex flex-1 flex-col">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className={`${revealed ? styles.float : ''} flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-sm ${accent.emoji}`}
                >
                  {coupon.emoji}
                </span>
                <div className="min-w-0">
                  <h2 className="break-words font-serif text-lg font-bold leading-snug text-gray-900 dark:text-gray-100">{coupon.title}</h2>
                  {coupon.description && (
                    <p className="mt-1 break-words text-sm leading-relaxed text-gray-600 dark:text-gray-300">{coupon.description}</p>
                  )}
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                <span className="min-w-0 truncate font-cursive text-base text-gray-500 dark:text-gray-400">{fromName}</span>
                <a
                  ref={redeemRef}
                  href={whatsappLink(whatsappNumber, redeemMessage(coupon))}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => onRedeem(coupon.id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold outline-none transition focus-visible:ring-4 focus-visible:ring-rose-300 active:scale-95 dark:focus-visible:ring-purple-400/60 ${
                    redeemed
                      ? 'bg-white/80 text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50 dark:bg-white/5 dark:text-purple-200 dark:ring-white/15 dark:hover:bg-white/10'
                      : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/25 hover:brightness-110 dark:from-purple-500 dark:to-fuchsia-500 dark:shadow-purple-500/25'
                  }`}
                >
                  <MessageCircleHeart className="h-4 w-4" />
                  {redeemed ? 'Ask again' : 'Redeem'}
                </a>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {!revealed && (
                <motion.div
                  key="foil"
                  exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.05 }}
                  transition={{ duration: reducedMotion ? 0.2 : 0.55, ease: 'easeOut' }}
                  className="absolute inset-x-2 bottom-2 top-0 rounded-xl"
                >
                  <ScratchFoil
                    seed={index}
                    dark={dark}
                    revealLabel={`Reveal love coupon number ${serial}`}
                    onReveal={(viaKeyboard) => {
                      onReveal(coupon.id, cardRef.current)
                      // The covering button disappears, so hand keyboard focus to the coupon's Redeem link.
                      if (viaKeyboard) requestAnimationFrame(() => redeemRef.current?.focus({ preventScroll: true }))
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>{redeemed && <RedeemedStamp key="stamp" fresh={stampFresh} reducedMotion={reducedMotion} />}</AnimatePresence>
      </article>
    </div>
  )
}

function RedeemedStamp({ fresh, reducedMotion }: { fresh: boolean; reducedMotion: boolean }) {
  return (
    <motion.div
      initial={fresh ? (reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 2.6, rotate: -30 }) : false}
      animate={{ opacity: 1, scale: 1, rotate: -9 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={reducedMotion ? { duration: 0.2 } : { type: 'spring', stiffness: 560, damping: 22 }}
      className="pointer-events-none absolute bottom-[3.6rem] right-4 z-20 sm:right-5"
    >
      {fresh && !reducedMotion && <span aria-hidden="true" className={`${styles.inkRing} absolute -inset-1 rounded-xl border-4 border-rose-500/60 dark:border-rose-400/60`} />}
      <div
        className={`${styles.stamp} rounded-lg border-[3px] border-double border-rose-600 bg-[#fffaf3]/80 px-3 py-1.5 text-center text-rose-600 dark:border-rose-400 dark:bg-[#1a1724]/85 dark:text-rose-300`}
      >
        <div className="whitespace-nowrap text-sm font-black uppercase tracking-[0.18em]">Redeemed ✓</div>
        <div className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-80">with love</div>
      </div>
    </motion.div>
  )
}

export default memo(CouponTicket)
