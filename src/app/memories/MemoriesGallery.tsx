'use client'

import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { CalendarHeart, Heart, ImageOff, Images, Route } from 'lucide-react'
import { useCanHover } from '@/lib/hooks'
import { sfx } from '@/lib/sound'
import { useFavourites } from './favourites'
import { fromAlbumMemory, tiltFor, type ViewerItem } from './viewerItems'
import type { Memory } from '@/data/initialData'
import styles from './memories.module.css'

interface MemoriesGalleryProps {
  /** null while loading */
  memories: Memory[] | null
  failed?: boolean
  onOpen: (list: ViewerItem[], index: number) => void
  onGoToLane: () => void
  laneCount: number
}

/** The album: memories uploaded from Admin Studio (title + caption), as polished prints. */
export default function MemoriesGallery({ memories, failed = false, onOpen, onGoToLane, laneCount }: MemoriesGalleryProps) {
  const items = useMemo(() => (memories ?? []).map(fromAlbumMemory), [memories])
  const { favourites } = useFavourites()
  const canHover = useCanHover()
  const reduceMotion = useReducedMotion() ?? false

  if (memories === null) {
    return (
      <div className="grid grid-cols-1 gap-6 min-[480px]:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading the album">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="rounded-3xl border border-rose-100 bg-white/60 p-3 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className={`aspect-[4/5] w-full rounded-2xl bg-rose-100/80 dark:bg-white/10 ${styles.shimmer}`} />
            <div className={`mt-4 h-4 w-2/3 rounded-full bg-rose-100/80 dark:bg-white/10 ${styles.shimmer}`} />
            <div className={`mt-2 mb-2 h-3 w-1/2 rounded-full bg-rose-100/60 dark:bg-white/5 ${styles.shimmer}`} />
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-lg rounded-[2rem] border border-rose-100 bg-white/60 px-6 py-12 text-center shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 sm:px-10"
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 dark:bg-purple-500/20">
          {failed ? <ImageOff className="h-7 w-7 text-rose-500 dark:text-purple-300" /> : <Images className="h-7 w-7 text-rose-500 dark:text-purple-300" />}
        </div>
        <h3 className="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100">
          {failed ? 'The album is shy right now' : 'Our album is waiting for its first print'}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300 sm:text-base">
          {failed
            ? 'I could not reach the album just now. '
            : 'New photos I add for you will appear here, with little notes. '}
          Meanwhile, all {laneCount} of our moments are waiting on Memory Lane.
        </p>
        <button
          type="button"
          onClick={onGoToLane}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-rose-500/25 transition hover:bg-rose-600 active:scale-95 dark:bg-purple-500 dark:hover:bg-purple-400"
        >
          <Route className="h-4 w-4" /> Walk down Memory Lane
        </button>
      </motion.div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 min-[480px]:grid-cols-2 sm:gap-8 lg:grid-cols-3">
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          initial={reduceMotion ? false : { opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px 0px -40px 0px' }}
          transition={{ duration: 0.6, delay: (i % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          <AlbumCard
            item={item}
            isFavourite={favourites.has(item.id)}
            interactive={canHover && !reduceMotion}
            onOpen={() => {
              sfx.flip()
              onOpen(items, i)
            }}
          />
        </motion.div>
      ))}
    </div>
  )
}

function AlbumCard({ item, isFavourite, interactive, onOpen }: { item: ViewerItem; isFavourite: boolean; interactive: boolean; onOpen: () => void }) {
  const [loaded, setLoaded] = useState(false)
  const [broken, setBroken] = useState(false)
  const tilt = tiltFor(item.id, 1.6)

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${item.title || 'memory'}`}
      initial={false}
      animate={{ rotate: tilt, y: 0 }}
      whileHover={interactive ? { rotate: 0, y: -8 } : undefined}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={`group relative block w-full rounded-[1.75rem] border border-rose-100 bg-white/80 p-3 text-left shadow-[0_18px_40px_-22px_rgba(159,18,57,0.45)] backdrop-blur-md transition-shadow hover:shadow-[0_30px_60px_-24px_rgba(244,63,94,0.55)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300/60 dark:border-white/10 dark:bg-white/[0.06] dark:hover:shadow-[0_30px_60px_-24px_rgba(168,85,247,0.55)] dark:focus-visible:ring-purple-400/50 ${styles.sheenHost}`}
    >
      <div className={`relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-rose-100 dark:bg-white/10 ${loaded || broken ? '' : styles.shimmer}`}>
        {!broken ? (
          <img
            src={item.src}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            onLoad={() => setLoaded(true)}
            onError={() => setBroken(true)}
            className={`h-full w-full object-cover transition-[opacity,scale] duration-700 ${loaded ? 'opacity-100' : 'opacity-0'} ${
              interactive ? 'group-hover:scale-105' : ''
            }`}
            style={{ objectPosition: 'center 30%' }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-rose-300 dark:text-purple-300/60">
            <ImageOff className="h-10 w-10" />
          </div>
        )}
        <span className={styles.sheen} aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {isFavourite && (
          <span className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md">
            <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
          </span>
        )}
      </div>
      <div className="px-1.5 pb-1 pt-4">
        <h3 className="font-serif text-xl font-bold leading-snug text-gray-900 dark:text-gray-100">{item.title || 'Untitled memory'}</h3>
        {item.description && (
          <p className="mt-1.5 line-clamp-2 font-serif text-sm italic leading-relaxed text-rose-900/75 dark:text-rose-100/70">“{item.description}”</p>
        )}
        {item.dateLabel && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-400 dark:text-purple-300">
            <CalendarHeart className="h-3.5 w-3.5" /> {item.dateLabel}
          </p>
        )}
      </div>
    </motion.button>
  )
}
