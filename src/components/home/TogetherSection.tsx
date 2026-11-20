'use client'

import { useEffect, useState } from 'react'
import { Clock, HandHeart } from 'lucide-react'
import { useSiteConfig } from '@/lib/siteConfig'
import { useMounted } from '@/lib/hooks'
import AnniversaryCounter from './AnniversaryCounter'
import BirthdayCountdown from './BirthdayCountdown'
import UsStats from './UsStats'
import Reveal from './Reveal'
import SectionHeading from './SectionHeading'
import { GLASS_CARD, petName } from './types'

/** How long to wait for the cloud config before showing the fallback stats. */
const CONFIG_GRACE_MS = 2500

export default function TogetherSection({ id }: { id: string }) {
  const { config, loaded } = useSiteConfig()
  const mounted = useMounted()
  const [graceOver, setGraceOver] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setGraceOver(true), CONFIG_GRACE_MS)
    return () => window.clearTimeout(t)
  }, [])

  const hasAnniversary = Boolean(config.anniversaryDate)
  const hasBirthday = Boolean(config.birthdayDate)
  const ready = mounted && (loaded || graceOver || hasAnniversary || hasBirthday)
  const counting = hasAnniversary || hasBirthday
  const years = config.yearsTogether

  return (
    <section id={id} className="relative scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24">
      <SectionHeading
        eyebrow={counting ? 'Every second counts' : 'Us, in numbers'}
        icon={counting ? <Clock className="h-3.5 w-3.5 text-rose-400 dark:text-purple-300" aria-hidden /> : <HandHeart className="h-3.5 w-3.5 text-rose-400 dark:text-purple-300" aria-hidden />}
        title={counting ? 'Counting every moment with you' : `${years} ${years === 1 ? 'year' : 'years'} of us`}
        subtitle={
          counting
            ? 'I keep count because every second with you is worth remembering.'
            : 'Every number here is a little piece of our story, and it keeps growing.'
        }
      />

      <Reveal className="mx-auto w-full max-w-5xl">
        {!ready ? (
          <div aria-hidden className={`${GLASS_CARD} mx-auto h-72 max-w-3xl animate-pulse`} />
        ) : counting ? (
          <div className={`grid gap-5 sm:gap-6 ${hasAnniversary && hasBirthday ? 'lg:grid-cols-[1.25fr_1fr]' : 'mx-auto max-w-2xl'}`}>
            {hasAnniversary && <AnniversaryCounter date={config.anniversaryDate} />}
            {hasBirthday && <BirthdayCountdown date={config.birthdayDate} name={petName(config.herName, config.nicknames)} />}
          </div>
        ) : (
          <div className="mx-auto max-w-4xl">
            <UsStats years={years} reasonsCount={config.reasons.length} />
          </div>
        )}
      </Reveal>
    </section>
  )
}
