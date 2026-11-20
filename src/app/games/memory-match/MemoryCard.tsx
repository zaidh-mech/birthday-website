'use client'

import { memo, type CSSProperties, type KeyboardEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { shortDate, type MemoryCardData } from './logic'
import styles from './MemoryCard.module.css'

export interface FloatLabel {
  id: number
  text: string
}

export type LabelAlign = 'left' | 'center' | 'right'

interface MemoryCardProps {
  index: number
  card: MemoryCardData
  width: number
  height: number
  faceUp: boolean
  matched: boolean
  missed: boolean
  /** After the win: tapping a card opens the photo. */
  viewable: boolean
  dealDelay: number
  reduceMotion: boolean
  /** Little date/phrase bubble that floats up after a match. */
  label: FloatLabel | null
  labelAlign: LabelAlign
  /** Shimmer wave across the backs when a round starts. */
  wave: boolean
  waveDelay: number
  registerRef: (index: number, el: HTMLButtonElement | null) => void
  onActivate: (index: number) => void
  onNavigate: (index: number, key: string) => void
}

const NAV_KEYS = new Set(['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End'])

function MemoryCard({
  index,
  card,
  width,
  height,
  faceUp,
  matched,
  missed,
  viewable,
  dealDelay,
  reduceMotion,
  label,
  labelAlign,
  wave,
  waveDelay,
  registerRef,
  onActivate,
  onNavigate,
}: MemoryCardProps) {
  const { photo } = card
  const showing = faceUp || matched
  const radius = Math.round(Math.min(16, Math.max(8, width * 0.09)))
  const pad = width < 80 ? 3 : width < 130 ? 4 : 6
  const date = shortDate(photo.date)
  const n = index + 1

  let ariaLabel = `Card ${n}, face down`
  if (matched) ariaLabel = `Card ${n}, matched${date ? `, photo from ${date}` : ''}${viewable ? '. Open the photo' : ''}`
  else if (faceUp) ariaLabel = `Card ${n}, face up${date ? `, photo from ${date}` : ''}`

  const vars = {
    '--r': `${radius}px`,
    '--pad': `${pad}px`,
    '--wave-delay': `${waveDelay}s`,
  } as CSSProperties

  // A deterministic little tilt for the deal-in animation.
  const dealTilt = ((index * 37) % 13) - 6

  const handleKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!NAV_KEYS.has(e.key)) return
    e.preventDefault()
    onNavigate(index, e.key)
  }

  const cornerSize = Math.max(9, Math.round(width * 0.1))
  const badgeSize = Math.max(16, Math.round(width * 0.17))

  return (
    <motion.div
      className={`relative ${wave ? styles.wave : ''}`}
      style={{ width, height, ...vars }}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.75, rotate: dealTilt }}
      animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
      transition={reduceMotion ? { duration: 0.25 } : { delay: dealDelay, type: 'spring', stiffness: 240, damping: 21 }}
    >
      <AnimatePresence>
        {label && (
          <motion.span
            key={label.id}
            aria-hidden
            className={`pointer-events-none absolute -top-2 z-20 whitespace-nowrap rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-rose-600 shadow-lg ring-1 ring-rose-100 sm:text-xs dark:bg-[#1b1c26]/95 dark:text-pink-200 dark:ring-white/10 ${
              labelAlign === 'left' ? 'left-0' : labelAlign === 'right' ? 'right-0' : 'left-1/2'
            }`}
            style={{ x: labelAlign === 'center' ? '-50%' : 0 }}
            initial={{ opacity: 0, y: 6, scale: 0.85 }}
            animate={{ opacity: 1, y: reduceMotion ? -8 : -20, scale: 1 }}
            exit={{ opacity: 0, y: reduceMotion ? -8 : -34 }}
            transition={{ duration: reduceMotion ? 0.2 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {label.text}
          </motion.span>
        )}
      </AnimatePresence>

      <button
        ref={(el) => registerRef(index, el)}
        type="button"
        aria-label={ariaLabel}
        aria-disabled={matched && !viewable ? true : undefined}
        onClick={() => onActivate(index)}
        onKeyDown={handleKey}
        className={`${styles.card} ${missed ? styles.shake : ''} ${matched ? styles.matched : ''}`}
      >
        <motion.span
          className={styles.flipper}
          initial={false}
          animate={{ rotateY: showing ? 180 : 0, scale: matched && !reduceMotion ? [1, 1.08, 1] : 1 }}
          transition={{
            rotateY: reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 230, damping: 22, mass: 0.8 },
            scale: { duration: 0.55, ease: 'easeOut' },
          }}
        >
          {/* Back */}
          <span className={`${styles.face} ${styles.back}`} aria-hidden>
            <span className={styles.frame} />
            <span className={`${styles.corner} ${styles.cornerTL}`} style={{ fontSize: cornerSize }}>
              ♥
            </span>
            <span className={`${styles.corner} ${styles.cornerBR}`} style={{ fontSize: cornerSize }}>
              ♥
            </span>
            <span className={styles.medallion}>
              <Heart fill="currentColor" strokeWidth={1.25} />
            </span>
            {width >= 104 && (
              <span className={`${styles.motto} font-cursive`} style={{ fontSize: Math.round(width * 0.12) }}>
                you &amp; me
              </span>
            )}
          </span>

          {/* Front */}
          <span className={`${styles.face} ${styles.front}`} aria-hidden>
            <img
              className={styles.photo}
              src={photo.thumb}
              alt=""
              width={photo.thumbWidth}
              height={photo.thumbHeight}
              decoding="async"
              draggable={false}
              style={{ backgroundImage: `url(${photo.blur})`, backgroundColor: photo.color }}
            />
            {missed && <span className={styles.missTint} />}
            {matched && (
              <span className={styles.badge} style={{ width: badgeSize, height: badgeSize }}>
                <Heart fill="currentColor" strokeWidth={0} style={{ width: '58%', height: '58%' }} />
              </span>
            )}
          </span>
        </motion.span>
      </button>
    </motion.div>
  )
}

export default memo(MemoryCard)
