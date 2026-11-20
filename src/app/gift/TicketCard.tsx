'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { motion, type PanInfo } from 'framer-motion'
import { Heart, Scissors, Undo2 } from 'lucide-react'
import { useMediaQuery } from '@/lib/hooks'
import { haptic, sfx } from '@/lib/sound'
import type { TicketInfo } from './ticketCanvas'
import styles from './gift.module.css'

function Field({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-bold uppercase tracking-[0.24em] text-rose-500 dark:text-purple-300">{label}</dt>
      <dd className="mt-0.5 font-serif text-[1.05rem] font-semibold leading-snug text-gray-900 sm:text-lg dark:text-gray-50">{value}</dd>
      {sub && <dd className="mt-0.5 text-xs leading-snug text-gray-500 dark:text-gray-400">{sub}</dd>}
    </div>
  )
}

/** Deterministic bar widths for a decorative barcode. */
function barcodeBars(seed: string, count = 28): { w: number; gap: number }[] {
  let t = 0
  for (let i = 0; i < seed.length; i++) t = (Math.imul(t, 31) + seed.charCodeAt(i)) >>> 0
  const bars: { w: number; gap: number }[] = []
  for (let i = 0; i < count; i++) {
    t = (Math.imul(t ^ (t >>> 13), 1103515245) + 12345) >>> 0
    const a = t / 4294967296
    t = (Math.imul(t ^ (t >>> 13), 1103515245) + 12345) >>> 0
    const b = t / 4294967296
    bars.push({ w: 1 + Math.floor(a * 3), gap: 1 + Math.floor(b * 2) })
  }
  return bars
}

function Barcode({ seed, className = '' }: { seed: string; className?: string }) {
  const bars = useMemo(() => barcodeBars(seed), [seed])
  return (
    <span className={`flex h-10 items-stretch ${className}`} aria-hidden="true">
      {bars.map((b, i) => (
        <span key={i} className="bg-current" style={{ width: b.w, marginRight: b.gap }} />
      ))}
    </span>
  )
}

export default function TicketCard({ info, reduce }: { info: TicketInfo; reduce: boolean }) {
  const isRow = useMediaQuery('(min-width: 640px)')
  const [torn, setTorn] = useState(false)

  const tear = () => {
    if (torn) return
    setTorn(true)
    sfx.scratch()
    window.setTimeout(() => sfx.scratch(), 70)
    window.setTimeout(() => sfx.pop(), 150)
    haptic([8, 30, 8])
  }
  const reattach = () => {
    setTorn(false)
    sfx.flip()
  }

  const onDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, pan: PanInfo) => {
    const d = pan.offset.x
    if (isRow ? d > 55 : Math.abs(d) > 70) tear()
  }

  const tornPose = isRow ? { x: 20, y: 14, rotate: 6 } : { x: 0, y: 24, rotate: -3 }

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <div className="relative flex flex-col drop-shadow-[0_22px_32px_rgba(225,29,72,0.22)] sm:flex-row dark:drop-shadow-[0_22px_36px_rgba(76,29,149,0.55)]">
        {/* Body */}
        <div className={`${styles.ticketMain} ${styles.ticketPaper} relative min-w-0 flex-1 overflow-hidden p-5 pb-7 sm:p-7 md:p-8`}>
          <span className="pointer-events-none absolute inset-2.5 rounded-[22px] border border-dashed border-rose-300/60 sm:inset-3 dark:border-purple-300/20" aria-hidden="true" />
          {!reduce && <span className={styles.sheen} aria-hidden="true" />}

          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.3em] text-rose-500 dark:text-purple-300">
                <Heart className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} aria-hidden="true" />
                Admit two
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">No. {info.serial}</span>
            </div>

            <h3 className="mt-3 font-serif text-2xl font-bold leading-tight text-gray-900 sm:text-3xl dark:text-gray-50">
              Our {info.years}-Year Anniversary Date
            </h3>
            <p className="font-cursive text-xl text-rose-500 sm:text-2xl dark:text-purple-300">&amp; your birthday celebration</p>

            <div className="my-4 h-px bg-gradient-to-r from-rose-200 via-rose-200/60 to-transparent dark:from-white/15 dark:via-white/5" />

            <dl className="grid grid-cols-1 gap-x-6 gap-y-3.5 min-[400px]:grid-cols-2">
              <Field label="Date" value={info.formattedDate} />
              <Field label="Time" value={info.time} sub={info.offering} />
              <Field label="Place" value={info.placeName} sub={info.placeSubtitle} />
              <Field
                label="Dress code"
                value={
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 shrink-0 rounded-full ring-2 ring-black/10 dark:ring-white/30" style={{ backgroundColor: info.colorHex }} aria-hidden="true" />
                    {info.colorName}
                  </span>
                }
                sub={info.colorNote}
              />
            </dl>

            <p className="mt-5 font-cursive text-lg leading-tight text-gray-500 dark:text-gray-400">
              Valid for one perfect day with {info.fromName} <span className="text-rose-400 dark:text-purple-300">♡</span>
            </p>
          </div>
        </div>

        {/* Stub */}
        <motion.div
          drag={torn || reduce ? false : 'x'}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.45}
          dragMomentum={false}
          onDragEnd={onDragEnd}
          animate={torn ? tornPose : { x: 0, y: 0, rotate: 0 }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 240, damping: 18 }}
          whileDrag={{ cursor: 'grabbing' }}
          className={`${styles.ticketStub} relative flex h-36 shrink-0 cursor-grab select-none items-center justify-between gap-3 bg-gradient-to-br from-rose-400 to-pink-600 px-6 text-white sm:h-auto sm:w-44 sm:flex-col sm:justify-center sm:gap-2 sm:px-4 sm:py-8 md:w-52 dark:from-purple-500 dark:to-violet-700`}
          aria-label={`Ticket stub: admit two, ${info.monthShort} ${info.dayNumber}, ${info.startLabel}`}
          role="img"
        >
          <span className="flex flex-col items-start text-[11px] font-extrabold uppercase leading-tight tracking-[0.28em] sm:items-center sm:text-center">
            <span>Admit</span>
            <span>Two</span>
            <Heart className="mt-1.5 hidden h-4 w-4 sm:block" fill="currentColor" strokeWidth={0} aria-hidden="true" />
          </span>
          <span className="flex flex-col items-center leading-none">
            <span className="text-sm font-extrabold uppercase tracking-[0.3em] opacity-90">{info.monthShort}</span>
            <span className="font-serif text-5xl font-bold sm:text-6xl">{info.dayNumber}</span>
            <span className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.2em] opacity-90">
              {info.weekday.slice(0, 3)} · {info.startLabel}
            </span>
          </span>
          <span className="hidden flex-col items-end gap-1 min-[360px]:flex sm:items-center">
            <Barcode seed={`${info.serial}${info.dateISO}`} className="text-white/95" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.25em] opacity-80">Table for two</span>
          </span>
        </motion.div>
      </div>

      {/* Tear controls */}
      <div className="mt-6 flex min-h-[2.5rem] items-center justify-center text-center">
        {torn ? (
          <p className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-gray-600 dark:text-gray-300">
            <span>✂️ Stub torn — keep it safe, it&apos;s your proof 😘</span>
            <button
              type="button"
              onClick={reattach}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-rose-500 underline-offset-2 hover:underline dark:text-purple-300"
            >
              <Undo2 className="h-3.5 w-3.5" aria-hidden="true" /> Put it back
            </button>
          </p>
        ) : (
          <button
            type="button"
            onClick={tear}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-rose-300 px-3.5 py-1.5 text-xs font-semibold text-rose-500 transition hover:bg-rose-50 active:scale-95 dark:border-purple-300/40 dark:text-purple-200 dark:hover:bg-white/5"
          >
            <Scissors className="h-3.5 w-3.5" aria-hidden="true" />
            {reduce ? 'Tear off the stub' : 'Tear off the stub (or drag it!)'}
          </button>
        )}
      </div>
    </div>
  )
}
