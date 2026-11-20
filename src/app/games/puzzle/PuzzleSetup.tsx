'use client'

import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Heart, Play, Shuffle } from 'lucide-react'
import type { LocalPhoto } from '@/lib/photos'
import { sfx } from '@/lib/sound'
import { PUZZLE_SIZES, type PuzzleSize } from './puzzleLogic'
import { photoDateLabel } from './puzzleText'
import styles from './puzzle.module.css'

interface PuzzleSetupProps {
  photos: LocalPhoto[]
  selected: LocalPhoto
  size: PuzzleSize
  bests: Record<PuzzleSize, number | null>
  solvedIds: readonly string[]
  canHover: boolean
  reducedMotion: boolean
  onSelectPhoto: (photo: LocalPhoto) => void
  onSelectSize: (n: PuzzleSize) => void
  onStart: () => void
  onSurprise: () => void
}

export default function PuzzleSetup({
  photos,
  selected,
  size,
  bests,
  solvedIds,
  canHover,
  reducedMotion,
  onSelectPhoto,
  onSelectSize,
  onStart,
  onSurprise,
}: PuzzleSetupProps) {
  const stripRef = useRef<HTMLDivElement>(null)
  const sizeRefs = useRef<(HTMLButtonElement | null)[]>([])
  const firstScroll = useRef(true)
  const solvedSet = new Set(solvedIds)
  const solvedCount = photos.filter((p) => solvedSet.has(p.id)).length
  const dateLabel = photoDateLabel(selected)

  // Keep the chosen photo centred in the strip (instantly the first time).
  useEffect(() => {
    const strip = stripRef.current
    if (!strip) return
    const el = strip.querySelector<HTMLElement>(`[data-photo-id="${selected.id}"]`)
    if (!el) return
    const left = el.offsetLeft - (strip.clientWidth - el.offsetWidth) / 2
    strip.scrollTo({ left: Math.max(0, left), behavior: firstScroll.current || reducedMotion ? 'auto' : 'smooth' })
    firstScroll.current = false
  }, [selected.id, reducedMotion])

  // Warm the cache so the board appears instantly with the full-size photo.
  useEffect(() => {
    const img = new Image()
    img.decoding = 'async'
    img.src = selected.src
  }, [selected.src])

  const select = (photo: LocalPhoto) => {
    if (photo.id === selected.id) return
    sfx.tick()
    onSelectPhoto(photo)
  }

  const onStripKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return
    e.preventDefault()
    const i = photos.findIndex((p) => p.id === selected.id)
    const next =
      e.key === 'Home' ? 0 : e.key === 'End' ? photos.length - 1 : Math.min(photos.length - 1, Math.max(0, i + (e.key === 'ArrowRight' ? 1 : -1)))
    const photo = photos[next]
    if (!photo) return
    select(photo)
    stripRef.current?.querySelector<HTMLElement>(`[data-photo-id="${photo.id}"]`)?.focus({ preventScroll: true })
  }

  const scrollStrip = (dir: 1 | -1) => {
    const strip = stripRef.current
    if (!strip) return
    strip.scrollBy({ left: dir * strip.clientWidth * 0.8, behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  const onSizeKey = (e: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!delta) return
    e.preventDefault()
    const next = (index + delta + PUZZLE_SIZES.length) % PUZZLE_SIZES.length
    sfx.tick()
    onSelectSize(PUZZLE_SIZES[next].n)
    sizeRefs.current[next]?.focus()
  }

  return (
    <motion.section
      initial={reducedMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Puzzle setup"
      className="mx-auto max-w-4xl rounded-3xl border border-rose-100 bg-white/60 p-4 shadow-xl shadow-rose-200/30 backdrop-blur-md sm:p-6 md:p-8 dark:border-white/10 dark:bg-white/5 dark:shadow-none"
    >
      <div className="grid items-center gap-6 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-8 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        {/* Preview polaroid with the cut lines for the chosen size */}
        <div className="mx-auto w-full max-w-[13.5rem] sm:max-w-[16rem] md:max-w-none">
          <motion.div
            initial={false}
            animate={{ rotate: -2.5 }}
            whileHover={canHover && !reducedMotion ? { rotate: 0, y: -6, scale: 1.02 } : undefined}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            className="relative rounded-[4px] bg-white p-2.5 pb-11 shadow-[0_18px_40px_-14px_rgba(0,0,0,0.35)] dark:bg-[#f6f1ea]"
          >
            <div className="relative aspect-square overflow-hidden rounded-[2px]" style={{ backgroundColor: selected.color }}>
              <AnimatePresence initial={false}>
                <motion.img
                  key={selected.id}
                  src={selected.thumb}
                  alt="The memory you'll put back together"
                  decoding="async"
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: '50% 35%', backgroundImage: `url("${selected.blur}")`, backgroundSize: 'cover' }}
                  initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.08 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                />
              </AnimatePresence>

              <AnimatePresence initial={false}>
                <motion.div
                  key={size}
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {Array.from({ length: size - 1 }, (_, k) => (
                    <div key={`v${k}`} className="absolute inset-y-0 w-[2px] -translate-x-1/2 bg-white/75 shadow-[0_0_6px_rgba(0,0,0,0.25)]" style={{ left: `${((k + 1) * 100) / size}%` }} />
                  ))}
                  {Array.from({ length: size - 1 }, (_, k) => (
                    <div key={`h${k}`} className="absolute inset-x-0 h-[2px] -translate-y-1/2 bg-white/75 shadow-[0_0_6px_rgba(0,0,0,0.25)]" style={{ top: `${((k + 1) * 100) / size}%` }} />
                  ))}
                  <div
                    className="absolute bottom-0 right-0 flex items-center justify-center bg-white/45 backdrop-blur-[2px]"
                    style={{ width: `${100 / size}%`, height: `${100 / size}%` }}
                  >
                    <Heart className={`h-1/3 w-1/3 text-rose-500 ${styles.heartbeat}`} fill="currentColor" strokeWidth={0} />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            <p className="absolute inset-x-2 bottom-2.5 truncate text-center font-cursive text-lg text-gray-700 sm:text-xl">{dateLabel}</p>
          </motion.div>
        </div>

        <div className="min-w-0 space-y-6">
          {/* Photo strip */}
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h2 className="font-serif text-xl font-bold text-gray-900 sm:text-2xl dark:text-gray-100">Pick a memory</h2>
              <p className="inline-flex items-center gap-1 text-xs text-rose-500/90 dark:text-purple-200/80">
                <Heart className="h-3 w-3" fill="currentColor" strokeWidth={0} />
                {solvedCount} of {photos.length} pieced together
              </p>
            </div>

            <div className="relative mt-2">
              <div
                ref={stripRef}
                role="group"
                aria-label="Our photos"
                onKeyDown={onStripKey}
                className={`relative -mx-1 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-3 py-2.5 ${styles.strip}`}
              >
                {photos.map((p, i) => {
                  const active = p.id === selected.id
                  const label = photoDateLabel(p, null)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      data-photo-id={p.id}
                      aria-pressed={active}
                      aria-label={`Photo ${i + 1}${label ? `, ${label}` : ''}${solvedSet.has(p.id) ? ', already solved' : ''}`}
                      tabIndex={active ? 0 : -1}
                      onClick={() => select(p)}
                      className={`group/thumb relative h-16 w-16 shrink-0 snap-center overflow-hidden rounded-xl outline-none transition duration-300 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 sm:h-[4.75rem] sm:w-[4.75rem] dark:focus-visible:ring-purple-300 ${
                        active
                          ? 'ring-[3px] ring-rose-400 ring-offset-2 ring-offset-white dark:ring-purple-400 dark:ring-offset-[#15161c]'
                          : 'opacity-70 hover:-translate-y-0.5 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: p.color }}
                    >
                      <img
                        src={p.thumb}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        className="h-full w-full object-cover transition duration-500 group-hover/thumb:scale-110"
                        style={{ objectPosition: '50% 30%' }}
                      />
                      {solvedSet.has(p.id) && (
                        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white/90 shadow">
                          <Heart className="h-2.5 w-2.5 text-rose-500" fill="currentColor" strokeWidth={0} />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {canHover && (
                <>
                  <button
                    type="button"
                    onClick={() => scrollStrip(-1)}
                    aria-label="Scroll photos left"
                    className="absolute -left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/90 p-1.5 text-gray-600 shadow-md transition hover:scale-110 hover:text-rose-500 sm:flex dark:bg-[#1c1d26] dark:text-gray-300 dark:hover:text-purple-200"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollStrip(1)}
                    aria-label="Scroll photos right"
                    className="absolute -right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/90 p-1.5 text-gray-600 shadow-md transition hover:scale-110 hover:text-rose-500 sm:flex dark:bg-[#1c1d26] dark:text-gray-300 dark:hover:text-purple-200"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Size */}
          <div>
            <h2 id="puzzle-size-label" className="font-serif text-xl font-bold text-gray-900 sm:text-2xl dark:text-gray-100">
              Pick a size
            </h2>
            <div role="radiogroup" aria-labelledby="puzzle-size-label" className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
              {PUZZLE_SIZES.map(({ n, label, pieces }, index) => {
                const active = n === size
                const best = bests[n]
                return (
                  <button
                    key={n}
                    ref={(el) => {
                      sizeRefs.current[index] = el
                    }}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    tabIndex={active ? 0 : -1}
                    onClick={() => {
                      if (!active) sfx.tick()
                      onSelectSize(n)
                    }}
                    onKeyDown={(e) => onSizeKey(e, index)}
                    className={`relative flex min-w-0 flex-col items-center gap-1 rounded-2xl border px-1.5 py-3 text-center outline-none transition duration-300 focus-visible:ring-2 focus-visible:ring-rose-400 dark:focus-visible:ring-purple-300 ${
                      active
                        ? 'border-rose-300 bg-rose-50 shadow-md shadow-rose-200/60 dark:border-purple-400/50 dark:bg-purple-500/15 dark:shadow-none'
                        : 'border-rose-100 bg-white/60 hover:-translate-y-0.5 hover:border-rose-200 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10'
                    }`}
                  >
                    <MiniGrid n={n} active={active} />
                    <span className="mt-1 font-serif text-base font-bold leading-none text-gray-900 sm:text-lg dark:text-gray-100">
                      {n}×{n}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-400 dark:text-purple-300">{label}</span>
                    <span className="max-w-full truncate text-[10px] text-gray-500 sm:text-[11px] dark:text-gray-400">
                      {best !== null ? `Best: ${best}` : `${pieces} pieces`}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={onStart}
              className="group relative inline-flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:shadow-xl hover:shadow-rose-500/40 active:scale-[0.98] dark:from-purple-500 dark:to-fuchsia-500 dark:shadow-purple-500/25"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/30 transition-transform duration-700 ease-out group-hover:translate-x-[450%]"
              />
              <Play className="h-4 w-4" fill="currentColor" /> Start puzzle
            </button>
            <button
              type="button"
              onClick={onSurprise}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-white/70 px-5 py-3.5 text-sm font-semibold text-rose-600 transition hover:bg-white hover:shadow-md active:scale-[0.98] dark:border-white/15 dark:bg-white/5 dark:text-purple-200 dark:hover:bg-white/10"
            >
              <Shuffle className="h-4 w-4" /> Surprise me
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

function MiniGrid({ n, active }: { n: number; active: boolean }) {
  return (
    <span
      aria-hidden
      className="grid h-8 w-8 gap-[2px]"
      style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${n}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: n * n }, (_, i) =>
        i === n * n - 1 ? (
          <span key={i} className="rounded-[2px] border border-dashed border-rose-300 dark:border-purple-300/50" />
        ) : (
          <span
            key={i}
            className={`rounded-[2px] transition-colors duration-300 ${active ? 'bg-rose-400 dark:bg-purple-400' : 'bg-rose-200 dark:bg-white/20'}`}
          />
        ),
      )}
    </span>
  )
}
