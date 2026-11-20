'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Camera, Expand, Shuffle, Undo2 } from 'lucide-react'
import { formatPhotoDate, getPhotos, seededRandom, todaySeed } from '@/lib/photos'
import { sfx } from '@/lib/sound'
import PhotoLightbox from './PhotoLightbox'
import Reveal from './Reveal'
import SectionHeading from './SectionHeading'
import { BUTTON_PRIMARY, BUTTON_SECONDARY, EYEBROW, type ViewerPhoto } from './types'

/** The photo's dominant colour for the glow, or rose when it is too dark to glow nicely (black Snapchat borders). */
function glowColor(hex: string | undefined): string {
  const fallback = 'rgba(251,113,133,0.55)'
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return fallback
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance < 0.18 ? fallback : hex
}

export default function PhotoOfTheDaySection() {
  const photos = useMemo<ViewerPhoto[]>(
    () =>
      getPhotos().map((p) => ({
        id: p.id,
        src: p.src,
        thumb: p.thumb,
        caption: p.caption,
        date: p.date,
        blur: p.blur,
        color: p.color,
      })),
    [],
  )
  const [todayIndex, setTodayIndex] = useState<number | null>(null)
  const [index, setIndex] = useState<number | null>(null)
  const [lightbox, setLightbox] = useState<number | null>(null)

  // Today's pick depends on the local date, so it is chosen after mount.
  useEffect(() => {
    if (photos.length === 0) return
    const i = Math.floor(seededRandom(todaySeed())() * photos.length)
    setTodayIndex(i)
    setIndex(i)
  }, [photos.length])

  const photo = index !== null ? photos[index] : null
  const dateLabel = photo ? formatPhotoDate(photo.date ?? null) : null

  const shufflePhoto = () => {
    if (photos.length < 2 || index === null) return
    let next = index
    while (next === index) next = Math.floor(Math.random() * photos.length)
    setIndex(next)
    sfx.flip()
  }

  const backToToday = () => {
    if (todayIndex === null) return
    setIndex(todayIndex)
    sfx.flip()
  }

  if (photos.length === 0) return null

  return (
    <section id="photo-of-the-day" className="relative scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24">
      <SectionHeading
        eyebrow="Photo of the day"
        icon={<Camera className="h-3.5 w-3.5 text-rose-400 dark:text-purple-300" aria-hidden />}
        title="A little piece of us, today"
        subtitle="Every day at midnight a different memory floats up to the top. Come back tomorrow for another one."
      />

      <Reveal className="mx-auto grid w-full max-w-5xl items-center gap-10 md:grid-cols-2 md:gap-14">
        <div className="relative mx-auto w-full max-w-[17rem] sm:max-w-xs md:max-w-sm [perspective:1200px]">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-4 rounded-full sm:-inset-8 opacity-50 blur-3xl transition-colors duration-1000 dark:opacity-40"
            style={{ background: photo ? `radial-gradient(circle, ${glowColor(photo.color)}, transparent 70%)` : undefined }}
          />
          <AnimatePresence mode="wait" initial={false}>
            {photo ? (
              <motion.button
                key={photo.id}
                type="button"
                onClick={() => setLightbox(index)}
                aria-label={`See this photo bigger${photo.caption ? `: ${photo.caption}` : ''}`}
                initial={{ rotateY: -90, opacity: 0.4, rotate: -2 }}
                animate={{ rotateY: 0, opacity: 1, rotate: -2 }}
                exit={{ rotateY: 90, opacity: 0.4, rotate: -2 }}
                transition={{ duration: 0.32, ease: 'easeInOut' }}
                whileHover={{ rotate: 0, scale: 1.02 }}
                className="group relative block w-full rounded-[4px] bg-white p-3 pb-14 text-left shadow-2xl shadow-rose-900/15 ring-1 ring-black/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300/70 sm:p-4 sm:pb-16 dark:shadow-black/50"
              >
                <span
                  className="relative block aspect-[4/5] overflow-hidden rounded-[2px] bg-rose-50"
                  style={photo.blur ? { backgroundImage: `url(${photo.blur})`, backgroundSize: 'cover', backgroundPosition: 'center 30%' } : undefined}
                >
                  <img
                    src={photo.src}
                    alt={photo.caption || 'A photo of us'}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="absolute inset-0 h-full w-full object-cover object-[center_30%] transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <span className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/35 text-white opacity-90 backdrop-blur-sm transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100">
                    <Expand className="h-4 w-4" aria-hidden />
                  </span>
                </span>
                <span className="absolute inset-x-3 bottom-3 block text-center font-cursive text-xl leading-tight text-gray-700 sm:bottom-4 sm:text-2xl">
                  <span className="line-clamp-1">{photo.caption || 'Us ♥'}</span>
                </span>
              </motion.button>
            ) : (
              <div key="placeholder" aria-hidden className="relative block w-full -rotate-2 rounded-[4px] bg-white p-3 pb-14 shadow-2xl sm:p-4 sm:pb-16">
                <span className="block aspect-[4/5] animate-pulse rounded-[2px] bg-rose-50" />
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="text-center md:text-left">
          <p className={EYEBROW}>{index !== null && index === todayIndex ? 'Today’s memory' : 'A memory, shuffled'}</p>
          <h3 className="mt-2 font-serif text-3xl font-bold text-gray-900 sm:text-4xl dark:text-gray-100">{dateLabel ?? 'A moment of us'}</h3>
          <p className="mt-3 text-pretty font-serif text-base italic leading-relaxed text-rose-900/80 sm:text-lg dark:text-rose-100/80">
            {photo?.caption ? `“${photo.caption}” ` : ''}
            I could look at this one forever. Tap it to see it bigger, or shuffle for another.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center md:justify-start">
            <button type="button" onClick={shufflePhoto} disabled={index === null} className={BUTTON_PRIMARY}>
              <Shuffle className="h-4 w-4" aria-hidden /> Shuffle
            </button>
            {index !== null && todayIndex !== null && index !== todayIndex && (
              <button type="button" onClick={backToToday} className={BUTTON_SECONDARY}>
                <Undo2 className="h-4 w-4" aria-hidden /> Today&rsquo;s photo
              </button>
            )}
            <Link href="/memories" className={BUTTON_SECONDARY}>
              All our memories <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </Reveal>

      <PhotoLightbox items={photos} index={lightbox} onClose={() => setLightbox(null)} onIndexChange={setLightbox} />
    </section>
  )
}
