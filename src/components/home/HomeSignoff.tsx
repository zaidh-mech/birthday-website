'use client'

import { ArrowUp, Heart } from 'lucide-react'
import { useSiteConfig } from '@/lib/siteConfig'
import { usePrefersReducedMotion } from '@/lib/hooks'
import Reveal from './Reveal'
import styles from './Hero.module.css'

export default function HomeSignoff() {
  const { config } = useSiteConfig()
  const reduce = usePrefersReducedMotion()

  return (
    <section aria-label="Sign-off" className="relative px-4 pb-6 pt-8 text-center sm:px-6 sm:pt-12">
      <Reveal className="mx-auto max-w-xl">
        <Heart className={`${styles.heartbeat} mx-auto h-8 w-8 fill-rose-400 text-rose-400 dark:fill-purple-300 dark:text-purple-300`} aria-hidden />
        <p className="mt-4 font-cursive text-3xl text-rose-500 sm:text-4xl dark:text-purple-200">Forever yours,</p>
        <p className="mt-1 font-serif text-lg font-semibold text-gray-800 sm:text-xl dark:text-gray-100">{config.fromName}</p>
        <p className="mx-auto mt-3 max-w-sm text-pretty text-sm text-gray-500 dark:text-gray-400">
          Made by hand, line by line, for the person who makes every day better.
        </p>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })}
          className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-rose-100 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-rose-500 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300/60 dark:border-white/10 dark:bg-white/5 dark:text-purple-200 dark:hover:bg-white/10"
        >
          <ArrowUp className="h-3.5 w-3.5" aria-hidden /> Back to the top
        </button>
      </Reveal>
    </section>
  )
}
