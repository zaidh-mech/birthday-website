'use client'

import Link from 'next/link'
import { useRef, type PointerEvent } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ArrowRight, Trophy, Sparkles } from 'lucide-react'
import type { GameInfo } from '@/data/games'
import styles from './HubCard.module.css'

interface HubCardProps {
  game: GameInfo
  index: number
  /** Text for the best-score chip; null until mounted (keeps SSR and first paint identical). */
  bestText: string | null
  /** Whether that chip shows an actual record (gets the trophy styling). */
  hasRecord: boolean
  /** Lit up by the "Surprise me" roulette. */
  highlighted: boolean
  /** Desktop pointer that can hover and no reduced-motion preference. */
  canTilt: boolean
  reduceMotion: boolean
}

const TILT = 9

export default function HubCard({ game, index, bestText, hasRecord, highlighted, canTilt, reduceMotion }: HubCardProps) {
  const ref = useRef<HTMLAnchorElement>(null)

  // Pointer position over the card, 0..1 on both axes (0.5 = centre).
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const spring = { stiffness: 210, damping: 20, mass: 0.6 }
  const rotateX = useSpring(useTransform(py, [0, 1], [TILT, -TILT]), spring)
  const rotateY = useSpring(useTransform(px, [0, 1], [-TILT, TILT]), spring)
  // The emoji drifts the opposite way for a little parallax depth.
  const emojiX = useSpring(useTransform(px, [0, 1], [10, -10]), spring)
  const emojiY = useSpring(useTransform(py, [0, 1], [8, -8]), spring)
  const glareX = useTransform(px, (v) => v * 100)
  const glareY = useTransform(py, (v) => v * 100)
  const glare = useMotionTemplate`radial-gradient(520px circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.42), rgba(255,255,255,0.08) 35%, transparent 60%)`

  const handleMove = (e: PointerEvent<HTMLAnchorElement>) => {
    if (!canTilt || e.pointerType !== 'mouse' || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    px.set(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)))
    py.set(Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)))
  }

  const handleLeave = () => {
    px.set(0.5)
    py.set(0.5)
  }

  const number = String(index + 1).padStart(2, '0')

  return (
    <motion.li
      className="list-none"
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 36, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: reduceMotion ? 0.3 : 0.7, delay: reduceMotion ? 0 : (index % 3) * 0.09 + 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        ref={ref}
        href={game.href}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        aria-label={`Play ${game.title}${bestText && hasRecord ? `. ${bestText}` : ''}`}
        className={`${styles.card} group block h-full rounded-[1.75rem] outline-none transition-shadow duration-300 focus-visible:ring-4 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fdfbf7] dark:focus-visible:ring-purple-400 dark:focus-visible:ring-offset-[#0B0C10] ${
          highlighted ? 'ring-4 ring-rose-400/80 ring-offset-2 ring-offset-[#fdfbf7] dark:ring-purple-300/80 dark:ring-offset-[#0B0C10]' : ''
        }`}
      >
        <motion.div
          style={canTilt ? { rotateX, rotateY, transformPerspective: 1100 } : undefined}
          whileHover={canTilt ? { y: -8 } : undefined}
          whileTap={reduceMotion ? undefined : { scale: 0.975 }}
          animate={highlighted && !reduceMotion ? { y: -6, scale: 1.015 } : { y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          className="relative flex h-full flex-col rounded-[1.75rem] border border-rose-100/80 bg-white/65 shadow-[0_10px_30px_-12px_rgba(244,63,94,0.25)] backdrop-blur-md transition-shadow duration-500 group-hover:shadow-[0_30px_60px_-20px_rgba(244,63,94,0.45)] dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)] dark:group-hover:shadow-[0_30px_60px_-18px_rgba(168,85,247,0.4)]"
        >
          {/* Art panel */}
          <div className={`relative m-2.5 aspect-[16/10] overflow-hidden rounded-[1.35rem] bg-gradient-to-br sm:m-3 ${game.gradient}`}>
            <div className={styles.pattern} aria-hidden />
            <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/40 blur-2xl" aria-hidden />
            <div className="absolute -bottom-12 -right-8 h-36 w-36 rounded-full bg-white/25 blur-2xl dark:bg-black/10" aria-hidden />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/10 dark:from-black/35" aria-hidden />

            <span className="absolute left-4 top-3 font-serif text-sm font-bold tracking-widest text-white/85 drop-shadow-sm" aria-hidden>
              No. {number}
            </span>
            <Sparkles className={`${styles.sparkle} right-4 top-3.5 h-4 w-4 text-white/90`} style={{ animationDelay: `${index * 0.4}s` }} aria-hidden />
            <span className={`${styles.sparkle} bottom-4 left-6 text-xs text-white/80`} style={{ animationDelay: `${index * 0.4 + 1.3}s` }} aria-hidden>
              ✦
            </span>

            <motion.div className="absolute inset-0 grid place-items-center" style={canTilt ? { x: emojiX, y: emojiY } : undefined} aria-hidden>
              <div className={styles.halo} />
              <span className={styles.float} style={{ animationDelay: `${index * -0.7}s` }}>
                <span className="block text-6xl drop-shadow-[0_10px_18px_rgba(0,0,0,0.22)] transition-transform duration-500 group-hover:scale-110 sm:text-7xl">
                  {game.emoji}
                </span>
              </span>
            </motion.div>

            <div className={styles.shine} aria-hidden />
          </div>

          {/* Body */}
          <div className="flex flex-1 flex-col px-5 pb-5 pt-2 sm:px-6 sm:pb-6">
            <h2 className="font-serif text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{game.title}</h2>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{game.tagline}</p>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
              <span
                className={`inline-flex min-h-[1.75rem] max-w-full items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  hasRecord
                    ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/70 dark:bg-amber-300/10 dark:text-amber-200 dark:ring-amber-200/20'
                    : 'bg-rose-50 text-rose-500 dark:bg-white/5 dark:text-purple-200'
                } ${bestText === null ? 'invisible' : ''}`}
              >
                {hasRecord && <Trophy className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                <span className="truncate">{bestText ?? 'No score yet'}</span>
              </span>

              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors duration-300 group-hover:bg-rose-500 dark:bg-white dark:text-gray-900 dark:group-hover:bg-purple-300">
                Play
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
              </span>
            </div>
          </div>

          {/* Moving glare (desktop hover only) */}
          {canTilt && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[1.75rem] opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:group-hover:opacity-50"
              style={{ background: glare }}
            />
          )}
        </motion.div>
      </Link>
    </motion.li>
  )
}
