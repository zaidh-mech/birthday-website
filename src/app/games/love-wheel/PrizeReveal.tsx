'use client'

import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircleHeart, RotateCcw, X } from 'lucide-react'
import type { WheelPrize } from '@/lib/siteConfig'
import { whatsappLink } from '@/lib/siteConfig'
import type { LocalPhoto } from '@/lib/photos'
import { sfx } from '@/lib/sound'
import { claimMessage } from './history'
import styles from './wheel.module.css'

interface PrizeRevealProps {
  prize: WheelPrize | null
  photo: LocalPhoto | null
  whatsappNumber: string
  fromName: string
  reducedMotion: boolean
  onClose: () => void
  onSpinAgain: () => void
  /** Where focus goes on close when the element focused before opening can't take it back */
  fallbackFocus?: () => HTMLElement | null
}

function canRefocus(el: HTMLElement | null): el is HTMLElement {
  if (!el || el === document.body || !document.contains(el)) return false
  return !(el instanceof HTMLButtonElement && el.disabled)
}

/** The "you won" card: big emoji, the prize, and a real WhatsApp link to claim it. */
export default function PrizeReveal({
  prize,
  photo,
  whatsappNumber,
  fromName,
  reducedMotion,
  onClose,
  onSpinAgain,
  fallbackFocus,
}: PrizeRevealProps) {
  const titleId = useId()
  const detailId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const claimRef = useRef<HTMLAnchorElement>(null)
  const [claimed, setClaimed] = useState(false)
  const open = prize !== null

  useEffect(() => {
    if (!open) return
    setClaimed(false)
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusTimer = window.setTimeout(() => claimRef.current?.focus({ preventScroll: true }), 60)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(focusTimer)
      window.removeEventListener('keydown', onKey)
      const target = canRefocus(previouslyFocused) ? previouslyFocused : (fallbackFocus?.() ?? null)
      target?.focus({ preventScroll: true })
    }
  }, [open, prize?.id])

  // Keep Tab inside the dialog.
  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !dialogRef.current) return
    const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
    if (items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <AnimatePresence>
      {prize && (
        <motion.div
          key="prize-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] overflow-y-auto overflow-x-hidden bg-black/55 backdrop-blur-sm"
          onClick={onClose}
        >
          <div className="flex min-h-full items-center justify-center px-4 py-14">
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={detailId}
              onKeyDown={onKeyDown}
              onClick={(e) => e.stopPropagation()}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7, y: 40, rotate: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="relative w-full max-w-sm"
            >
              {photo && (
                <motion.figure
                  initial={reducedMotion ? { opacity: 0 } : { opacity: 0, rotate: 24, x: 30, y: -10 }}
                  animate={{ opacity: 1, rotate: 7, x: 0, y: 0 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 16, delay: 0.25 }}
                  className="absolute -top-10 right-4 z-20 w-16 rounded-[3px] bg-white p-1 pb-4 shadow-xl sm:-right-12 sm:-top-8 sm:w-28 sm:p-1.5 sm:pb-5"
                >
                  <span aria-hidden="true" className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 -rotate-3 rounded-sm bg-rose-200/80 shadow-sm dark:bg-purple-300/70" />
                  <img
                    src={photo.thumb}
                    width={photo.thumbWidth}
                    height={photo.thumbHeight}
                    alt="One of our photos"
                    decoding="async"
                    className="aspect-[4/5] w-full rounded-[2px] object-cover"
                    style={{ objectPosition: 'center 30%', backgroundColor: photo.color }}
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 text-center font-cursive text-sm leading-5 text-gray-600">us ♡</figcaption>
                </motion.figure>
              )}

              <div className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-[#fffaf6] text-center shadow-2xl dark:border-white/10 dark:bg-[#14151d]">
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400" />
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="absolute left-3 top-3 z-10 rounded-full p-2 text-gray-400 transition hover:bg-rose-50 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className={`relative px-6 pb-6 sm:px-8 ${photo ? 'pt-16 sm:pt-10' : 'pt-10'}`}>
                  <div aria-hidden="true" className={`${styles.sunburst} pointer-events-none absolute left-1/2 top-[-6.5rem] h-[22rem] w-[22rem] -translate-x-1/2 rounded-full`} />
                  <p className="relative text-[11px] font-bold uppercase tracking-[0.3em] text-rose-400 dark:text-purple-300">The wheel has spoken</p>
                  <motion.div
                    initial={reducedMotion ? { opacity: 0 } : { scale: 0, rotate: -40 }}
                    animate={reducedMotion ? { opacity: 1 } : { scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.12 }}
                    className="relative mx-auto my-3 w-fit"
                  >
                    <span aria-hidden="true" className={`${styles.floaty} block text-7xl leading-none drop-shadow-[0_8px_12px_rgba(225,29,72,0.25)] sm:text-8xl`}>
                      {prize.emoji}
                    </span>
                  </motion.div>
                  <h2 id={titleId} className="relative font-serif text-3xl font-bold leading-tight text-gray-900 dark:text-gray-100">
                    {prize.label}
                  </h2>
                  <p id={detailId} className="relative mx-auto mt-2 max-w-xs text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    {prize.detail || 'All yours, whenever you want it.'}
                  </p>
                </div>

                <div aria-hidden="true" className="relative mx-6 flex items-center gap-2 text-rose-300 dark:text-purple-300/60">
                  <span className="h-0 flex-1 border-t-2 border-dashed border-current" />
                  <span className="text-xs">♥</span>
                  <span className="h-0 flex-1 border-t-2 border-dashed border-current" />
                </div>

                <div className="space-y-2.5 px-6 pb-6 pt-5 sm:px-8">
                  <a
                    ref={claimRef}
                    href={whatsappLink(whatsappNumber, claimMessage(prize))}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => {
                      setClaimed(true)
                      sfx.sparkle()
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-500/30 outline-none transition hover:brightness-110 focus-visible:ring-4 focus-visible:ring-rose-300 active:scale-[0.97] dark:from-purple-500 dark:via-fuchsia-500 dark:to-pink-500 dark:focus-visible:ring-purple-400/60"
                  >
                    <MessageCircleHeart className="h-5 w-5" />
                    {claimed ? 'Claimed! Ask again' : 'Claim it'}
                  </a>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={onSpinAgain}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 active:scale-95 dark:bg-white/10 dark:text-purple-100 dark:hover:bg-white/15"
                    >
                      <RotateCcw className="h-4 w-4" /> Spin again
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full bg-gray-100 px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 active:scale-95 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
                    >
                      Save for later
                    </button>
                  </div>
                  <p className="pt-1 font-cursive text-lg text-rose-500 dark:text-purple-200">Valid forever · {fromName}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
