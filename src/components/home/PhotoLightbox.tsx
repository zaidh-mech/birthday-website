'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { ChevronLeft, ChevronRight, Heart, X } from 'lucide-react'
import { formatPhotoDate } from '@/lib/photos'
import { useMounted } from '@/lib/hooks'
import { sfx } from '@/lib/sound'
import type { ViewerPhoto } from './types'

interface PhotoLightboxProps {
  items: ViewerPhoto[]
  /** Open at this index; null = closed */
  index: number | null
  onClose: () => void
  onIndexChange: (index: number) => void
}

const SWIPE_DISTANCE = 60
const SWIPE_VELOCITY = 450

const slide = {
  enter: (dir: number) => ({ x: dir * 90, opacity: 0, rotate: dir * 2, scale: 0.96 }),
  center: { x: 0, opacity: 1, rotate: 0, scale: 1 },
  exit: (dir: number) => ({ x: dir * -90, opacity: 0, rotate: dir * -2, scale: 0.96 }),
}

/**
 * Full-screen photo viewer: prev/next buttons, arrow keys, Escape, swipe on
 * touch, body scroll lock and a simple focus trap. Rendered in a portal so no
 * transformed ancestor can trap the fixed overlay.
 */
export default function PhotoLightbox({ items, index, onClose, onIndexChange }: PhotoLightboxProps) {
  const mounted = useMounted()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  // A mouse swipe that ends off the photo fires its click on the backdrop; that must not close the viewer.
  const pressedPhoto = useRef(false)
  const [dir, setDir] = useState(0)
  const open = index !== null && items.length > 0
  const current = open ? items[((index % items.length) + items.length) % items.length] : null
  const count = items.length

  const go = useCallback(
    (delta: number) => {
      if (index === null || count < 2) return
      setDir(delta)
      onIndexChange((index + delta + count) % count)
      sfx.flip()
    },
    [index, count, onIndexChange],
  )

  // Keyboard: arrows, Escape, and keep Tab inside the dialog.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        go(1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        go(-1)
      } else if (e.key === 'Tab' && dialogRef.current) {
        const focusables = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled])'))
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        const active = document.activeElement
        if (e.shiftKey && (active === first || !dialogRef.current.contains(active))) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && (active === last || !dialogRef.current.contains(active))) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, go, onClose])

  // Lock page scroll while open. html keeps a stable scrollbar gutter, so nothing jumps.
  useEffect(() => {
    if (!open) return
    const body = document.body
    const prevOverflow = body.style.overflow
    body.style.overflow = 'hidden'
    return () => {
      body.style.overflow = prevOverflow
    }
  }, [open])

  // Move focus into the dialog, and give it back when it closes.
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus({ preventScroll: true })
    return () => previous?.focus({ preventScroll: true })
  }, [open])

  // Warm up the neighbours so next/prev feel instant.
  useEffect(() => {
    if (index === null || count < 2) return
    for (const delta of [1, -1]) {
      const item = items[(index + delta + count) % count]
      if (item) {
        const img = new Image()
        img.decoding = 'async'
        img.src = item.src
      }
    }
  }, [index, items, count])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) go(1)
    else if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY) go(-1)
  }

  if (!mounted) return null

  const dateLabel = current ? formatPhotoDate(current.date ?? null) : null
  const position = index === null ? 0 : (((index % count) + count) % count) + 1

  return createPortal(
    <AnimatePresence>
      {open && current && (
        <motion.div
          ref={dialogRef}
          key="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onPointerDownCapture={() => {
            pressedPhoto.current = false
          }}
          onClick={() => {
            if (!pressedPhoto.current) onClose()
          }}
          className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-black/80 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-md sm:px-6"
        >
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close photo"
            className="absolute right-3 top-3 z-10 rounded-full bg-white/15 p-2.5 text-white backdrop-blur-md transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40 sm:right-5 sm:top-5"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative flex min-h-0 w-full max-w-5xl flex-1 items-center justify-center">
            <AnimatePresence initial={false} custom={dir} mode="popLayout">
              <motion.figure
                key={current.id}
                custom={dir}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                drag={count > 1 ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={onDragEnd}
                onPointerDown={() => {
                  pressedPhoto.current = true
                }}
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-full max-w-full cursor-grab touch-pan-y flex-col items-center rounded-[4px] bg-white p-2 pb-3 shadow-2xl active:cursor-grabbing sm:p-3 sm:pb-4"
              >
                <img
                  src={current.src}
                  alt={current.caption || 'One of our photos'}
                  draggable={false}
                  decoding="async"
                  className="block h-auto max-h-[calc(100dvh-11.5rem)] w-auto max-w-[min(88vw,64rem)] select-none rounded-[2px] object-contain sm:max-h-[calc(100dvh-12.5rem)]"
                />
                {(current.caption || dateLabel) && (
                  <figcaption className="mt-2 max-w-[min(80vw,40rem)] px-2 text-center">
                    {current.caption && (
                      <span className="flex items-center justify-center gap-1.5 font-cursive text-lg leading-tight text-gray-800 sm:text-2xl">
                        <Heart className="h-3.5 w-3.5 shrink-0 fill-rose-400 text-rose-400" aria-hidden />
                        {current.caption}
                      </span>
                    )}
                    {dateLabel && <span className="mt-0.5 block text-[11px] uppercase tracking-[0.2em] text-gray-400">{dateLabel}</span>}
                  </figcaption>
                )}
              </motion.figure>
            </AnimatePresence>

            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    go(-1)
                  }}
                  aria-label="Previous photo"
                  className="absolute left-0 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/15 p-3 text-white backdrop-blur-md transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40 md:block lg:-left-6"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    go(1)
                  }}
                  aria-label="Next photo"
                  className="absolute right-0 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/15 p-3 text-white backdrop-blur-md transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40 md:block lg:-right-6"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {count > 1 && (
            <div className="mt-3 flex w-full max-w-sm items-center justify-between gap-2 text-white" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => go(-1)}
                className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3.5 py-2 text-xs font-semibold transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden /> Previous
              </button>
              <span className="font-mono text-xs tabular-nums text-white/80" aria-live="polite">
                {position} / {count}
              </span>
              <button
                type="button"
                onClick={() => go(1)}
                className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3.5 py-2 text-xs font-semibold transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
              >
                Next <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
