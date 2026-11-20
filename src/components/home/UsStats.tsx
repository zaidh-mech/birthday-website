'use client'

import { useEffect, useRef, useState, type ComponentType } from 'react'
import { motion, useInView } from 'framer-motion'
import { Camera, Film, Heart, Mail, Sparkles } from 'lucide-react'
import { fetchLetters } from '@/lib/storage'
import { getPhotos, getVideos, groupByYear } from '@/lib/photos'
import RollingNumber from './RollingNumber'
import { GLASS_CARD } from './types'

interface Stat {
  value: number
  label: string
  icon: ComponentType<{ className?: string }>
}

/**
 * "5 years of us" — built only from real things on the site: the years
 * together, photos and videos in the album, letters he wrote, and reasons in
 * the jar. No invented dates.
 */
export default function UsStats({ years, reasonsCount }: { years: number; reasonsCount: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.25 })
  const [letters, setLetters] = useState<number | null>(null)
  const photos = getPhotos()
  const videos = getVideos()
  const photoYears = groupByYear(photos).filter((g) => g.year !== null)

  useEffect(() => {
    let alive = true
    fetchLetters()
      .then((list) => {
        if (alive) setLetters(list.filter((l) => !(l.title ?? '').trim().startsWith('[')).length)
      })
      .catch(() => {
        if (alive) setLetters(0)
      })
    return () => {
      alive = false
    }
  }, [])

  const stats: Stat[] = [
    { value: years, label: years === 1 ? 'year of us' : 'years of us', icon: Heart },
    { value: photos.length, label: 'photos of us in here', icon: Camera },
  ]
  if (letters !== null && letters > 0) stats.push({ value: letters, label: letters === 1 ? 'letter from me' : 'letters from me', icon: Mail })
  if (videos.length > 0) stats.push({ value: videos.length, label: videos.length === 1 ? 'little video' : 'little videos', icon: Film })
  if (reasonsCount > 0) stats.push({ value: reasonsCount, label: 'reasons in the jar below', icon: Sparkles })

  return (
    <div ref={ref} className={`${GLASS_CARD} relative overflow-hidden p-5 sm:p-8`}>
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-rose-200/40 blur-3xl dark:bg-purple-500/20" />
      <ul className="relative flex flex-wrap justify-center gap-3 sm:gap-4">
        {stats.map((s, i) => (
          <motion.li
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="group flex w-[calc(50%-0.375rem)] flex-col items-center rounded-2xl bg-white/70 px-2 py-5 text-center shadow-sm ring-1 ring-rose-100/70 transition-transform duration-300 hover:-translate-y-1 sm:w-40 sm:px-3 lg:w-44 dark:bg-white/5 dark:ring-white/10"
          >
            <span className="mb-2 grid h-9 w-9 place-items-center rounded-full bg-rose-100 text-rose-500 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12 dark:bg-purple-500/20 dark:text-purple-200">
              <s.icon className="h-4 w-4" />
            </span>
            <RollingNumber value={s.value} active={inView} group className="font-serif text-4xl font-bold text-gray-900 sm:text-5xl dark:text-gray-100" />
            <span className="mt-1 text-[10px] font-semibold uppercase leading-snug tracking-[0.16em] text-rose-400 sm:text-[11px] dark:text-purple-300">{s.label}</span>
          </motion.li>
        ))}
        {letters === null && (
          <li aria-hidden className="w-[calc(50%-0.375rem)] animate-pulse rounded-2xl bg-white/50 sm:w-40 lg:w-44 dark:bg-white/5" />
        )}
      </ul>

      {photoYears.length > 1 && (
        <div className="relative mt-6 flex flex-wrap items-center justify-center gap-2">
          {photoYears.map((g) => (
            <span
              key={g.year}
              className="rounded-full border border-rose-100 bg-white/70 px-3 py-1 text-xs font-medium text-rose-600 dark:border-white/10 dark:bg-white/5 dark:text-purple-200"
            >
              {g.year} · {g.items.length} {g.items.length === 1 ? 'photo' : 'photos'}
            </span>
          ))}
        </div>
      )}
      <p className="relative mx-auto mt-6 max-w-md text-center font-serif text-sm italic text-rose-900/75 sm:text-base dark:text-rose-100/75">
        &hellip;and the best part is, we&rsquo;re only getting started.
      </p>
    </div>
  )
}
