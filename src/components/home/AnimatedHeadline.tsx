'use client'

import { useMemo, useState, type MouseEvent, type PointerEvent } from 'react'
import { motion } from 'framer-motion'
import { burstFromElement } from '@/lib/celebrate'
import { haptic, sfx } from '@/lib/sound'
import { usePrefersReducedMotion } from '@/lib/hooks'
import styles from './Hero.module.css'

const EASE = [0.16, 1, 0.3, 1] as const
const START = 0.35
const LETTER_DELAY = 0.032

interface Letter {
  ch: string
  i: number
}

/** Splits each line into words → letters, numbering letters across lines for the stagger. */
function splitLines(lines: string[]): Letter[][][] {
  let i = 0
  return lines.map((line) => line.split(' ').map((word) => Array.from(word).map((ch) => ({ ch, i: i++ }))))
}

interface Ripple {
  id: number
  x: number
  y: number
}

export default function AnimatedHeadline({ years }: { years: number }) {
  const reduce = usePrefersReducedMotion()
  const [ripples, setRipples] = useState<Ripple[]>([])

  const lines = useMemo(() => [`Happy ${years} Years,`, '& Happy Birthday'], [years])
  const split = useMemo(() => splitLines(lines), [lines])
  const letterCount = split.flat(2).length
  const cursiveDelay = START + letterCount * LETTER_DELAY + 0.05

  const onPointerDown = (e: PointerEvent<HTMLSpanElement>) => {
    const letter = (e.target as HTMLElement).closest<HTMLElement>('[data-letter]')
    if (letter && !reduce && typeof letter.animate === 'function') {
      letter.animate(
        [
          { transform: 'translateY(0) rotate(0) scale(1)' },
          { transform: 'translateY(-0.28em) rotate(-8deg) scale(1.18)', offset: 0.4 },
          { transform: 'translateY(0) rotate(0) scale(1)' },
        ],
        { duration: 560, easing: 'cubic-bezier(.34,1.56,.64,1)' },
      )
    }
    if (e.pointerType !== 'mouse') {
      const rect = e.currentTarget.getBoundingClientRect()
      const id = performance.now() + Math.random()
      setRipples((r) => [...r.slice(-3), { id, x: e.clientX - rect.left, y: e.clientY - rect.top }])
      window.setTimeout(() => setRipples((r) => r.filter((x) => x.id !== id)), 750)
    }
  }

  const onCursiveClick = (e: MouseEvent<HTMLSpanElement>) => {
    burstFromElement(e.currentTarget, { hearts: true, particleCount: 28, spread: 80 })
    sfx.sparkle()
    haptic(15)
  }

  const full = `${lines.join(' ')} my everything.`

  return (
    <h1 className="relative font-serif text-[2rem] font-bold leading-[1.08] tracking-tight text-gray-900 min-[380px]:text-[2.25rem] sm:text-5xl md:text-6xl lg:text-7xl 2xl:text-8xl dark:text-gray-100">
      <span className="sr-only">{full}</span>
      <span aria-hidden="true" className="relative block" onPointerDown={onPointerDown}>
        {split.map((words, li) => (
          <span key={li} className="block">
            {words.map((letters, wi) => (
              <span key={wi}>
                <span className="inline-block whitespace-nowrap">
                  {letters.map(({ ch, i }) => (
                    <motion.span
                      key={i}
                      className="inline-block"
                      style={{ transformPerspective: 600 }}
                      initial={{ opacity: 0, y: '0.55em', rotateX: -70, filter: 'blur(8px)' }}
                      animate={{ opacity: 1, y: '0em', rotateX: 0, filter: 'blur(0px)' }}
                      transition={{ duration: 0.85, delay: START + i * LETTER_DELAY, ease: EASE }}
                    >
                      <span
                        data-letter
                        className="inline-block cursor-default transition-[translate,scale,rotate,color] duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] hover:-translate-y-[0.14em] hover:-rotate-3 hover:scale-110 hover:text-rose-500 dark:hover:text-purple-300"
                      >
                        {ch}
                      </span>
                    </motion.span>
                  ))}
                </span>
                {wi < words.length - 1 ? ' ' : null}
              </span>
            ))}
          </span>
        ))}

        <span className="mt-1 block sm:mt-2">
          <motion.span
            className="relative inline-block cursor-pointer select-none px-[0.06em] pb-[0.14em] text-[1.12em] font-normal"
            initial={{ clipPath: 'inset(-50% 100% -50% -20%)', opacity: 0.3 }}
            animate={{ clipPath: 'inset(-50% -20% -50% -20%)', opacity: 1 }}
            transition={{ duration: 1.5, delay: cursiveDelay, ease: [0.65, 0, 0.35, 1] }}
            onClick={onCursiveClick}
          >
            <span className={`font-cursive ${styles.shimmer}`}>my everything.</span>
            <svg
              viewBox="0 0 300 24"
              preserveAspectRatio="none"
              className="pointer-events-none absolute -bottom-[0.02em] left-[6%] h-[0.26em] w-[88%] overflow-visible"
            >
              <motion.path
                d="M4 16 C 60 4, 120 22, 170 12 S 260 5, 296 13"
                fill="none"
                strokeWidth={3}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                className="stroke-rose-300 dark:stroke-purple-400/70"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.1, delay: cursiveDelay + 1.1, ease: 'easeInOut' }}
              />
            </svg>
          </motion.span>
        </span>

        {ripples.map((r) => (
          <span
            key={r.id}
            className={`${styles.ripple} pointer-events-none absolute h-40 w-40 rounded-full bg-rose-300/40 dark:bg-purple-300/25`}
            style={{ left: r.x, top: r.y }}
          />
        ))}
      </span>
    </h1>
  )
}
