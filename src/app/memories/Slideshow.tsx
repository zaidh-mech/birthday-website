'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { motion, AnimatePresence, useInView, useMotionValue, useReducedMotion, type PanInfo } from 'framer-motion'
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Music, Pause, Play } from 'lucide-react'
import { playHappyBirthday, sfx, stopMelody } from '@/lib/sound'
import { useBodyScrollLock } from './useBodyScrollLock'
import type { ViewerItem } from './viewerItems'
import styles from './memories.module.css'

const SLIDE_MS = 6000
const FADE_S = 1.2

/** Pan/zoom directions, cycled per slide so no two neighbours move the same way. */
const KEN_BURNS = [
  { x0: '-3%', y0: '2%', s0: 1.02, x1: '3%', y1: '-2%', s1: 1.14 },
  { x0: '3%', y0: '-2%', s0: 1.14, x1: '-2%', y1: '2%', s1: 1.03 },
  { x0: '0%', y0: '3%', s0: 1.03, x1: '0%', y1: '-3%', s1: 1.16 },
  { x0: '-2%', y0: '-3%', s0: 1.15, x1: '2%', y1: '1%', s1: 1.04 },
  { x0: '2%', y0: '2%', s0: 1.04, x1: '-3%', y1: '-1%', s1: 1.13 },
  { x0: '0%', y0: '-2%', s0: 1.16, x1: '0%', y1: '2%', s1: 1.02 },
]

function subscribeVisibility(onChange: () => void) {
  document.addEventListener('visibilitychange', onChange)
  return () => document.removeEventListener('visibilitychange', onChange)
}
const isPageVisible = () => document.visibilityState !== 'hidden'

interface SlideshowProps {
  items: ViewerItem[]
  /** true while something else (e.g. the lightbox) is on top — pauses playback and keys */
  suspended: boolean
}

export default function Slideshow({ items, suspended }: SlideshowProps) {
  const reduceMotion = useReducedMotion() ?? false
  const count = items.length
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [music, setMusic] = useState(false)
  const [nativeFs, setNativeFs] = useState(false)
  const [pseudoFs, setPseudoFs] = useState(false)
  const [flash, setFlash] = useState<{ id: number; kind: 'play' | 'pause' } | null>(null)
  const progress = useMotionValue(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const panned = useRef(false)
  const inView = useInView(wrapperRef, { amount: 0.35 })
  // A hidden browser tab pauses everything (the RAF already stops; the Ken Burns CSS and the music box must too).
  const pageVisible = useSyncExternalStore(subscribeVisibility, isPageVisible, () => true)

  const fullscreen = nativeFs || pseudoFs
  const active = playing && !suspended && pageVisible && (inView || fullscreen) && count > 1
  const safeIndex = count ? Math.min(index, count - 1) : 0
  const item = items[safeIndex]

  useBodyScrollLock(pseudoFs)

  const goTo = useCallback(
    (i: number) => {
      if (!count) return
      progress.set(0)
      setIndex(((i % count) + count) % count)
    },
    [count, progress],
  )

  const step = useCallback(
    (delta: number) => {
      sfx.tick()
      goTo(safeIndex + delta)
    },
    [goTo, safeIndex],
  )

  const togglePlay = useCallback(() => {
    const next = !playing
    setPlaying(next)
    setFlash({ id: Date.now(), kind: next ? 'play' : 'pause' })
    sfx.tick()
  }, [playing])

  // Autoplay timer: one RAF loop that drives the progress bar and advances slides.
  useEffect(() => {
    if (!active) return
    let raf = 0
    let last = performance.now()
    let elapsed = progress.get() * SLIDE_MS
    const loop = (now: number) => {
      // Cap each frame so time spent in a background tab doesn't count.
      elapsed += Math.max(0, Math.min(now - last, 100))
      last = now
      progress.set(Math.min(1, elapsed / SLIDE_MS))
      if (elapsed >= SLIDE_MS) {
        progress.set(0)
        setIndex((i) => (i + 1) % count)
        return
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [active, safeIndex, count, progress])

  // Preload the next two photos.
  useEffect(() => {
    if (count < 2) return
    ;[1, 2].forEach((d) => {
      const n = items[(safeIndex + d) % count]
      if (n) {
        const img = new Image()
        img.decoding = 'async'
        img.src = n.src
      }
    })
  }, [safeIndex, items, count])

  // "With music": loop the music box while playing.
  useEffect(() => {
    if (!music || !playing || suspended || !pageVisible) return
    let timer = 0
    const play = () => {
      const duration = playHappyBirthday()
      if (duration > 0) timer = window.setTimeout(play, duration + 1600)
    }
    play()
    return () => {
      window.clearTimeout(timer)
      stopMelody()
    }
  }, [music, playing, suspended, pageVisible])

  // Native fullscreen bookkeeping.
  useEffect(() => {
    const onChange = () => setNativeFs(document.fullscreenElement === wrapperRef.current && document.fullscreenElement !== null)
    document.addEventListener('fullscreenchange', onChange)
    const wrapper = wrapperRef.current
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      if (wrapper && document.fullscreenElement === wrapper) void document.exitFullscreen().catch(() => {})
    }
  }, [])

  const toggleFullscreen = useCallback(async () => {
    sfx.tick()
    if (nativeFs) {
      await document.exitFullscreen().catch(() => {})
      return
    }
    if (pseudoFs) {
      setPseudoFs(false)
      return
    }
    const el = wrapperRef.current
    if (el && document.fullscreenEnabled && typeof el.requestFullscreen === 'function') {
      try {
        await el.requestFullscreen()
        return
      } catch {
        /* fall back to the in-page version below */
      }
    }
    setPseudoFs(true)
  }, [nativeFs, pseudoFs])

  // Keyboard: ← → to browse, Space/K to play-pause, F for fullscreen, Esc leaves the in-page fullscreen.
  useEffect(() => {
    if (suspended) return
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target instanceof Element ? e.target : null
      if (target?.closest('input, textarea, select, [contenteditable="true"], [role="tab"]')) return
      if (!fullscreen && !inView) return
      const onControl = Boolean(target?.closest('button, a'))
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        step(1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        step(-1)
      } else if ((e.key === ' ' || e.key.toLowerCase() === 'k') && !onControl) {
        e.preventDefault()
        togglePlay()
      } else if (e.key.toLowerCase() === 'f' && !onControl) {
        e.preventDefault()
        void toggleFullscreen()
      } else if (e.key === 'Escape' && pseudoFs) {
        e.preventDefault()
        setPseudoFs(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [suspended, fullscreen, inView, pseudoFs, step, togglePlay, toggleFullscreen])

  // Keep the active thumbnail centred in the film strip (without scrolling the page).
  useEffect(() => {
    const strip = stripRef.current
    const el = strip?.querySelector<HTMLElement>(`[data-index="${safeIndex}"]`)
    if (!strip || !el) return
    strip.scrollTo({ left: el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2, behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [safeIndex, reduceMotion])

  function handlePanEnd(_: unknown, info: PanInfo) {
    if (Math.abs(info.offset.x) < 50 || Math.abs(info.offset.x) < Math.abs(info.offset.y)) return
    panned.current = true
    window.setTimeout(() => {
      panned.current = false
    }, 80)
    step(info.offset.x < 0 ? 1 : -1)
  }

  if (!item) {
    return <p className="py-16 text-center text-gray-500 dark:text-gray-400">No photos to play yet.</p>
  }

  const kb = KEN_BURNS[safeIndex % KEN_BURNS.length]
  const kbStyle = {
    '--kb-x0': kb.x0,
    '--kb-y0': kb.y0,
    '--kb-s0': kb.s0,
    '--kb-x1': kb.x1,
    '--kb-y1': kb.y1,
    '--kb-s1': kb.s1,
    animationDuration: `${SLIDE_MS + FADE_S * 1000}ms`,
    animationPlayState: active ? 'running' : 'paused',
  } as CSSProperties

  const controlBtn =
    'flex items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition hover:bg-white/25 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80'

  return (
    <div
      ref={wrapperRef}
      className={pseudoFs ? 'fixed inset-0 z-[95] bg-black' : nativeFs ? 'bg-black' : 'relative'}
      role="region"
      aria-roledescription="slideshow"
      aria-label="Our memories slideshow"
    >
      <div
        className={`relative overflow-hidden bg-[#08070c] ${
          fullscreen
            ? 'h-full w-full'
            : 'h-[70dvh] max-h-[780px] min-h-[300px] w-full rounded-[1.5rem] shadow-[0_40px_90px_-40px_rgba(159,18,57,0.6)] ring-1 ring-black/10 dark:shadow-[0_40px_90px_-40px_rgba(88,28,135,0.8)] dark:ring-white/10 sm:rounded-[2rem] lg:aspect-video lg:h-auto lg:max-h-[82dvh]'
        }`}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={item.id}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.5 : FADE_S, ease: 'easeInOut' }}
          >
            {item.thumb && (
              <img
                src={item.thumb}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-55 blur-2xl"
              />
            )}
            <div className="absolute inset-0 bg-black/25" />
            <div className={`absolute inset-0 ${reduceMotion ? '' : styles.kenBurns}`} style={reduceMotion ? undefined : kbStyle}>
              <img src={item.src} alt={item.title} decoding="async" draggable={false} className="h-full w-full select-none object-contain" />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* tap / swipe layer */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 z-[1] cursor-pointer"
          style={{ touchAction: 'pan-y' }}
          onPanEnd={handlePanEnd}
          onClick={() => {
            if (!panned.current) togglePlay()
          }}
        />

        {/* vignette + caption */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-2/3 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-24 bg-gradient-to-b from-black/45 to-transparent" />

        <div className="pointer-events-none absolute left-4 top-4 z-[3] flex items-center gap-2 sm:left-6 sm:top-5">
          <span className="rounded-full bg-black/35 px-3 py-1 text-xs font-semibold tabular-nums tracking-wider text-white/90 backdrop-blur-md">
            {String(safeIndex + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
          </span>
          {music && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md dark:bg-purple-500/80">
              <Music className="h-3 w-3" /> music box
            </span>
          )}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0, transition: { delay: reduceMotion ? 0 : 0.5, duration: 0.6 } }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="pointer-events-none absolute inset-x-4 bottom-[4.75rem] z-[3] text-white sm:inset-x-8 sm:bottom-24"
          >
            {item.title && (
              <p className="line-clamp-2 font-cursive text-[1.7rem] leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] sm:text-4xl lg:text-5xl">
                {item.title}
              </p>
            )}
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75 sm:text-xs">{item.dateLabel ?? 'Somewhere in time'}</p>
          </motion.div>
        </AnimatePresence>

        {/* play/pause flash */}
        <AnimatePresence>
          {flash && (
            <motion.div
              key={flash.id}
              aria-hidden="true"
              initial={{ opacity: 0.9, scale: 0.7 }}
              animate={{ opacity: 0, scale: 1.4 }}
              transition={{ duration: 0.7 }}
              onAnimationComplete={() => setFlash(null)}
              className="pointer-events-none absolute left-1/2 top-1/2 z-[3] -ml-9 -mt-9 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm"
            >
              {flash.kind === 'play' ? <Play className="ml-1 h-8 w-8 fill-current" /> : <Pause className="h-8 w-8 fill-current" />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* controls */}
        <div
          className={`absolute inset-x-0 bottom-0 z-[4] flex items-center justify-between gap-2 px-3 sm:px-5 ${
            pseudoFs ? 'pb-[max(1rem,env(safe-area-inset-bottom))]' : 'pb-4 sm:pb-5'
          }`}
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button type="button" onClick={() => step(-1)} aria-label="Previous photo" className={`${controlBtn} h-10 w-10`}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}
              className={`${controlBtn} h-12 w-12 bg-white/90 text-rose-600 hover:bg-white dark:text-purple-600`}
            >
              {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
            </button>
            <button type="button" onClick={() => step(1)} aria-label="Next photo" className={`${controlBtn} h-10 w-10`}>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                setMusic((m) => !m)
                sfx.tick()
              }}
              aria-pressed={music}
              aria-label={music ? 'Turn the music box off' : 'Play with music'}
              className={`${controlBtn} h-10 gap-1.5 px-3 text-xs font-semibold ${music ? 'bg-rose-500/90 hover:bg-rose-500 dark:bg-purple-500/90 dark:hover:bg-purple-500' : ''}`}
            >
              <Music className="h-4 w-4" />
              <span className="hidden sm:inline">{music ? 'Music on' : 'With music'}</span>
            </button>
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              className={`${controlBtn} h-10 w-10`}
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* progress */}
        <div className="absolute inset-x-0 bottom-0 z-[5] h-1 bg-white/15" aria-hidden="true">
          <motion.div style={{ scaleX: progress }} className="h-full origin-left bg-gradient-to-r from-rose-400 via-pink-400 to-fuchsia-400" />
        </div>
      </div>

      {!fullscreen && (
        <div
          ref={stripRef}
          className={`relative mt-4 flex gap-2 overflow-x-auto px-1 py-2 sm:mt-5 sm:gap-2.5 ${styles.noScrollbar}`}
          aria-label="Jump to a photo"
        >
          {items.map((p, i) => {
            const current = i === safeIndex
            return (
              <button
                key={p.id}
                type="button"
                data-index={i}
                onClick={() => {
                  sfx.tick()
                  goTo(i)
                }}
                aria-label={`Show photo ${i + 1}`}
                aria-current={current ? 'true' : undefined}
                className={`relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-rose-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 dark:bg-white/10 sm:h-20 sm:w-[3.75rem] ${
                  current
                    ? 'scale-105 ring-2 ring-rose-500 ring-offset-2 ring-offset-[#fdfbf7] dark:ring-purple-400 dark:ring-offset-[#0B0C10]'
                    : 'opacity-60 hover:opacity-100'
                }`}
                style={p.blur ? { backgroundImage: `url("${p.blur}")`, backgroundSize: 'cover' } : undefined}
              >
                {p.thumb && (
                  <img
                    src={p.thumb}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="h-full w-full object-cover"
                    style={{ objectPosition: 'center 30%' }}
                  />
                )}
              </button>
            )
          })}
        </div>
      )}
      {!fullscreen && (
        <p className="mt-2 hidden text-center text-xs text-gray-500 dark:text-gray-400 sm:block">
          Tap the photo to pause · ← → to browse · F for fullscreen
        </p>
      )}
    </div>
  )
}
