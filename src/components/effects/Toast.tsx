'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMediaQuery } from '@/lib/hooks'

/**
 * A tiny global toast system.
 *
 *   import { toast } from '@/components/effects/Toast'
 *   toast('Saved your wish', { emoji: '🌠' })
 *
 * `toast()` can be called from anywhere on the client (event handlers, effects,
 * plain modules). <Toaster/> is mounted once in the root layout and shows up
 * to three stacked glass pills: bottom-centre on phones (above the floating
 * controls), top-centre under the navigation on larger screens.
 */

export interface ToastOptions {
  /** Shown in a little bubble before the message */
  emoji?: string
  /** Milliseconds before it fades away (default 3600) */
  duration?: number
  /** Re-using an id replaces that toast instead of stacking a new one */
  id?: string
}

interface ToastItem {
  id: string
  message: string
  emoji?: string
  duration: number
  /** Bumped every time the toast is (re)shown so its timer restarts */
  stamp: number
}

const MAX_VISIBLE = 3
const EMPTY: ToastItem[] = []

let items: ToastItem[] = EMPTY
let counter = 0
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Shows a toast. Returns its id (pass it to `dismissToast` to close it early). */
export function toast(message: string, options: ToastOptions = {}): string {
  if (typeof window === 'undefined') return ''
  counter += 1
  const id = options.id ?? `toast-${counter}`
  const item: ToastItem = {
    id,
    message,
    emoji: options.emoji,
    duration: Math.max(1200, options.duration ?? 3600),
    stamp: counter,
  }
  items = [...items.filter((t) => t.id !== id), item].slice(-MAX_VISIBLE)
  emit()
  return id
}

export function dismissToast(id: string): void {
  if (!items.some((t) => t.id === id)) return
  items = items.filter((t) => t.id !== id)
  emit()
}

function useToasts(): ToastItem[] {
  return useSyncExternalStore(
    subscribe,
    () => items,
    () => EMPTY,
  )
}

export function Toaster() {
  const list = useToasts()
  const desktop = useMediaQuery('(min-width: 768px)')

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 z-[9990] flex flex-col items-center gap-2 px-4 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] md:bottom-auto md:top-24 md:flex-col-reverse"
    >
      <AnimatePresence initial={false}>
        {list.map((item) => (
          <ToastPill key={item.id} item={item} fromTop={desktop} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastPill({ item, fromTop }: { item: ToastItem; fromTop: boolean }) {
  const [paused, setPaused] = useState(false)
  const remaining = useRef(item.duration)
  const lastStamp = useRef(item.stamp)

  useEffect(() => {
    if (lastStamp.current !== item.stamp) {
      lastStamp.current = item.stamp
      remaining.current = item.duration
    }
    if (paused) return
    const startedAt = Date.now()
    const timer = window.setTimeout(() => dismissToast(item.id), Math.max(0, remaining.current))
    return () => {
      window.clearTimeout(timer)
      remaining.current -= Date.now() - startedAt
    }
  }, [paused, item.id, item.stamp, item.duration])

  const offset = fromTop ? -18 : 18

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: offset, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onClick={() => dismissToast(item.id)}
      data-no-burst
      className={`pointer-events-auto flex max-w-[min(26rem,calc(100vw-2rem))] cursor-pointer select-none items-center gap-3 rounded-[1.4rem] border border-rose-100/90 bg-white/85 py-2 pr-4 text-sm leading-snug text-gray-800 shadow-[0_12px_40px_-14px_rgba(244,63,94,0.5)] backdrop-blur-xl dark:border-white/10 dark:bg-[#15161f]/85 dark:text-gray-100 dark:shadow-[0_12px_40px_-14px_rgba(168,85,247,0.6)] ${
        item.emoji ? 'pl-2' : 'pl-4'
      }`}
    >
      {item.emoji && (
        <span
          aria-hidden="true"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-linear-to-br from-rose-100 to-amber-50 text-base dark:from-purple-500/30 dark:to-fuchsia-500/10"
        >
          {item.emoji}
        </span>
      )}
      <span className="min-w-0 py-1 font-medium [overflow-wrap:anywhere]">{item.message}</span>
    </motion.div>
  )
}
