'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { formatPhotoDate, type LocalPhoto } from '@/lib/photos'

interface PhotoLightboxProps {
  photos: LocalPhoto[]
  /** Index into `photos`, or null when closed */
  index: number | null
  onClose: () => void
  onIndexChange: (index: number) => void
  reduceMotion: boolean
}

/** Full-size view of the photos from a finished round, with swipe / arrow-key browsing. */
export default function PhotoLightbox({ photos, index, onClose, onIndexChange, reduceMotion }: PhotoLightboxProps) {
  const open = index !== null && photos.length > 0
  const closeRef = useRef<HTMLButtonElement>(null)
  const count = photos.length

  // Keyboard: Escape closes, arrows browse. Focus returns to whatever opened it.
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus()
    return () => previous?.focus()
  }, [open])

  useEffect(() => {
    if (index === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') onIndexChange((index + 1) % count)
      else if (e.key === 'ArrowLeft') onIndexChange((index - 1 + count) % count)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, count, onClose, onIndexChange])

  const photo = index !== null ? photos[index] : null
  const date = photo ? formatPhotoDate(photo.date) : null

  const go = (delta: number) => {
    if (index === null || count === 0) return
    onIndexChange((index + delta + count) % count)
  }

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 || info.velocity.x < -400) go(1)
    else if (info.offset.x > 60 || info.velocity.x > 400) go(-1)
  }

  return (
    <AnimatePresence>
      {open && photo && (
        <motion.div
          key="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Photo from our memories"
          className="fixed inset-0 z-[65] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close photo"
            className="absolute right-3 top-3 z-10 rounded-full bg-white/15 p-2.5 text-white backdrop-blur transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-5 sm:top-5"
          >
            <X className="h-5 w-5" />
          </button>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  go(-1)
                }}
                aria-label="Previous photo"
                className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/15 p-3 text-white backdrop-blur transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:block md:left-6"
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
                className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/15 p-3 text-white backdrop-blur transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:block md:right-6"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <AnimatePresence mode="wait" initial={false}>
            <motion.figure
              key={photo.id}
              onClick={(e) => e.stopPropagation()}
              drag={count > 1 ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={onDragEnd}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, rotate: -4 }}
              animate={{ opacity: 1, scale: 1, rotate: -1.5 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, rotate: 2 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              className="relative max-w-full cursor-grab touch-pan-y rounded-sm bg-white p-2.5 pb-3 shadow-2xl active:cursor-grabbing sm:p-3 sm:pb-4"
            >
              <img
                src={photo.src}
                alt={photo.caption || 'One of our photos'}
                width={photo.width}
                height={photo.height}
                decoding="async"
                draggable={false}
                className="block h-auto max-h-[68vh] w-auto max-w-[min(84vw,900px)] select-none rounded-[2px] bg-cover bg-center"
                style={{ backgroundImage: `url(${photo.blur})`, backgroundColor: photo.color }}
              />
              <figcaption className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-1">
                <span className="font-cursive text-lg leading-tight text-gray-800 sm:text-xl">{photo.caption}</span>
                {date && <span className="text-xs font-medium uppercase tracking-wider text-gray-400">{date}</span>}
              </figcaption>
            </motion.figure>
          </AnimatePresence>

          {count > 1 && (
            <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-xs font-medium tabular-nums text-white/80">
              {(index ?? 0) + 1} / {count}
              <span className="sm:hidden"> · swipe</span>
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
