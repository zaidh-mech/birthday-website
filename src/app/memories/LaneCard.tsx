'use client'

import { memo, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { motion, useInView, useMotionValue, useSpring, type Variants } from 'framer-motion'
import { Heart, Play } from 'lucide-react'
import { cardRatio, glowRgb, tiltFor, type ViewerItem } from './viewerItems'
import styles from './memories.module.css'

interface LaneCardProps {
  item: ViewerItem
  index: number
  onOpen: (index: number) => void
  isFavourite: boolean
  canHover: boolean
  reduceMotion: boolean
}

/** A polaroid-style print on Memory Lane. Hover: lift, straighten, tilt and glow. Tap: open. */
function LaneCard({ item, index, onOpen, isFavourite, canHover, reduceMotion }: LaneCardProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [loaded, setLoaded] = useState(false)
  const inView = useInView(ref, { once: true, margin: '200px' })

  const tilt = useMemo(() => tiltFor(item.id), [item.id])
  const rgb = useMemo(() => glowRgb(item.color), [item.color])
  const ratio = cardRatio(item)
  const interactive = canHover && !reduceMotion

  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 200, damping: 18, mass: 0.6 })
  const sry = useSpring(ry, { stiffness: 200, damping: 18, mass: 0.6 })

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) setLoaded(true)
  }, [])

  const variants: Variants = useMemo(
    () => ({
      rest: { rotate: tilt, y: 0, scale: 1, zIndex: 1 },
      hover: { rotate: 0, y: -10, scale: 1.035, zIndex: 10 },
    }),
    [tilt],
  )
  const frameVariants: Variants = useMemo(
    () => ({
      rest: { boxShadow: '0 12px 28px -14px rgba(60, 20, 30, 0.35)' },
      hover: { boxShadow: `0 30px 60px -18px rgba(${rgb}, 0.75)` },
    }),
    [rgb],
  )

  function handlePointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    if (!interactive || e.pointerType !== 'mouse') return
    const rect = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    ry.set(px * 14)
    rx.set(-py * 14)
  }

  function handleHoverStart() {
    if (item.kind === 'video' && videoRef.current) {
      videoRef.current.play().catch(() => {})
    }
  }

  function handleHoverEnd() {
    rx.set(0)
    ry.set(0)
    if (item.kind === 'video' && videoRef.current) {
      videoRef.current.pause()
    }
  }

  const label = `${item.kind === 'video' ? 'Play video' : 'Open photo'}: ${item.title || 'memory'}${item.dateLabel ? `, ${item.dateLabel}` : ''}`

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={() => onOpen(index)}
      aria-label={label}
      variants={variants}
      initial="rest"
      animate="rest"
      whileHover={interactive ? 'hover' : undefined}
      whileFocus={reduceMotion ? undefined : 'hover'}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      onPointerMove={handlePointerMove}
      onHoverStart={canHover ? handleHoverStart : undefined}
      onHoverEnd={handleHoverEnd}
      className={`group relative block w-full cursor-pointer rounded-[4px] text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300/70 dark:focus-visible:ring-purple-400/50 ${styles.sheenHost}`}
    >
      <motion.div style={{ rotateX: srx, rotateY: sry, transformPerspective: 900 }}>
        <motion.div
          variants={frameVariants}
          className="relative rounded-[4px] bg-white p-1.5 pb-7 ring-1 ring-black/[0.04] dark:bg-[#f5f1ea] sm:p-2 sm:pb-9"
        >
          <div
            className="relative w-full overflow-hidden rounded-[2px] bg-rose-100 dark:bg-[#2a2433]"
            style={{
              aspectRatio: `1 / ${ratio}`,
              backgroundImage: item.blur ? `url("${item.blur}")` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center 30%',
            }}
          >
            {item.kind === 'image' && item.thumb && (
              <img
                ref={imgRef}
                src={item.thumb}
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
                onLoad={() => setLoaded(true)}
                className={`absolute inset-0 h-full w-full object-cover transition-[opacity,scale] duration-700 ease-out ${
                  loaded ? 'opacity-100' : 'opacity-0'
                } ${interactive ? 'group-hover:scale-[1.06]' : ''}`}
                style={{ objectPosition: 'center 30%' }}
              />
            )}

            {item.kind === 'video' && (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-rose-300 via-pink-400 to-purple-500" />
                <video
                  ref={videoRef}
                  src={inView ? `${item.src}#t=0.1` : undefined}
                  muted
                  loop
                  playsInline
                  preload={inView ? 'metadata' : 'none'}
                  className="absolute inset-0 h-full w-full object-cover"
                  aria-hidden="true"
                  tabIndex={-1}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover:bg-transparent">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-rose-500 shadow-lg backdrop-blur-sm transition-transform group-hover:scale-110 sm:h-14 sm:w-14">
                    <Play className="ml-0.5 h-5 w-5 fill-current sm:h-6 sm:w-6" />
                  </span>
                </div>
                <span className="absolute left-1.5 top-1.5 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                  Video
                </span>
              </>
            )}

            <span className={styles.sheen} aria-hidden="true" />

            {isFavourite && (
              <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow-md sm:h-7 sm:w-7">
                <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500 sm:h-4 sm:w-4" />
              </span>
            )}
          </div>

          <div className="absolute inset-x-2 bottom-1 flex items-baseline justify-between gap-2 sm:inset-x-3 sm:bottom-1.5">
            <span className="truncate font-cursive text-sm leading-6 text-gray-700 sm:text-lg sm:leading-8">{item.title}</span>
            {item.dateLabel && (
              <span className="hidden shrink-0 font-sans text-[10px] uppercase tracking-wider text-gray-400 min-[480px]:inline">
                {shortDate(item.dateLabel)}
              </span>
            )}
          </div>
        </motion.div>
      </motion.div>
    </motion.button>
  )
}

function shortDate(label: string): string {
  // "December 31, 2023" → "Dec 31"
  const m = label.match(/^([A-Za-z]{3})[A-Za-z]*\s+(\d{1,2})/)
  return m ? `${m[1]} ${m[2]}` : label
}

export default memo(LaneCard)
