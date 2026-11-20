'use client'

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'
import { AnimatePresence, motion, useIsPresent, type Variants } from 'framer-motion'
import { ChevronLeft, ChevronRight, Heart, Sparkles, X } from 'lucide-react'
import type { Letter } from '@/data/initialData'
import { usePrefersReducedMotion } from '@/lib/hooks'
import { formatLetterDate, trapTabKey, useBodyScrollLock } from './letterUtils'
import { useTypewriter } from './useTypewriter'
import styles from './letters.module.css'

export interface OriginRect {
  left: number
  top: number
  width: number
  height: number
}

interface LetterReaderProps {
  letters: Letter[]
  index: number
  /** Where the envelope sits on screen, so the paper can grow out of it and fly back into it. */
  origin: OriginRect | null
  fromName: string
  onClose: () => void
  onNavigate: (index: number) => void
}

const TITLE_ID = 'letter-reader-title'

function originTransform(origin: OriginRect | null) {
  if (!origin || typeof window === 'undefined') return null
  const paperWidth = Math.min(672, window.innerWidth - 24)
  return {
    x: origin.left + origin.width / 2 - window.innerWidth / 2,
    y: origin.top + origin.height / 2 - window.innerHeight / 2,
    scale: Math.max(0.18, Math.min(0.85, origin.width / paperWidth)),
    rotate: -3,
    opacity: 0,
  }
}

export default function LetterReader({ letters, index, origin, fromName, onClose, onNavigate }: LetterReaderProps) {
  const reduce = usePrefersReducedMotion()
  // False while the reader is animating away; ignore input then so it can't reopen mid-exit.
  const isPresent = useIsPresent()
  const letter = letters[index]
  const dialogRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [direction, setDirection] = useState(0)
  const [fromVars] = useState(() => originTransform(origin))
  const swipeRef = useRef<{ x: number; y: number; id: number } | null>(null)
  const swipedRef = useRef(false)

  useBodyScrollLock(true)

  const hasPrev = index > 0
  const hasNext = index < letters.length - 1

  const go = (delta: number) => {
    const next = index + delta
    if (!isPresent || delta === 0 || next < 0 || next >= letters.length) return
    setDirection(delta)
    onNavigate(next)
  }

  // Keyboard: Escape closes, arrows flip between letters, Tab stays inside.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isPresent) return
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowRight' && !e.altKey && !e.metaKey) {
        go(1)
      } else if (e.key === 'ArrowLeft' && !e.altKey && !e.metaKey) {
        go(-1)
      } else if (e.key === 'Tab') {
        trapTabKey(e, dialogRef.current)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [letter?.id])

  if (!letter) return null

  const exitTarget = reduce ? { opacity: 0 } : (originTransform(origin) ?? { opacity: 0, y: 30, scale: 0.96 })
  const initialTarget = reduce ? { opacity: 0 } : (fromVars ?? { opacity: 0, y: 30, scale: 0.96 })

  // Swipe left / right on touch screens to change letters.
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse') return
    swipeRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
    swipedRef.current = false
  }
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const start = swipeRef.current
    swipeRef.current = null
    if (!start || start.id !== e.pointerId) return
    const dx = e.clientX - start.x
    const dy = e.clientY - start.y
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) {
      swipedRef.current = true
      go(dx < 0 ? 1 : -1)
    }
  }

  const slide = reduce ? 0 : 60
  const articleVariants: Variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * slide }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -slide }),
  }

  return (
    <motion.div
      className={`fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6 ${isPresent ? '' : 'pointer-events-none'}`}
      initial={{ opacity: 1 }}
      exit={{ opacity: 1 }}
    >
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 touch-none bg-[#2b1420]/45 backdrop-blur-[3px] dark:bg-black/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.3 } }}
        onClick={onClose}
      />

      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        initial={initialTarget}
        animate={{ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }}
        exit={{ ...exitTarget, transition: { duration: reduce ? 0.15 : 0.36, ease: [0.4, 0, 0.2, 1] } }}
        transition={reduce ? { duration: 0.2 } : { type: 'spring', stiffness: 230, damping: 27, mass: 0.9 }}
        className={`${styles.paper} relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[22px] sm:max-h-[calc(100dvh-3rem)]`}
      >
        <span className={`${styles.margin} hidden sm:block`} aria-hidden="true" />

        {/* Top bar */}
        <div className="relative flex items-center justify-between gap-3 px-5 pb-1 pt-4 sm:pl-16 sm:pr-6 sm:pt-5">
          <p className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-400 dark:text-purple-300">
            No. {String(index + 1).padStart(2, '0')}
            {letter.occasion.trim() && <span className="text-rose-300 dark:text-purple-300/70"> · {letter.occasion}</span>}
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close letter"
            className="-mr-1 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/70 text-gray-500 shadow-sm ring-1 ring-rose-100 transition hover:rotate-90 hover:bg-white hover:text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 dark:bg-white/10 dark:text-gray-300 dark:ring-white/10 dark:hover:bg-white/20 dark:hover:text-purple-200 dark:focus-visible:ring-purple-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Letter */}
        <div
          ref={scrollRef}
          className="relative flex-1 touch-pan-y overflow-y-auto overscroll-contain px-5 pb-8 sm:pl-16 sm:pr-10"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            swipeRef.current = null
          }}
        >
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.article
              key={letter.id}
              custom={direction}
              variants={articleVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: reduce ? 0.12 : 0.28, ease: [0.4, 0, 0.2, 1] }}
            >
              <LetterContent letter={letter} fromName={fromName} instant={reduce} scrollRef={scrollRef} swipedRef={swipedRef} />
            </motion.article>
          </AnimatePresence>
        </div>

        {/* Footer: previous / next */}
        {letters.length > 1 && (
          <div className="relative flex items-center justify-between gap-2 border-t border-rose-100/80 bg-white/40 px-3 py-2.5 backdrop-blur-sm sm:px-6 dark:border-white/10 dark:bg-white/[0.03]">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={!hasPrev}
              aria-label="Previous letter"
              className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full px-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:pointer-events-none disabled:opacity-30 dark:text-purple-200 dark:hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <div className="flex min-w-0 items-center gap-1.5" aria-label={`Letter ${index + 1} of ${letters.length}`} role="group">
              {letters.length <= 9 ? (
                letters.map((l, i) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => go(i - index)}
                    aria-label={`Go to letter ${i + 1}`}
                    aria-current={i === index ? 'true' : undefined}
                    className="grid h-6 w-5 place-items-center"
                  >
                    <span
                      className={`block h-1.5 rounded-full transition-all duration-300 ${
                        i === index ? 'w-5 bg-rose-500 dark:bg-purple-300' : 'w-1.5 bg-rose-200 hover:bg-rose-300 dark:bg-white/20 dark:hover:bg-white/40'
                      }`}
                    />
                  </button>
                ))
              ) : (
                <span className="text-xs font-semibold tabular-nums text-gray-500 dark:text-gray-400">
                  {index + 1} / {letters.length}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => go(1)}
              disabled={!hasNext}
              aria-label="Next letter"
              className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full px-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:pointer-events-none disabled:opacity-30 dark:text-purple-200 dark:hover:bg-white/10"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

interface LetterContentProps {
  letter: Letter
  fromName: string
  instant: boolean
  scrollRef: RefObject<HTMLDivElement | null>
  swipedRef: RefObject<boolean>
}

function LetterContent({ letter, fromName, instant, scrollRef, swipedRef }: LetterContentProps) {
  const text = letter.content.trim() || 'This letter is still being written… check back soon, my love.'
  const { visible, rest, done, skip } = useTypewriter(text, { instant })
  const caretRef = useRef<HTMLSpanElement>(null)
  const followRef = useRef(true)
  const dateLabel = formatLetterDate(letter.date)
  const title = letter.title.trim() || 'A letter for you'

  // Stop auto-following the text as soon as she scrolls herself.
  useEffect(() => {
    const box = scrollRef.current
    if (!box) return
    const stop = () => {
      followRef.current = false
    }
    box.addEventListener('wheel', stop, { passive: true })
    box.addEventListener('touchmove', stop, { passive: true })
    box.addEventListener('keydown', stop)
    return () => {
      box.removeEventListener('wheel', stop)
      box.removeEventListener('touchmove', stop)
      box.removeEventListener('keydown', stop)
    }
  }, [scrollRef])

  // Keep the caret in view while typing.
  useEffect(() => {
    if (done || !followRef.current) return
    const box = scrollRef.current
    const caret = caretRef.current
    if (!box || !caret) return
    const b = box.getBoundingClientRect()
    const c = caret.getBoundingClientRect()
    const limit = b.bottom - 56
    if (c.bottom > limit) box.scrollTop += c.bottom - limit
  }, [visible.length, done, scrollRef])

  const handleClick = () => {
    if (swipedRef.current) {
      swipedRef.current = false
      return
    }
    if (!done) skip()
  }

  return (
    <div className="relative" onClick={handleClick}>
      <h2 id={TITLE_ID} className="break-words pr-2 pt-2 font-cursive text-[2.2rem] leading-[1.1] text-rose-600 sm:text-5xl dark:text-purple-200">
        {title}
      </h2>
      {dateLabel && (
        <p className="mt-2 font-serif text-sm italic text-rose-900/60 dark:text-purple-100/60">{dateLabel}</p>
      )}

      <div className="mt-6 flex items-center gap-3 text-rose-300 dark:text-purple-300/50" aria-hidden="true">
        <span className="h-px flex-1 bg-current opacity-60" />
        <Heart className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
        <span className="h-px flex-1 bg-current opacity-60" />
      </div>

      <p className="sr-only">{text}</p>
      <p
        aria-hidden="true"
        className={`${styles.ruled} mt-4 whitespace-pre-wrap break-words font-serif text-[1.04rem] text-[#4a3434] sm:text-[1.1rem] dark:text-[#e6dff3]`}
      >
        {visible}
        {!done && <span ref={caretRef} className={styles.caret} />}
        <span className="invisible">{rest}</span>
      </p>

      <motion.div
        initial={false}
        animate={{ opacity: done ? 1 : 0, y: done ? 0 : 10 }}
        transition={{ duration: instant ? 0 : 0.6, ease: 'easeOut' }}
        className="mt-8 flex flex-col items-end text-right"
      >
        <p className="font-serif text-sm italic text-gray-500 dark:text-gray-400">Forever yours,</p>
        <p className="font-cursive text-4xl leading-tight text-rose-600 sm:text-5xl dark:text-purple-200">{fromName}</p>
        <Heart className="mt-1 h-4 w-4 text-rose-400 dark:text-purple-300" fill="currentColor" strokeWidth={0} aria-hidden="true" />
      </motion.div>

      {!done && (
        <div className="pointer-events-none sticky bottom-2 z-10 mt-4 flex justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              skip()
            }}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-rose-500 shadow-lg ring-1 ring-rose-100 backdrop-blur transition hover:bg-white active:scale-95 dark:bg-[#1f1d2b]/90 dark:text-purple-200 dark:ring-white/10"
          >
            <Sparkles className="h-3.5 w-3.5" /> Tap to read it all
          </button>
        </div>
      )}
    </div>
  )
}
