'use client'

import { useRef, type PointerEvent } from 'react'
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion'
import { Gift, Images } from 'lucide-react'
import { useSiteConfig } from '@/lib/siteConfig'
import { useCanHover, usePrefersReducedMotion } from '@/lib/hooks'
import AnimatedHeadline from './AnimatedHeadline'
import GreetingChip from './GreetingChip'
import HeroPolaroids from './HeroPolaroids'
import HeroSparkles from './HeroSparkles'
import MagneticLink from './MagneticLink'
import styles from './Hero.module.css'

const EASE = [0.16, 1, 0.3, 1] as const

export default function HeroSection({ nextId }: { nextId: string }) {
  const sectionRef = useRef<HTMLElement>(null)
  const { config } = useSiteConfig()
  const canHover = useCanHover()
  const reduce = usePrefersReducedMotion()
  const parallaxOn = canHover && !reduce
  const years = config.yearsTogether

  // Mouse position over the hero, -0.5…0.5 on each axis, smoothed.
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 60, damping: 18, mass: 0.6 })
  const sy = useSpring(my, { stiffness: 60, damping: 18, mass: 0.6 })
  const cardX = useTransform(sx, (v) => v * 16)
  const cardY = useTransform(sy, (v) => v * 12)
  const cardRotateY = useTransform(sx, (v) => v * 5)
  const cardRotateX = useTransform(sy, (v) => v * -5)

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (!parallaxOn || e.pointerType !== 'mouse' || !sectionRef.current) return
    const rect = sectionRef.current.getBoundingClientRect()
    mx.set((e.clientX - rect.left) / rect.width - 0.5)
    my.set((e.clientY - rect.top) / rect.height - 0.5)
  }
  const onPointerLeave = () => {
    mx.set(0)
    my.set(0)
  }

  const { scrollY } = useScroll()
  const cueOpacity = useTransform(scrollY, [0, 180], [1, 0])

  const scrollNext = () => {
    document.getElementById(nextId)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <section
      ref={sectionRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      aria-label="Welcome"
      className="relative isolate flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden px-4 pb-20 pt-24 sm:px-6 sm:pb-24 sm:pt-28"
    >
      <HeroSparkles hostRef={sectionRef} />

      {/* Phones: reserved bands where the corner polaroids rest, so they never cover the text. */}
      <div aria-hidden className="h-28 w-full shrink-0 sm:hidden" />

      <motion.div
        className="relative z-[100] w-full max-w-2xl lg:max-w-3xl 2xl:max-w-4xl"
        style={parallaxOn ? { x: cardX, y: cardY, rotateX: cardRotateX, rotateY: cardRotateY, transformPerspective: 1200 } : undefined}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
          <div className={`${styles.aurora} aspect-square w-[115%] max-w-[56rem] shrink-0 rounded-full opacity-60 dark:opacity-50`} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease: EASE, delay: 0.1 }}
          className="relative space-y-4 rounded-[2rem] border border-white/60 bg-white/45 px-4 py-6 text-center shadow-2xl shadow-rose-300/20 backdrop-blur-md min-[380px]:px-5 sm:space-y-6 sm:rounded-[2.5rem] sm:p-8 md:space-y-8 md:rounded-[3rem] md:p-10 2xl:p-14 dark:border-white/10 dark:bg-black/30 dark:shadow-purple-950/30"
        >
          <div className="flex justify-center">
            <GreetingChip herName={config.herName} nicknames={config.nicknames} />
          </div>

          <AnimatedHeadline years={years} />

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 1.05 }}
            className="mx-auto max-w-xl text-pretty font-serif text-sm italic leading-relaxed text-rose-900/80 sm:text-base md:text-xl 2xl:max-w-2xl 2xl:text-2xl dark:text-rose-100/80"
          >
            &ldquo;A tiny universe holding my letters to you, our memories from the past {years} years, and all the quiet moments we
            share.&rdquo;
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 1.25 }}
            className="flex flex-col items-stretch justify-center gap-2.5 pt-1 sm:flex-row sm:items-center sm:gap-3 md:pt-2"
          >
            <MagneticLink
              href="/gift"
              wrapperClassName="flex sm:inline-flex"
              className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-rose-400 via-rose-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-400/30 transition-shadow duration-500 hover:shadow-xl hover:shadow-rose-400/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300/60 sm:w-auto sm:px-8 sm:py-3.5 sm:text-base 2xl:px-10 2xl:py-4 2xl:text-lg dark:from-purple-500 dark:via-fuchsia-500 dark:to-purple-500 dark:shadow-purple-500/30 dark:hover:shadow-purple-500/50 dark:focus-visible:ring-purple-400/50"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/45 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-[420%]"
              />
              <Gift className="h-4 w-4 transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110 sm:h-5 sm:w-5" aria-hidden />
              Explore your surprise gift
            </MagneticLink>
            <MagneticLink
              href="/memories"
              wrapperClassName="flex sm:inline-flex"
              strength={0.22}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-rose-200 bg-white/70 px-6 py-3 text-sm font-semibold text-rose-600 shadow-sm backdrop-blur-md transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300/60 sm:w-auto sm:px-7 sm:py-3.5 sm:text-base 2xl:px-9 2xl:py-4 2xl:text-lg dark:border-white/15 dark:bg-white/10 dark:text-purple-100 dark:hover:bg-white/15 dark:focus-visible:ring-purple-400/50"
            >
              <Images className="h-4 w-4 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110 sm:h-5 sm:w-5" aria-hidden />
              Open our memories
            </MagneticLink>
          </motion.div>
        </motion.div>
      </motion.div>

      <div aria-hidden className="h-28 w-full shrink-0 sm:hidden" />

      {/* After the card in the DOM so keyboard users reach the headline links first; z-index handles stacking. */}
      <HeroPolaroids constraintsRef={sectionRef} parallaxX={sx} parallaxY={sy} parallaxOn={parallaxOn} canHover={canHover} />

      <motion.button
        type="button"
        onClick={scrollNext}
        style={{ opacity: cueOpacity }}
        aria-label="Scroll to the next section"
        className="absolute bottom-4 left-1/2 z-[110] flex -translate-x-1/2 flex-col items-center gap-1.5 rounded-full px-3 py-1 text-rose-400 transition-colors hover:text-rose-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300/60 sm:bottom-6 dark:text-purple-200/80 dark:hover:text-purple-100"
      >
        <span className="hidden text-[10px] font-semibold uppercase tracking-[0.3em] sm:block">Scroll, my love</span>
        <span className="flex h-9 w-6 items-start justify-center rounded-full border-2 border-current p-1">
          <span className={`${styles.cue} block h-2 w-1 rounded-full bg-current`} />
        </span>
      </motion.button>
    </section>
  )
}
