'use client'

import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { motion, AnimatePresence, useReducedMotion, useScroll, useSpring } from 'framer-motion'
import { Heart, Shuffle, Sparkles } from 'lucide-react'
import { groupByYear } from '@/lib/photos'
import { useCanHover, useMediaQuery } from '@/lib/hooks'
import { sfx } from '@/lib/sound'
import LaneCard from './LaneCard'
import { useFavourites } from './favourites'
import { cardRatio, type ViewerItem } from './viewerItems'

interface MemoryLaneProps {
  items: ViewerItem[]
  onOpen: (list: ViewerItem[], index: number) => void
}

/** Every local photo + the video, as a scroll-drawn timeline grouped by year. */
export default function MemoryLane({ items, onOpen }: MemoryLaneProps) {
  const { favourites } = useFavourites()
  // Only hearts on lane items count here: album hearts ("album:…") and stale ids never show up in this filter.
  const favCount = useMemo(() => items.reduce((n, i) => n + (favourites.has(i.id) ? 1 : 0), 0), [items, favourites])
  const [favOnly, setFavOnly] = useState(false)
  const canHover = useCanHover()
  const reduceMotion = useReducedMotion() ?? false
  const isMd = useMediaQuery('(min-width: 768px)')
  const isXl = useMediaQuery('(min-width: 1280px)')
  const columns = isXl ? 4 : isMd ? 3 : 2

  const visible = useMemo(() => (favOnly ? items.filter((i) => favourites.has(i.id)) : items), [favOnly, items, favourites])
  const groups = useMemo(() => groupByYear(visible), [visible])
  const datedGroups = groups.filter((g) => g.year !== null).length
  const indexOf = useMemo(() => new Map(visible.map((it, i) => [it.id, i])), [visible])

  const open = useCallback(
    (index: number) => {
      sfx.flip()
      onOpen(visible, index)
    },
    [visible, onOpen],
  )

  function surprise() {
    if (visible.length === 0) return
    sfx.sparkle()
    onOpen(visible, Math.floor(Math.random() * visible.length))
  }

  function toggleFavOnly() {
    sfx.tick()
    setFavOnly((v) => !v)
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-center gap-2 sm:mb-10 sm:gap-3">
        <button
          type="button"
          onClick={toggleFavOnly}
          aria-pressed={favOnly}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm backdrop-blur-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 dark:focus-visible:ring-purple-400/60 ${
            favOnly
              ? 'border-rose-400 bg-rose-500 text-white shadow-rose-500/30 dark:border-purple-400 dark:bg-purple-500'
              : 'border-rose-100 bg-white/70 text-rose-600 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-purple-200 dark:hover:bg-white/10'
          }`}
        >
          <Heart className={`h-4 w-4 ${favOnly ? 'fill-current' : ''}`} />
          Favourites
          <span
            className={`min-w-[1.5rem] rounded-full px-1.5 py-0.5 text-center text-[11px] tabular-nums ${
              favOnly ? 'bg-white/25' : 'bg-rose-100 text-rose-600 dark:bg-white/10 dark:text-purple-100'
            }`}
          >
            {favCount}
          </span>
        </button>
        <button
          type="button"
          onClick={surprise}
          disabled={visible.length === 0}
          className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-white/70 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm backdrop-blur-md transition hover:bg-white hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-purple-200 dark:focus-visible:ring-purple-400/60"
        >
          <Shuffle className="h-4 w-4" /> Surprise me
        </button>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {visible.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-auto max-w-md rounded-3xl border border-rose-100 bg-white/60 px-6 py-12 text-center shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 dark:bg-purple-500/20">
              <Heart className="h-6 w-6 text-rose-500 dark:text-purple-300" />
            </div>
            <p className="font-serif text-xl font-bold text-gray-900 dark:text-gray-100">No favourites yet</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              Open any photo and tap the heart (or double-tap the photo) to keep it here, baby.
            </p>
            <button
              type="button"
              onClick={toggleFavOnly}
              className="mt-5 rounded-full bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-500/25 transition hover:bg-rose-600 dark:bg-purple-500 dark:hover:bg-purple-400"
            >
              Show every memory
            </button>
          </motion.div>
        ) : (
          <motion.div key={favOnly ? 'fav' : 'all'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LaneTimeline reduceMotion={reduceMotion}>
              {groups.map((group, gi) => (
                <YearSection
                  key={group.year ?? 'undated'}
                  year={group.year}
                  items={group.items}
                  tagline={taglineFor(group.year, gi, datedGroups)}
                  columns={columns}
                  indexOf={indexOf}
                  onOpen={open}
                  favourites={favourites}
                  canHover={canHover}
                  reduceMotion={reduceMotion}
                />
              ))}
            </LaneTimeline>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * The lane body: owns the element `useScroll` tracks, so the glowing line is
 * always measured against the list that is actually on screen.
 */
function LaneTimeline({ reduceMotion, children }: { reduceMotion: boolean; children: ReactNode }) {
  const laneRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: laneRef, offset: ['start 75%', 'end 65%'] })
  const springy = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 })
  const lineScale = reduceMotion ? scrollYProgress : springy

  return (
    <div ref={laneRef} className="relative pl-8 sm:pl-12">
      {/* timeline track + the glowing line that draws as you scroll */}
      <div aria-hidden="true" className="absolute bottom-6 left-2 top-2 w-0.5 rounded-full bg-rose-200/70 dark:bg-white/10" />
      <motion.div
        aria-hidden="true"
        style={{ scaleY: lineScale }}
        className="absolute bottom-6 left-2 top-2 w-0.5 origin-top rounded-full bg-gradient-to-b from-rose-300 via-rose-500 to-fuchsia-500 shadow-[0_0_10px_2px_rgba(244,63,94,0.45)] dark:from-purple-300 dark:via-fuchsia-400 dark:to-rose-400 dark:shadow-[0_0_12px_2px_rgba(192,132,252,0.55)]"
      />

      {children}

      <div className="relative -ml-8 flex items-center gap-3 sm:-ml-12">
        <span
          aria-hidden="true"
          className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-fuchsia-500 shadow-[0_0_16px_rgba(244,63,94,0.7)] dark:from-purple-300 dark:to-fuchsia-500"
        >
          <Sparkles className="h-2.5 w-2.5 text-white" />
        </span>
        <p className="font-cursive text-xl text-rose-500 dark:text-purple-200 sm:text-2xl">…and so many more to come, together.</p>
      </div>
    </div>
  )
}

function taglineFor(year: number | null, index: number, datedGroups: number): string {
  if (year === null) return 'Moments that forgot their dates, but never their feeling'
  if (index === 0) return 'Where this little album of ours begins'
  if (index === datedGroups - 1) return 'Our latest chapter (so far)'
  return 'Falling for you, all over again'
}

/** Greedy masonry: each card goes to the currently shortest column. Odd columns start lower for a staggered look. */
function distribute(items: ViewerItem[], columns: number): ViewerItem[][] {
  const cols: ViewerItem[][] = Array.from({ length: columns }, () => [])
  const heights = cols.map((_, i) => (i % 2 === 1 ? 0.35 : 0))
  for (const item of items) {
    let target = 0
    for (let i = 1; i < columns; i++) if (heights[i] < heights[target] - 0.001) target = i
    cols[target].push(item)
    heights[target] += cardRatio(item) + 0.22
  }
  return cols
}

interface YearSectionProps {
  year: number | null
  items: ViewerItem[]
  tagline: string
  columns: number
  indexOf: Map<string, number>
  onOpen: (index: number) => void
  favourites: Set<string>
  canHover: boolean
  reduceMotion: boolean
}

function YearSection({ year, items, tagline, columns, indexOf, onOpen, favourites, canHover, reduceMotion }: YearSectionProps) {
  const title = year === null ? 'Somewhere in time' : String(year)
  const headingId = `lane-year-${year ?? 'undated'}`
  const cols = useMemo(() => distribute(items, columns), [items, columns])
  const countLabel = `${items.length} moment${items.length === 1 ? '' : 's'}`

  return (
    <section aria-labelledby={headingId} className="relative pb-14 sm:pb-20">
      {/* sticky year marker, its dot sits on the timeline */}
      <div className="pointer-events-none sticky top-[4.75rem] z-30 -ml-8 mb-3 flex items-center gap-3 sm:top-[5.5rem] sm:-ml-12">
        <motion.span
          aria-hidden="true"
          initial={reduceMotion ? false : { scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          className="h-[18px] w-[18px] shrink-0 rounded-full border-[3px] border-[#fdfbf7] bg-rose-500 shadow-[0_0_0_4px_rgba(251,113,133,0.22),0_0_16px_rgba(244,63,94,0.7)] dark:border-[#0B0C10] dark:bg-purple-400 dark:shadow-[0_0_0_4px_rgba(192,132,252,0.2),0_0_16px_rgba(192,132,252,0.7)]"
        />
        <div className="flex min-w-0 items-baseline gap-2 rounded-full border border-rose-100 bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#15161f]/80 sm:px-4">
          <h2 id={headingId} className="truncate font-serif text-base font-bold text-gray-900 dark:text-gray-100 sm:text-xl">
            {title}
          </h2>
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-400 dark:text-purple-300 sm:text-[11px] sm:tracking-[0.16em]">
            {countLabel}
          </span>
        </div>
      </div>

      <p className="mb-6 font-cursive text-lg leading-snug text-rose-500/85 dark:text-purple-200/80 sm:mb-8 sm:text-2xl">{tagline}</p>

      <div className="flex items-start gap-3 sm:gap-5 lg:gap-7">
        {cols.map((col, ci) => (
          <div key={ci} className={`flex min-w-0 flex-1 flex-col gap-4 sm:gap-6 lg:gap-8 ${ci % 2 === 1 ? 'pt-8 sm:pt-14' : ''}`}>
            {col.map((item, ri) => (
              <motion.div
                key={item.id}
                initial={reduceMotion ? false : { opacity: 0, y: 48 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '0px 0px -40px 0px' }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: (ci * 0.07 + (ri % 2) * 0.04) % 0.3 }}
              >
                <LaneCard
                  item={item}
                  index={indexOf.get(item.id) ?? 0}
                  onOpen={onOpen}
                  isFavourite={favourites.has(item.id)}
                  canHover={canHover}
                  reduceMotion={reduceMotion}
                />
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
