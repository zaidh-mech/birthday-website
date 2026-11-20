'use client'

import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { animate, motion, useMotionValue } from 'framer-motion'
import { Heart, Ticket } from 'lucide-react'
import type { DateRSVP } from '@/lib/storage'
import { haptic, sfx } from '@/lib/sound'
import type { GiftPhoto } from './giftData'
import styles from './gift.module.css'

const glassCard =
  'relative w-full rounded-[2rem] border border-rose-100 bg-white/60 shadow-xl shadow-rose-200/30 backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:shadow-black/30'

/* ------------------------------------------------------------------ */
/* Step 0 — the question                                               */
/* ------------------------------------------------------------------ */

interface InviteStepProps {
  years: number
  fromName: string
  existing: DateRSVP | null
  reduce: boolean
  onYes: () => void
  onNo: () => void
  onViewTicket: () => void
}

export function InviteStep({ years, fromName, existing, reduce, onYes, onNo, onViewTicket }: InviteStepProps) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      {existing && (
        <motion.button
          type="button"
          onClick={onViewTicket}
          initial={reduce ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mb-6 flex w-full max-w-md items-center gap-3 rounded-2xl border border-rose-200 bg-white/80 px-4 py-3 text-left shadow-md backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-lg dark:border-purple-400/30 dark:bg-white/10"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-500 text-white dark:bg-purple-500">
            <Ticket className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold uppercase tracking-wider text-rose-500 dark:text-purple-300">You already said yes 💖</span>
            <span className="block truncate text-sm text-gray-700 dark:text-gray-200">
              {existing.placeName} · {existing.formattedDate}
            </span>
          </span>
          <span className="shrink-0 text-xs font-semibold text-rose-500 underline underline-offset-2 dark:text-purple-200">See our ticket</span>
        </motion.button>
      )}

      <div className={`${glassCard} px-5 py-10 text-center sm:px-10 sm:py-14`}>
        <motion.div
          className="mb-6 inline-block text-6xl sm:text-7xl"
          animate={reduce ? undefined : { y: [0, -10, 0], rotate: [0, -4, 4, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        >
          🎁
        </motion.div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-400 sm:text-sm dark:text-purple-300">
          To celebrate our {years} years &amp; your birthday
        </p>
        <h2 className="mt-4 font-serif text-3xl font-bold leading-tight text-gray-900 sm:text-5xl dark:text-gray-100">
          May I take you out on a date with me?
        </h2>
        <p className="mt-3 font-cursive text-2xl text-rose-500 dark:text-purple-300">— {fromName}</p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-5">
          <button
            type="button"
            onClick={onYes}
            className={`${styles.yesGlow} w-full rounded-full bg-rose-500 px-12 py-4 text-lg font-bold text-white transition hover:scale-105 hover:bg-rose-600 active:scale-95 sm:w-auto dark:bg-purple-500 dark:hover:bg-purple-400`}
          >
            Yes! 💕
          </button>
          <button
            type="button"
            onClick={onNo}
            className="w-full rounded-full bg-gray-100 px-10 py-4 font-medium text-gray-600 transition hover:bg-gray-200 active:scale-95 sm:w-auto dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15"
          >
            No
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Step 1 — the shy "No" that runs away                                */
/* ------------------------------------------------------------------ */

const MAX_DODGES = 7
/** Once it gives up, the No button grows back to this size. */
const TIRED_SCALE = 0.85
const NO_LABELS = ['Still no', 'Nope 🙅‍♀️', 'Catch me 😜', 'Too slow!', 'Hehe 🤭', 'Nuh-uh', 'So… tired…', 'Okay fine 😮‍💨']
const YES_LABELS = ['Fine, yes!', 'Yes! 💕', 'YES 💖', 'YESSS 💖', 'Obviously yes 😍']

interface PleadStepProps {
  reduce: boolean
  onYes: () => void
  onNo: () => void
}

export function PleadStep({ reduce, onYes, onNo }: PleadStepProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const noRef = useRef<HTMLButtonElement>(null)
  const yesRef = useRef<HTMLButtonElement>(null)
  const lastDodge = useRef(0)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const [dodges, setDodges] = useState(0)
  const [yesScale, setYesScale] = useState(1)

  const tired = dodges >= MAX_DODGES
  const noScale = tired ? TIRED_SCALE : Math.max(0.55, 1 - dodges * 0.065)

  const moveTo = useCallback(
    (tx: number, ty: number) => {
      if (reduce) {
        x.set(tx)
        y.set(ty)
      } else {
        animate(x, tx, { type: 'spring', stiffness: 420, damping: 26 })
        animate(y, ty, { type: 'spring', stiffness: 420, damping: 26 })
      }
    },
    [reduce, x, y],
  )

  const dodge = useCallback(
    (pointer?: { x: number; y: number }) => {
      const card = cardRef.current
      const btn = noRef.current
      if (!card || !btn || dodges >= MAX_DODGES) return
      const now = performance.now()
      if (now - lastDodge.current < 240) return
      lastDodge.current = now

      const cardRect = card.getBoundingClientRect()
      const btnRect = btn.getBoundingClientRect()
      // Untransformed (natural) centre of the button, relative to the card.
      const natX = btnRect.left + btnRect.width / 2 - x.get() - cardRect.left
      const natY = btnRect.top + btnRect.height / 2 - y.get() - cardRect.top
      // The last escape leaves it "tired" and grown back to TIRED_SCALE, so keep room for that size.
      const nextScale = dodges + 1 >= MAX_DODGES ? TIRED_SCALE : Math.max(0.55, 1 - (dodges + 1) * 0.065)
      const halfW = (btn.offsetWidth * nextScale) / 2
      const halfH = (btn.offsetHeight * nextScale) / 2
      const pad = 14
      const yes = yesRef.current?.getBoundingClientRect()

      // Where the centre may land (card coordinates): inside the card and, when enough of the card is
      // on screen, inside the visible part of it — clear of the fixed nav at the top and (on phones)
      // the floating theme/sound buttons at the bottom, so it never hides off-screen or under them.
      const wide = window.innerWidth >= 768
      const minX = pad + halfW
      const maxX = Math.max(minX, cardRect.width - pad - halfW)
      let minY = pad + halfH
      let maxY = Math.max(minY, cardRect.height - pad - halfH)
      const visTop = (wide ? 120 : 84) + halfH - cardRect.top
      const visBottom = window.innerHeight - (wide ? 16 : 80) - halfH - cardRect.top
      if (Math.min(maxY, visBottom) - Math.max(minY, visTop) > 0) {
        minY = Math.max(minY, visTop)
        maxY = Math.min(maxY, visBottom)
      }

      let best: { cx: number; cy: number } | null = null
      for (let i = 0; i < 30; i++) {
        const cx = minX + Math.random() * (maxX - minX)
        const cy = minY + Math.random() * (maxY - minY)
        const vx = cardRect.left + cx
        const vy = cardRect.top + cy
        const hitsYes =
          yes && vx > yes.left - halfW - 18 && vx < yes.right + halfW + 18 && vy > yes.top - halfH - 18 && vy < yes.bottom + halfH + 18
        const nearPointer = pointer ? Math.hypot(vx - pointer.x, vy - pointer.y) < 150 : false
        const nearCurrent = Math.hypot(cx - (natX + x.get()), cy - (natY + y.get())) < 90
        if (!hitsYes && !nearPointer && !nearCurrent) {
          best = { cx, cy }
          break
        }
        if (!best && !hitsYes) best = { cx, cy }
      }
      if (!best) best = { cx: minX, cy: minY }

      moveTo(best.cx - natX, best.cy - natY)
      // "Yes" grows with every escape, but never wider than the card.
      const yesWidth = yesRef.current?.offsetWidth ?? 200
      const maxFit = Math.max(1, (cardRect.width - 28) / yesWidth)
      setYesScale(Math.min(1.45, 1 + (dodges + 1) * 0.065, maxFit))
      setDodges((d) => d + 1)
      sfx.pop()
      haptic(10)
    },
    [dodges, moveTo, x, y],
  )

  // If the window's width changes, bring the button home so it can't end up outside the card.
  // Height-only resizes (phone toolbars sliding away while scrolling) don't reflow the card: ignore them.
  useEffect(() => {
    let width = window.innerWidth
    const reset = () => {
      if (window.innerWidth === width) return
      width = window.innerWidth
      moveTo(0, 0)
    }
    window.addEventListener('resize', reset)
    return () => window.removeEventListener('resize', reset)
  }, [moveTo])

  const onCardPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || tired || !noRef.current) return
    const r = noRef.current.getBoundingClientRect()
    const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right)
    const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom)
    if (Math.hypot(dx, dy) < 46) dodge({ x: e.clientX, y: e.clientY })
  }

  const onNoPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (tired) return
    if (e.pointerType !== 'mouse') {
      e.preventDefault()
      dodge({ x: e.clientX, y: e.clientY })
    }
  }

  const onNoClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    // Keyboard activation (detail === 0) always works; pointers have to catch it first.
    if (!tired && e.detail !== 0) {
      dodge({ x: e.clientX, y: e.clientY })
      return
    }
    sfx.miss()
    onNo()
  }

  return (
    <div
      ref={cardRef}
      onPointerMove={onCardPointerMove}
      className={`${glassCard} mx-auto flex min-h-[25rem] max-w-2xl flex-col items-center justify-center px-5 py-10 text-center sm:min-h-[26rem] sm:px-10`}
    >
      <div className="mb-5 text-5xl" aria-hidden="true">
        🙄
      </div>
      <h2 className="font-serif text-2xl font-bold leading-snug text-gray-900 sm:text-4xl dark:text-gray-100">
        Oh come on, you know you want to!
        <br />
        <span className="text-rose-400 dark:text-purple-300">I really, really want to take you…</span> so will you come, please?
      </h2>
      <p className="mt-3 min-h-[2.5rem] text-sm italic sm:min-h-[1.5rem] text-gray-500 dark:text-gray-400" aria-live="polite">
        {dodges === 0 ? '' : tired ? 'Fine, the No button gave up. It’s exhausted 😮‍💨' : 'Psst… the No button is a little shy 🤭'}
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
        <motion.button
          ref={yesRef}
          type="button"
          onClick={onYes}
          animate={{ scale: yesScale }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 15 }}
          className={`${styles.yesGlow} relative z-10 w-[13rem] max-w-full rounded-full bg-rose-500 px-6 py-4 text-lg font-bold text-white hover:bg-rose-600 dark:bg-purple-500 dark:hover:bg-purple-400`}
        >
          {YES_LABELS[Math.min(YES_LABELS.length - 1, Math.floor(dodges / 2))]}
        </motion.button>
        <motion.button
          ref={noRef}
          type="button"
          onPointerDown={onNoPointerDown}
          onPointerEnter={(e) => {
            if (e.pointerType === 'mouse' && !tired) dodge({ x: e.clientX, y: e.clientY })
          }}
          onClick={onNoClick}
          style={{ x, y }}
          animate={{ scale: noScale }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 18 }}
          className="relative z-20 w-[10.5rem] touch-manipulation whitespace-nowrap rounded-full bg-gray-100 px-4 py-3.5 font-medium text-gray-600 shadow-md transition-colors hover:bg-gray-200 dark:bg-[#24232f] dark:text-gray-300 dark:hover:bg-[#2d2c3a]"
        >
          {NO_LABELS[Math.min(dodges, NO_LABELS.length - 1)]}
        </motion.button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Step 2 — the cute fella                                             */
/* ------------------------------------------------------------------ */

interface PuppyStepProps {
  /** The admin-uploaded photo, if any */
  photo: GiftPhoto | null
  /** One of our local photos, used when there's no upload (or it fails to load) */
  fallback: GiftPhoto | null
  reduce: boolean
  onYes: () => void
}

export function PuppyStep({ photo, fallback, reduce, onYes }: PuppyStepProps) {
  const [failed, setFailed] = useState(false)
  const shown = photo && !failed ? photo : fallback
  return (
    <div className={`${glassCard} mx-auto flex max-w-2xl flex-col items-center px-5 py-10 text-center sm:px-10 sm:py-12`}>
      <motion.div
        initial={reduce ? false : { rotate: -12, scale: 0.7, opacity: 0 }}
        animate={{ rotate: 3, scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 13 }}
        className="relative mb-7 w-44 rounded-sm bg-white p-2 pb-8 shadow-2xl sm:w-52"
      >
        {shown ? (
          <img
            key={shown.src}
            src={shown.src}
            alt={shown.alt}
            decoding="async"
            onError={() => {
              if (shown === photo) setFailed(true)
            }}
            className="aspect-[4/5] w-full rounded-[2px] bg-rose-50 object-cover"
            style={{ objectPosition: 'center 30%' }}
          />
        ) : (
          <div className="grid aspect-[4/5] w-full place-items-center rounded-[2px] bg-gradient-to-br from-rose-100 to-purple-100 text-6xl" aria-hidden="true">
            🥺
          </div>
        )}
        <span className="absolute inset-x-0 bottom-1.5 text-center font-cursive text-lg text-gray-700">{shown?.caption ?? 'this cute fella'}</span>
        <Heart className="absolute -right-3 -top-3 h-8 w-8 rotate-12 text-rose-500 drop-shadow" fill="currentColor" strokeWidth={0} aria-hidden="true" />
      </motion.div>

      <h2 className="font-serif text-2xl font-bold leading-snug text-gray-900 sm:text-3xl dark:text-gray-100">
        Won&apos;t you change your mind for this cute fella? 🥺
      </h2>
      <p className="mx-auto mt-3 max-w-md italic text-gray-500 dark:text-gray-400">
        I know you won&apos;t say no to this face. That&apos;s why &ldquo;No&rdquo; isn&apos;t an option anymore.
      </p>

      <motion.button
        type="button"
        onClick={onYes}
        animate={reduce ? undefined : { scale: [1, 1.07, 1] }}
        transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
        whileTap={{ scale: 0.95 }}
        className={`${styles.yesGlow} mt-8 w-full rounded-full bg-rose-500 px-14 py-5 text-xl font-extrabold text-white hover:bg-rose-600 sm:w-auto dark:bg-purple-500 dark:hover:bg-purple-400`}
      >
        YES! ❤️
      </motion.button>
    </div>
  )
}
