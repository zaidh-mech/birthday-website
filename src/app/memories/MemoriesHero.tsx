'use client'

import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { CalendarHeart, Camera, Film, Heart } from 'lucide-react'
import { useCanHover, useMediaQuery } from '@/lib/hooks'
import { useSiteConfig } from '@/lib/siteConfig'
import { sfx } from '@/lib/sound'
import { useFavourites } from './favourites'
import type { ViewerItem } from './viewerItems'
import styles from './memories.module.css'

interface MemoriesHeroProps {
  items: ViewerItem[]
  picks: ViewerItem[]
  onOpenPick: (index: number) => void
  cinematic: boolean
}

export default function MemoriesHero({ items, picks, onOpenPick, cinematic }: MemoriesHeroProps) {
  const reduceMotion = useReducedMotion() ?? false
  const { config } = useSiteConfig()
  const { count: favCount } = useFavourites()

  const stats = useMemo(() => {
    const photos = items.filter((i) => i.kind === 'image').length
    const videos = items.length - photos
    const years = items.map((i) => i.year).filter((y): y is number => y !== null)
    const from = years.length ? Math.min(...years) : null
    const to = years.length ? Math.max(...years) : null
    return { photos, videos, from, to }
  }, [items])

  // Entrance for each hero line. The blur-in is reserved for the big reveal right after unlocking.
  const item = (delay: number) => {
    if (reduceMotion) return { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.4 } }
    const transition = { duration: cinematic ? 1 : 0.7, delay: (cinematic ? 0.35 : 0) + delay, ease: [0.22, 1, 0.36, 1] as const }
    return cinematic
      ? { initial: { opacity: 0, y: 24, filter: 'blur(10px)' }, animate: { opacity: 1, y: 0, filter: 'blur(0px)' }, transition }
      : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition }
  }

  const chips = [
    { icon: Camera, label: `${stats.photos} photos` },
    ...(stats.videos > 0 ? [{ icon: Film, label: `${stats.videos} video${stats.videos > 1 ? 's' : ''}` }] : []),
    ...(stats.from !== null ? [{ icon: CalendarHeart, label: stats.from === stats.to ? `${stats.from}` : `${stats.from} – ${stats.to}` }] : []),
    { icon: Heart, label: `${config.yearsTogether} years of us` },
  ]

  return (
    <header className="relative mx-auto max-w-4xl text-center">
      <motion.p
        {...item(0)}
        className="text-[11px] font-semibold uppercase tracking-[0.3em] text-rose-400 dark:text-purple-300 sm:text-xs"
      >
        {cinematic ? 'The vault is open' : 'Unlocked with love'}
      </motion.p>
      <motion.h1
        {...item(0.08)}
        className={`mt-3 bg-gradient-to-r from-gray-900 via-rose-600 to-gray-900 bg-clip-text pb-2 font-serif text-[2.6rem] font-bold leading-[1.05] tracking-tight text-transparent dark:from-white dark:via-purple-300 dark:to-white sm:text-6xl lg:text-7xl ${styles.gradientText}`}
      >
        Our Memories
      </motion.h1>
      <motion.p {...item(0.16)} className="mt-2 font-cursive text-2xl text-rose-500 dark:text-purple-200 sm:text-3xl">
        Every little piece of us, kept in one place.
      </motion.p>

      <motion.ul {...item(0.24)} className="mt-6 flex flex-wrap items-center justify-center gap-2" aria-label="Memory stats">
        {chips.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-100 bg-white/70 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-gray-200 sm:text-sm"
          >
            <Icon className="h-3.5 w-3.5 text-rose-500 dark:text-purple-300" />
            {label}
          </li>
        ))}
        {favCount > 0 && (
          <li className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-rose-500/30 dark:bg-purple-500 sm:text-sm">
            <Heart className="h-3.5 w-3.5 fill-current" />
            {favCount} loved
          </li>
        )}
      </motion.ul>

      {picks.length > 0 && (
        <motion.div {...item(0.34)} className="mt-8 sm:mt-10">
          <PhotoFan picks={picks} onOpen={onOpenPick} reduceMotion={reduceMotion} />
        </motion.div>
      )}
    </header>
  )
}

/** Five of today's picks stacked like prints; they fan out on hover (or first tap). */
function PhotoFan({ picks, onOpen, reduceMotion }: { picks: ViewerItem[]; onOpen: (index: number) => void; reduceMotion: boolean }) {
  const canHover = useCanHover()
  const isSm = useMediaQuery('(min-width: 640px)')
  const [spread, setSpread] = useState(false)
  const n = picks.length
  const mid = (n - 1) / 2
  // Spread distance per card; keeps the fan inside 288px on a 320px phone.
  const step = isSm ? 82 : 50

  function handleClick(index: number) {
    if (!spread && !canHover) {
      setSpread(true)
      sfx.flip()
      return
    }
    onOpen(index)
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative h-36 w-full max-w-md sm:h-48"
        onMouseEnter={canHover ? () => setSpread(true) : undefined}
        onMouseLeave={canHover ? () => setSpread(false) : undefined}
        onFocus={(e) => {
          // Keyboard focus spreads the fan; a tap (which may also focus) is handled by onClick.
          try {
            if (e.target.matches(':focus-visible')) setSpread(true)
          } catch {
            /* very old browsers: ignore */
          }
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setSpread(false)
        }}
      >
        {picks.map((p, i) => {
          const offset = i - mid
          const x = spread ? offset * step : offset * 10
          const rotate = spread ? offset * 7 : offset * 4
          const y = spread ? Math.abs(offset) * 8 : Math.abs(offset) * 2
          return (
            <motion.button
              key={p.id}
              type="button"
              onClick={() => handleClick(i)}
              aria-label={spread || canHover ? `Open today's pick ${i + 1}: ${p.title}` : `Spread today's picks`}
              initial={false}
              animate={reduceMotion ? { x: offset * (spread ? step : 10), rotate: 0, y: 0 } : { x, rotate, y }}
              whileHover={canHover && !reduceMotion ? { y: y - 14, scale: 1.08, zIndex: 20 } : undefined}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
              style={{ zIndex: n - Math.round(Math.abs(offset) * 2) }}
              className="absolute left-1/2 top-0 -ml-10 w-20 bg-white p-1.5 pb-4 shadow-[0_14px_30px_-12px_rgba(60,20,30,0.45)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300/70 dark:bg-[#f5f1ea] dark:focus-visible:ring-purple-400/50 sm:-ml-[3.75rem] sm:w-[7.5rem] sm:p-2 sm:pb-6"
            >
              <div
                className="aspect-[3/4] w-full overflow-hidden bg-rose-100"
                style={{ backgroundImage: p.blur ? `url("${p.blur}")` : undefined, backgroundSize: 'cover' }}
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
              </div>
            </motion.button>
          )
        })}
      </div>
      <p className="mt-4 font-cursive text-lg text-rose-400 dark:text-purple-200/80 sm:text-xl">
        {canHover ? 'Today’s picks for you, hover me ♥' : spread ? 'Tap one to open it ♥' : 'Today’s picks for you, tap to spread ♥'}
      </p>
    </div>
  )
}
