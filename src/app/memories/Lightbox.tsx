'use client'

import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useReducedMotion, type PanInfo } from 'framer-motion'
import { CalendarHeart, ChevronLeft, ChevronRight, Download, Heart, X } from 'lucide-react'
import { sfx } from '@/lib/sound'
import { burstFromElement } from '@/lib/celebrate'
import { useFavourites } from './favourites'
import { useBodyScrollLock } from './useBodyScrollLock'
import type { ViewerItem } from './viewerItems'

interface LightboxProps {
  items: ViewerItem[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
}

// The invisible backdrop <button tabIndex={-1}> must not count, or Tab would wrap onto it.
const FOCUSABLE = 'a[href], button:not([disabled]):not([tabindex="-1"]), video[controls], [tabindex]:not([tabindex="-1"])'

/** Full-screen photo viewer shared by Memory Lane, the album and the hero. */
export default function Lightbox({ items, index, onIndexChange, onClose }: LightboxProps) {
  const reduceMotion = useReducedMotion() ?? false
  const { isFavourite, toggle } = useFavourites()
  const [direction, setDirection] = useState(0)
  const [heartPop, setHeartPop] = useState(0)
  const [loadedSrc, setLoadedSrc] = useState<Record<string, boolean>>({})
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const favRef = useRef<HTMLButtonElement>(null)
  const photoRef = useRef<HTMLDivElement>(null)
  const fullImgRef = useRef<HTMLImageElement>(null)
  const lastTap = useRef(0)
  const draggedAt = useRef(0)
  const portalTarget = typeof document !== 'undefined' ? document.body : null

  const count = items.length
  const safeIndex = Math.min(Math.max(index, 0), Math.max(count - 1, 0))
  const item = items[safeIndex]
  const fav = item ? isFavourite(item.id) : false

  useBodyScrollLock(true)

  const go = useCallback(
    (delta: number) => {
      if (count < 2) return
      setDirection(delta)
      sfx.tick()
      onIndexChange((safeIndex + delta + count) % count)
    },
    [count, safeIndex, onIndexChange],
  )

  const toggleFavourite = useCallback(
    (fromDoubleTap = false) => {
      if (!item) return
      if (fromDoubleTap && isFavourite(item.id)) {
        // Double-tapping something already loved just replays the heart.
        sfx.pop()
        setHeartPop((n) => n + 1)
        return
      }
      const nowFav = toggle(item.id)
      if (nowFav) {
        sfx.pop()
        setHeartPop((n) => n + 1)
        burstFromElement(favRef.current, { hearts: true, particleCount: 18, spread: 60 })
      } else {
        sfx.tick()
      }
    },
    [item, isFavourite, toggle],
  )

  // Focus the close button on open, restore focus on close.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus({ preventScroll: true })
    return () => {
      previous?.focus?.({ preventScroll: true })
    }
  }, [])

  // Keyboard: arrows, escape, focus trap.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Let a focused video keep its own arrow-key seeking.
      const onVideo = e.target instanceof HTMLVideoElement
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowRight' && !onVideo) {
        e.preventDefault()
        go(1)
      } else if (e.key === 'ArrowLeft' && !onVideo) {
        e.preventDefault()
        go(-1)
      } else if (e.key === 'Tab' && dialogRef.current) {
        const nodes = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null)
        if (nodes.length === 0) return
        const first = nodes[0]
        const last = nodes[nodes.length - 1]
        if (!dialogRef.current.contains(document.activeElement)) {
          // Focus fell out (e.g. the focused slide was swapped out): bring it back inside.
          e.preventDefault()
          ;(e.shiftKey ? last : first).focus()
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, onClose])

  // Preload the neighbours so swiping feels instant.
  useEffect(() => {
    if (count < 2) return
    ;[1, -1].forEach((d) => {
      const n = items[(safeIndex + d + count) % count]
      if (n && n.kind === 'image') {
        const img = new Image()
        img.decoding = 'async'
        img.src = n.src
      }
    })
  }, [safeIndex, items, count])

  function handleDragEnd(_: unknown, info: PanInfo) {
    const { offset, velocity } = info
    if (Math.abs(offset.y) > Math.abs(offset.x)) {
      if (offset.y > 110 || velocity.y > 700) onClose()
      return
    }
    if (offset.x < -70 || velocity.x < -500) go(1)
    else if (offset.x > 70 || velocity.x > 500) go(-1)
  }

  /** Is a viewport point on the visible (object-contain) picture, rather than the empty space around it? */
  function isOnPhoto(x: number, y: number): boolean {
    const box = photoRef.current
    const img = fullImgRef.current
    if (!box) return true
    const iw = item?.width || img?.naturalWidth || 0
    const ih = item?.height || img?.naturalHeight || 0
    if (!iw || !ih) return true
    const r = box.getBoundingClientRect()
    const scale = Math.min(r.width / iw, r.height / ih)
    const w = iw * scale
    const h = ih * scale
    const left = r.left + (r.width - w) / 2
    const top = r.top + (r.height - h) / 2
    return x >= left - 8 && x <= left + w + 8 && y >= top - 8 && y <= top + h + 8
  }

  function handleTap(event: MouseEvent | TouchEvent | PointerEvent) {
    // Enter on the focused photo is handled by onKeyDown, and a swipe is not a tap.
    if (!event.isTrusted || Date.now() - draggedAt.current < 350) return
    const point = 'changedTouches' in event ? event.changedTouches[0] : event
    if (point && !isOnPhoto(point.clientX, point.clientY)) {
      // A tap on the dark space beside the photo closes, just like the backdrop.
      onClose()
      return
    }
    const now = Date.now()
    if (now - lastTap.current < 320) {
      lastTap.current = 0
      toggleFavourite(true)
    } else {
      lastTap.current = now
    }
  }

  if (!portalTarget || !item) return null

  const ambient = item.blur || item.thumb
  const slide = reduceMotion
    ? { enter: { opacity: 0 }, center: { opacity: 1, x: 0, scale: 1 }, exit: { opacity: 0 } }
    : {
        enter: (d: number) => ({ opacity: 0, x: d >= 0 ? 80 : -80, scale: 0.96 }),
        center: { opacity: 1, x: 0, scale: 1 },
        exit: (d: number) => ({ opacity: 0, x: d >= 0 ? -80 : 80, scale: 0.96 }),
      }

  const onDialogKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    // Space on the photo area toggles the heart, like a double tap.
    if ((e.key === ' ' || e.key === 'Enter') && e.target === e.currentTarget) {
      e.preventDefault()
      toggleFavourite()
    }
  }

  return createPortal(
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Memory ${safeIndex + 1} of ${count}`}
      data-memories-lightbox=""
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[90] flex flex-col overflow-hidden bg-[#07070b]/95 text-white"
    >
      {/* ambient colour from the photo */}
      <AnimatePresence initial={false}>
        {ambient && (
          <motion.div
            key={ambient}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="pointer-events-none absolute inset-0 scale-125 bg-cover bg-center blur-3xl"
            style={{ backgroundImage: `url("${ambient}")` }}
          />
        )}
      </AnimatePresence>
      {/* clicking the dark backdrop closes the viewer */}
      <button type="button" aria-hidden="true" tabIndex={-1} onClick={onClose} className="absolute inset-0 cursor-default" />

      {/* top bar */}
      <div className="pointer-events-none relative z-10 flex items-center justify-between gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:pt-5">
        <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold tabular-nums tracking-wider text-white/85 backdrop-blur-md">
          {safeIndex + 1} / {count}
        </span>
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          <button
            ref={favRef}
            type="button"
            onClick={() => toggleFavourite()}
            aria-pressed={fav}
            aria-label={fav ? 'Remove from favourites' : 'Add to favourites'}
            className={`rounded-full p-2.5 backdrop-blur-md transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
              fav ? 'bg-rose-500/90 text-white' : 'bg-white/10 text-white/85'
            }`}
          >
            <Heart className={`h-5 w-5 ${fav ? 'fill-current' : ''}`} />
          </button>
          <a
            href={item.src}
            download={item.downloadName}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download this memory"
            className="rounded-full bg-white/10 p-2.5 text-white/85 backdrop-blur-md transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <Download className="h-5 w-5" />
          </a>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close viewer"
            className="rounded-full bg-white/10 p-2.5 text-white backdrop-blur-md transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* stage */}
      <div className="pointer-events-none relative z-0 min-h-0 flex-1 px-2 py-3 sm:px-20 sm:py-5">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={item.id}
            custom={direction}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduceMotion ? 0.2 : 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-2 inset-y-3 flex items-center justify-center sm:inset-x-20 sm:inset-y-5"
          >
            {item.kind === 'video' ? (
              <video
                key={item.src}
                src={item.src}
                controls
                autoPlay
                playsInline
                className="pointer-events-auto max-h-full max-w-full rounded-xl bg-black shadow-2xl"
              />
            ) : (
              <motion.div
                ref={(el: HTMLDivElement | null) => {
                  // Only ever point at the newest slide (an exiting one may unmount after it).
                  if (el) photoRef.current = el
                }}
                drag={count > 1 ? true : 'y'}
                dragDirectionLock
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0.7}
                dragSnapToOrigin
                onDragStart={() => {
                  draggedAt.current = Date.now()
                }}
                onDragEnd={(e, info) => {
                  draggedAt.current = Date.now()
                  handleDragEnd(e, info)
                }}
                onTap={handleTap}
                tabIndex={0}
                role="img"
                aria-label={`${item.title || 'Memory'}${item.dateLabel ? `, ${item.dateLabel}` : ''}. Double tap to love it.`}
                onKeyDown={onDialogKeyDown}
                className="pointer-events-auto relative h-full w-full cursor-grab touch-none select-none focus-visible:outline-none active:cursor-grabbing"
              >
                {item.thumb && !loadedSrc[item.src] && (
                  <img
                    src={item.thumb}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    className="absolute inset-0 h-full w-full object-contain blur-[2px]"
                  />
                )}
                <img
                  ref={(el) => {
                    if (el) fullImgRef.current = el
                  }}
                  src={item.src}
                  alt={item.title}
                  draggable={false}
                  decoding="async"
                  onLoad={() => setLoadedSrc((prev) => ({ ...prev, [item.src]: true }))}
                  className={`absolute inset-0 h-full w-full object-contain drop-shadow-[0_25px_45px_rgba(0,0,0,0.55)] transition-opacity duration-500 ${
                    loadedSrc[item.src] || !item.thumb ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* double-tap heart */}
        <AnimatePresence>
          {heartPop > 0 && (
            <motion.div
              key={heartPop}
              aria-hidden="true"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0.4, 1.15, 1, 1.25] }}
              transition={{ duration: 0.9, times: [0, 0.25, 0.6, 1] }}
              onAnimationComplete={() => setHeartPop(0)}
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <Heart className="h-28 w-28 fill-rose-500 text-rose-500 drop-shadow-[0_0_30px_rgba(244,63,94,0.8)]" />
            </motion.div>
          )}
        </AnimatePresence>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous memory"
              className="pointer-events-auto absolute left-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-md transition hover:scale-105 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:block"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next memory"
              className="pointer-events-auto absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-md transition hover:scale-105 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:block"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {/* caption */}
      <div className="pointer-events-none relative z-10 flex items-end gap-2 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:justify-center sm:px-6 sm:pb-6">
        {count > 1 && (
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous memory"
            className="pointer-events-auto mb-1 shrink-0 rounded-full bg-white/10 p-2.5 text-white backdrop-blur-md transition active:scale-95 sm:hidden"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="min-w-0 flex-1 text-center sm:max-w-2xl sm:flex-none"
          >
            {item.title && <p className="truncate font-serif text-lg font-semibold sm:text-2xl">{item.title}</p>}
            <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-white/70 sm:text-sm">
              <CalendarHeart className="h-3.5 w-3.5" />
              {item.dateLabel ?? 'Somewhere in time'}
            </p>
            {item.description && (
              <p className="mx-auto mt-2 line-clamp-3 max-w-xl text-sm italic leading-relaxed text-white/80">“{item.description}”</p>
            )}
            <p className="mt-1 hidden text-[11px] text-white/40 sm:block">← → to browse · double-click to love · Esc to close</p>
          </motion.div>
        </AnimatePresence>
        {count > 1 && (
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next memory"
            className="pointer-events-auto mb-1 shrink-0 rounded-full bg-white/10 p-2.5 text-white backdrop-blur-md transition active:scale-95 sm:hidden"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </motion.div>,
    portalTarget,
  )
}
