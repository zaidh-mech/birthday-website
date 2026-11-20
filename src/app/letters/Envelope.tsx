'use client'

import { memo, type PointerEvent as ReactPointerEvent } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { Heart } from 'lucide-react'
import type { Letter } from '@/data/initialData'
import styles from './letters.module.css'

export type EnvelopePhase = 'closed' | 'open' | 'closing'

const TONES = [styles.tone0, styles.tone1, styles.tone2, styles.tone3, styles.tone4]

interface EnvelopeProps {
  letter: Letter
  index: number
  tone: number
  tilt: number
  unread: boolean
  phase: EnvelopePhase
  dateLabel: string | null
  /** Mouse + motion allowed: enables the 3D tilt that follows the cursor. */
  fancy: boolean
  reduceMotion: boolean
  onOpen: (index: number) => void
  registerRef: (id: string, el: HTMLButtonElement | null) => void
}

function EnvelopeImpl({ letter, index, tone, tilt, unread, phase, dateLabel, fancy, reduceMotion, onOpen, registerRef }: EnvelopeProps) {
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const springX = useSpring(rotateX, { stiffness: 200, damping: 18 })
  const springY = useSpring(rotateY, { stiffness: 200, damping: 18 })

  const handleMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!fancy || e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    rotateY.set(px * 14)
    rotateX.set(-py * 10)
  }
  const handleLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
  }

  const title = letter.title.trim() || 'A letter for you'
  const occasion = letter.occasion.trim()
  const number = String(index + 1).padStart(2, '0')
  const phaseClass = phase === 'open' ? styles.isOpen : phase === 'closing' ? styles.isClosing : ''
  const label = `Open letter ${index + 1}: ${title}${occasion ? ` (${occasion})` : ''}${dateLabel ? `, written ${dateLabel}` : ''}${unread ? '. Not read yet' : ''}`

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={{ type: 'spring', stiffness: 110, damping: 18, delay: (index % 3) * 0.08 }}
      className="w-full"
    >
      <motion.div
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        initial={false}
        animate={{ rotate: tilt, y: 0, scale: 1 }}
        whileHover={fancy ? { rotate: 0, y: -12, scale: 1.02 } : undefined}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        style={fancy ? { rotateX: springX, rotateY: springY, transformPerspective: 1000 } : undefined}
        className="relative"
      >
        <button
          ref={(el) => registerRef(letter.id, el)}
          type="button"
          onClick={() => onOpen(index)}
          aria-label={label}
          className={styles.card}
        >
          <span className={`${styles.envelope} ${TONES[tone % TONES.length]} ${phaseClass}`}>
            <span className={styles.back} />
            <span className={styles.innerPaper}>
              <span className={`${styles.greeting} font-cursive text-[13px] sm:text-sm`}>My love,</span>
            </span>
            <span className={styles.pockets}>
              <span className={`${styles.pocket} ${styles.pocketLeft}`} />
              <span className={`${styles.pocket} ${styles.pocketRight}`} />
              <span className={`${styles.pocket} ${styles.pocketBottom}`} />
            </span>
            <span className={styles.flapShade} />
            <span className={styles.flap}>
              <span className={styles.flapFront} />
              <span className={styles.flapBack} />
              <span className={styles.seal}>
                <Heart fill="currentColor" strokeWidth={0} aria-hidden="true" />
              </span>
            </span>
            <span className={styles.label}>
              {occasion && (
                <span className="block max-w-full truncate text-[9px] font-semibold uppercase tracking-[0.22em] opacity-75 sm:text-[10px]">
                  {occasion}
                </span>
              )}
              <span className="line-clamp-2 block max-w-full font-cursive text-lg leading-[1.15] sm:text-xl lg:text-[1.4rem]">
                {title}
              </span>
            </span>
          </span>

          <span className="mt-4 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-400 dark:text-purple-300/80">
            <span>No. {number}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{dateLabel ?? 'Sealed with love'}</span>
          </span>
        </button>

        {unread && (
          <span className="pointer-events-none absolute -right-1.5 -top-1.5 z-10 flex h-4 w-4" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-70 motion-safe:animate-ping dark:bg-purple-400" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-rose-500 shadow-[0_0_14px_rgba(244,63,94,0.85)] ring-2 ring-[#fdfbf7] dark:bg-purple-400 dark:shadow-[0_0_14px_rgba(192,132,252,0.9)] dark:ring-[#0B0C10]" />
          </span>
        )}
      </motion.div>
    </motion.div>
  )
}

const Envelope = memo(EnvelopeImpl)
export default Envelope
