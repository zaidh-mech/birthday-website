'use client'

import type { ReactNode } from 'react'
import { ArrowRight, Compass } from 'lucide-react'
import Reveal from './Reveal'
import SectionHeading from './SectionHeading'
import TiltCard from './TiltCard'
import { EnvelopesVisual, GamesVisual, PhotoFanVisual, TicketVisual } from './ExploreVisuals'

interface ExploreCard {
  href: string
  title: string
  blurb: string
  visual: ReactNode
  backdrop: string
}

const CARDS: ExploreCard[] = [
  {
    href: '/letters',
    title: 'Letters',
    blurb: 'Words I wrote just for you, sealed with love.',
    visual: <EnvelopesVisual />,
    backdrop: 'from-rose-100 via-amber-50 to-pink-100 dark:from-rose-500/15 dark:via-white/5 dark:to-purple-500/15',
  },
  {
    href: '/memories',
    title: 'Memories',
    blurb: 'Our years together, one photo at a time.',
    visual: <PhotoFanVisual />,
    backdrop: 'from-amber-100 via-rose-50 to-orange-100 dark:from-amber-400/10 dark:via-white/5 dark:to-rose-500/15',
  },
  {
    href: '/games',
    title: 'Games',
    blurb: 'Little games I made for you to play.',
    visual: <GamesVisual />,
    backdrop: 'from-fuchsia-100 via-pink-50 to-violet-100 dark:from-fuchsia-500/15 dark:via-white/5 dark:to-indigo-500/15',
  },
  {
    href: '/gift',
    title: 'Your gift',
    blurb: 'A surprise date, planned with all my heart.',
    visual: <TicketVisual />,
    backdrop: 'from-pink-100 via-rose-50 to-amber-100 dark:from-pink-500/15 dark:via-white/5 dark:to-amber-400/10',
  },
]

export default function ExploreSection() {
  return (
    <section id="explore" className="relative scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24">
      <SectionHeading
        eyebrow="Wander around"
        icon={<Compass className="h-3.5 w-3.5 text-rose-400 dark:text-purple-300" aria-hidden />}
        title="Everything I made for you"
        subtitle="Every corner of this little world has something of us in it. Go explore, my love."
      />
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 min-[480px]:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:max-w-7xl">
        {CARDS.map((card, i) => (
          <Reveal key={card.href} delay={i * 0.08} className="h-full">
            <TiltCard href={card.href}>
              <div className={`relative h-36 overflow-hidden rounded-2xl bg-gradient-to-br sm:h-40 2xl:h-48 ${card.backdrop}`}>{card.visual}</div>
              <div className="mt-4 flex flex-1 items-start justify-between gap-3 px-1 pb-1">
                <div className="min-w-0">
                  <h3 className="font-serif text-xl font-bold text-gray-900 sm:text-2xl dark:text-gray-100">{card.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{card.blurb}</p>
                </div>
                <span className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rose-500 text-white shadow-md shadow-rose-500/25 transition-[translate,background-color] duration-300 group-hover:translate-x-1 group-hover:bg-rose-600 dark:bg-purple-500 dark:shadow-purple-500/25 dark:group-hover:bg-purple-400">
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              </div>
            </TiltCard>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
