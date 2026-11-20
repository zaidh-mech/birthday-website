'use client'

import type { ReactNode } from 'react'
import Reveal from './Reveal'
import { EYEBROW } from './types'

interface SectionHeadingProps {
  eyebrow: string
  icon?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  className?: string
}

export default function SectionHeading({ eyebrow, icon, title, subtitle, className = '' }: SectionHeadingProps) {
  return (
    <Reveal className={`mx-auto mb-10 max-w-2xl text-center sm:mb-14 2xl:max-w-3xl ${className}`}>
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-rose-100 bg-white/70 px-3.5 py-1.5 shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-white/5">
        {icon}
        <span className={EYEBROW}>{eyebrow}</span>
      </div>
      <h2 className="text-balance font-serif text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl 2xl:text-6xl dark:text-gray-100">
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto mt-3 max-w-xl text-pretty font-serif text-sm italic leading-relaxed text-rose-900/75 sm:text-base md:text-lg dark:text-rose-100/75">
          {subtitle}
        </p>
      )}
    </Reveal>
  )
}
