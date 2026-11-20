'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { useInterval } from '@/lib/hooks'
import { formatCountdown, msUntilMidnight, type LetterState } from './logic'
import { TILE_STATE_CLASSES, cx } from './tileStyles'
import styles from './secretWord.module.css'

/* ------------------------------------------------------------------ */
/* Mini word tiles                                                     */
/* ------------------------------------------------------------------ */

interface MiniWordProps {
  word: string
  /** One state for every letter, or one per letter */
  states: LetterState | LetterState[]
  /** Tile edge in px */
  size?: number
  /** Flip the tiles in one after another */
  animate?: boolean
  delayMs?: number
  className?: string
}

export function MiniWord({ word, states, size = 28, animate = false, delayMs = 0, className }: MiniWordProps) {
  return (
    <span className={cx('inline-flex gap-1', className)} role="img" aria-label={word.split('').join(' ')}>
      {word.split('').map((letter, i) => {
        const state = Array.isArray(states) ? states[i] ?? 'absent' : states
        return (
          <span
            key={`${letter}-${i}`}
            aria-hidden="true"
            className={cx(
              'inline-flex items-center justify-center rounded-[22%] font-serif font-bold uppercase leading-none',
              TILE_STATE_CLASSES[state],
              animate && styles.miniFlip,
            )}
            style={{ width: size, height: size, fontSize: size * 0.52, '--delay': `${delayMs + i * 140}ms` } as CSSProperties}
          >
            {letter}
          </span>
        )
      })}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Countdown to midnight                                               */
/* ------------------------------------------------------------------ */

/** "HH:MM:SS" until local midnight, ticking every second. Calls `onExpire` once it hits zero. */
export function useMidnightCountdown(onExpire?: () => void): string {
  const [ms, setMs] = useState(() => msUntilMidnight())
  useInterval(() => {
    const left = msUntilMidnight()
    // The countdown jumps back up to ~24h on the first tick after midnight.
    if (left > ms + 1000) onExpire?.()
    setMs(left)
  }, 1000)
  return formatCountdown(ms)
}

export function Countdown({ onExpire, className }: { onExpire?: () => void; className?: string }) {
  const text = useMidnightCountdown(onExpire)
  return (
    <span className={cx('font-mono tabular-nums', className)} suppressHydrationWarning>
      {text}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Dialog                                                              */
/* ------------------------------------------------------------------ */

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface DialogProps {
  open: boolean
  onClose: () => void
  /** id of the element that names the dialog */
  labelledBy: string
  children: ReactNode
  className?: string
}

/** Small accessible modal: Escape / backdrop to close, focus kept inside, focus restored on close. */
export function Dialog({ open, onClose, labelledBy, children, className }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const panel = panelRef.current
    const first = panel?.querySelector<HTMLElement>('[data-autofocus]') ?? panel?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus({ preventScroll: true })

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null)
      if (items.length === 0) return
      const firstItem = items[0]
      const lastItem = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault()
        lastItem.focus()
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault()
        firstItem.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (previous && previous !== document.body && document.contains(previous)) previous.focus({ preventScroll: true })
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.92 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className={cx(
              'relative max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto overscroll-contain rounded-[2rem] border border-white/60 bg-[#fffaf6] p-5 shadow-2xl sm:p-7 dark:border-white/10 dark:bg-[#14151d]',
              className,
            )}
          >
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400" />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 dark:hover:bg-white/10 dark:hover:text-gray-200 dark:focus-visible:ring-purple-300"
            >
              <X className="h-4 w-4" />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
