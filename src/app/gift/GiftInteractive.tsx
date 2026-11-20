'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { places as defaultPlaces, evaluatePlaceForDate, type Place } from '@/data/places'
import {
  fetchDateAcceptance,
  fetchMemories,
  fetchPlaces,
  fetchSelectedGiftPlace,
  recordDateAcceptance,
  type DateRSVP,
} from '@/lib/storage'
import { useSiteConfig, whatsappLink } from '@/lib/siteConfig'
import { getPhotos } from '@/lib/photos'
import { celebrate } from '@/lib/celebrate'
import { sfx } from '@/lib/sound'
import { usePrefersReducedMotion } from '@/lib/hooks'
import { InviteStep, PleadStep, PuppyStep } from './AskSteps'
import { ColorStep, DateStep } from './PlanSteps'
import PlaceStep from './PlaceStep'
import StepProgress from './StepProgress'
import TicketStep from './TicketStep'
import type { TicketInfo } from './ticketCanvas'
import { formatMinutes, planDateWindow, type CalendarEvent } from './calendar'
import {
  STEP,
  colorByName,
  daysFromToday,
  friendlyDate,
  luminance,
  parseISODate,
  type CategoryId,
  type EvaluatedPlace,
  type GiftPhoto,
  type Step,
} from './giftData'

function pickLocalPhoto(): GiftPhoto | null {
  const photos = getPhotos()
  if (photos.length === 0) return null
  // Skip the near-black Snapchat frames; they look odd as a polaroid.
  const bright = photos.filter((p) => luminance(p.color) > 0.18)
  const pool = bright.length > 0 ? bright : photos
  const p = pool[Math.floor(Math.random() * pool.length)]
  return { src: p.thumb, alt: 'A photo of us', caption: 'us, being cute' }
}

function openInNewTab(url: string): boolean {
  try {
    const win = window.open(url, '_blank')
    if (win) {
      try {
        win.opener = null
      } catch {
        /* cross-origin, fine */
      }
      return true
    }
  } catch {
    /* blocked */
  }
  return false
}

function isUsableRsvp(r: DateRSVP | null): r is DateRSVP {
  if (!r || typeof r !== 'object') return false
  if (typeof r.date !== 'string' || typeof r.placeName !== 'string' || typeof r.time !== 'string') return false
  const days = daysFromToday(r.date)
  return days !== null && days >= 0
}

function acceptMessage(r: DateRSVP, years: number): string {
  return `❤️ INVITATION ACCEPTED! ❤️\n\nHey my love! I just chose our date spot for our ${years}-Year Anniversary! 🥰\n\n📍 *Destination:* ${r.placeName} (${r.placeSubtitle})\n📅 *Date:* ${r.formattedDate}\n⏰ *Time:* ${r.time}\n✨ *Offering:* ${r.format}\n💳 *Price / Details:* ${r.price}\n🎨 *Dress Theme:* ${r.color}\n\nI can't wait to celebrate with you! Mwah! 😘`
}

function noteMessage(r: DateRSVP, years: number, note: string): string {
  const base = `Hey my love! ❤️\n\nI'm so excited for our ${years}-Year Anniversary! 🥰\nI'm ready for our date:\n📍 *Where:* ${r.placeName} (${r.placeSubtitle})\n📅 *When:* ${r.formattedDate}\n⏰ *Time:* ${r.time}\n✨ *Offering:* ${r.format}\n🎨 *Dress Theme:* ${r.color}\n\n`
  const trimmed = note.trim()
  return trimmed ? `${base}*My message to you:* ${trimmed}` : `${base}I can't wait to see you! 😘`
}

export default function GiftInteractive() {
  const { config } = useSiteConfig()
  const reduce = usePrefersReducedMotion()

  const [step, setStep] = useState<Step>(STEP.ask)
  const [direction, setDirection] = useState(1)
  const [date, setDate] = useState('')
  const [color, setColor] = useState('')
  const [allPlaces, setAllPlaces] = useState<Place[]>(defaultPlaces)
  const [featuredId, setFeaturedId] = useState<string | null>(null)
  const [chosenId, setChosenId] = useState<string | null>(null)
  const [filter, setFilter] = useState<CategoryId>('all')
  const [photo, setPhoto] = useState<GiftPhoto | null>(null)
  const [fallbackPhoto, setFallbackPhoto] = useState<GiftPhoto | null>(null)
  const [customMessage, setCustomMessage] = useState('')
  const [rsvp, setRsvp] = useState<DateRSVP | null>(null)
  const [existing, setExisting] = useState<DateRSVP | null>(null)
  const [waBlocked, setWaBlocked] = useState(false)
  const [waSent, setWaSent] = useState(false)

  useEffect(() => {
    let alive = true
    setFallbackPhoto(pickLocalPhoto())

    fetchMemories()
      .then((memories) => {
        const gift = memories.find((m) => m.title === '[GIFT_PHOTO]')
        if (alive && gift?.imagePath) setPhoto({ src: gift.imagePath, alt: 'The cute fella', caption: 'this cute fella' })
      })
      .catch(() => {})
    fetchPlaces()
      .then((list) => {
        if (alive && Array.isArray(list) && list.length > 0) setAllPlaces(list)
      })
      .catch(() => {})
    fetchSelectedGiftPlace()
      .then((id) => {
        if (alive && id) setFeaturedId(id)
      })
      .catch(() => {})
    fetchDateAcceptance()
      .then((r) => {
        if (alive && isUsableRsvp(r)) setExisting(r)
      })
      .catch(() => {})

    return () => {
      alive = false
    }
  }, [])

  // Warm up the photo while she's busy chasing the No button.
  useEffect(() => {
    if (step !== STEP.plead) return
    for (const p of [photo, fallbackPhoto]) {
      if (p) {
        const img = new Image()
        img.src = p.src
      }
    }
  }, [step, photo, fallbackPhoto])

  /* ---------------- places for the chosen day ---------------- */

  const evaluated = useMemo<EvaluatedPlace[]>(
    () => allPlaces.map((place) => ({ place, availability: evaluatePlaceForDate(place, date) })),
    [allPlaces, date],
  )
  const openPlaces = evaluated.filter((e) => e.availability.isOpen)
  const noneOpen = evaluated.length > 0 && openPlaces.length === 0
  const available = noneOpen ? evaluated : openPlaces

  // His featured pick goes first.
  const ordered = useMemo(() => {
    const pick = available.find((e) => e.place.id === featuredId)
    return pick ? [pick, ...available.filter((e) => e !== pick)] : available
  }, [available, featuredId])

  // Her choice if it's open that day, otherwise his pick, otherwise the first open place.
  const selected: EvaluatedPlace | null =
    available.find((e) => e.place.id === chosenId) ?? available.find((e) => e.place.id === featuredId) ?? available[0] ?? null

  /* ---------------- navigation ---------------- */

  // The leaving step stays clickable while it animates out; this lock stops
  // double taps from navigating twice (or opening WhatsApp twice).
  const navLock = useRef(0)
  const claim = (ms = 450) => {
    const now = performance.now()
    if (now < navLock.current) return false
    navLock.current = now + ms
    return true
  }

  const goTo = (next: Step, force = false) => {
    if (!force && !claim()) return
    setDirection(next >= step ? 1 : -1)
    setStep(next)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  const back = () => {
    if (step === STEP.ticket) goTo(STEP.place)
    else if (step > STEP.date) goTo((step - 1) as Step)
  }

  const sayYes = () => {
    if (!claim()) return
    sfx.win()
    celebrate()
    goTo(STEP.date, true)
  }

  const viewExisting = () => {
    if (!existing || !claim()) return
    setDate(existing.date)
    setColor(existing.color)
    setChosenId(existing.placeId)
    setCustomMessage(existing.customMessage ?? '')
    setRsvp(existing)
    setWaBlocked(false)
    setWaSent(false)
    sfx.chime()
    goTo(STEP.ticket, true)
  }

  /* ---------------- RSVP ---------------- */

  const accept = () => {
    if (!selected || !claim(1500)) return
    const { place, availability } = selected
    const note = customMessage.trim()
    const record: DateRSVP = {
      placeId: place.id,
      placeName: place.name,
      placeSubtitle: place.subtitle,
      date,
      formattedDate: availability.formattedDate,
      dayName: availability.dayName,
      time: availability.time,
      format: availability.format,
      price: availability.price,
      color,
      acceptedAt: new Date().toISOString(),
      ...(note ? { customMessage: note } : {}),
    }
    // Open WhatsApp synchronously inside the tap (iOS blocks pop-ups opened after an await)…
    const opened = openInNewTab(whatsappLink(config.whatsappNumber, acceptMessage(record, config.yearsTogether)))
    setWaBlocked(!opened)
    setWaSent(false)
    setRsvp(record)
    setExisting(record)
    // …and save the RSVP in the background.
    void recordDateAcceptance(record).catch(() => {})
    sfx.win()
    celebrate()
    goTo(STEP.ticket, true)
  }

  const onWhatsAppSent = () => {
    if (!rsvp) return
    const note = customMessage.trim()
    const { customMessage: _previous, ...rest } = rsvp
    const updated: DateRSVP = note ? { ...rest, customMessage: note } : rest
    setRsvp(updated)
    setExisting(updated)
    void recordDateAcceptance(updated).catch(() => {})
    setWaSent(true)
    sfx.sparkle()
  }

  /* ---------------- ticket ---------------- */

  const ticket = useMemo(() => {
    if (!rsvp) return null
    const slot = planDateWindow(rsvp.time)
    const day = parseISODate(rsvp.date)
    const dress = colorByName(rsvp.color)
    const years = config.yearsTogether
    const info: TicketInfo = {
      years,
      placeName: rsvp.placeName,
      placeSubtitle: rsvp.placeSubtitle,
      dateISO: rsvp.date,
      formattedDate: rsvp.formattedDate || friendlyDate(rsvp.date),
      weekday: day ? day.toLocaleDateString('en-US', { weekday: 'long' }) : rsvp.dayName,
      monthShort: day ? day.toLocaleDateString('en-US', { month: 'short' }) : '',
      dayNumber: day ? String(day.getDate()).padStart(2, '0') : '',
      time: rsvp.time,
      startLabel: formatMinutes(slot.start),
      offering: rsvp.format,
      colorName: dress.name,
      colorHex: dress.hex,
      colorNote: dress.note,
      fromName: config.fromName,
      serial: `${String(years).padStart(2, '0')}-${rsvp.date.slice(5).replace('-', '')}`,
    }
    const at = (minutes: number) =>
      day ? new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(minutes / 60), minutes % 60) : new Date()
    const event: CalendarEvent = {
      uid: `our-date-${rsvp.date}-${rsvp.placeId}@our-little-corner`,
      dateISO: rsvp.date,
      start: slot.start,
      end: slot.end,
      title: `Our date 💖 ${rsvp.placeName}`,
      location: [rsvp.placeName, rsvp.placeSubtitle].filter(Boolean).join(', '),
      description: `${rsvp.format}\n${rsvp.time} · ${rsvp.price}\nDress theme: ${rsvp.color}\n\nI can't wait to celebrate with you 💕 ${config.fromName}`,
    }
    return { info, event, start: at(slot.start), end: at(slot.end) }
  }, [rsvp, config.yearsTogether, config.fromName])

  /* ---------------- render ---------------- */

  const variants: Variants = {
    enter: (dir: number) => ({ opacity: 0, x: reduce ? 0 : dir * 56, scale: reduce ? 1 : 0.985 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (dir: number) => ({ opacity: 0, x: reduce ? 0 : dir * -56, scale: reduce ? 1 : 0.985 }),
  }

  const centered = step <= STEP.colour
  const minHeight = step < STEP.date ? 'min-h-[calc(100dvh-14rem)]' : 'min-h-[calc(100dvh-19rem)]'

  let content: React.ReactNode = null
  switch (step) {
    case STEP.ask:
      content = (
        <InviteStep
          years={config.yearsTogether}
          fromName={config.fromName}
          existing={existing}
          reduce={reduce}
          onYes={sayYes}
          onNo={() => {
            sfx.miss()
            goTo(STEP.plead)
          }}
          onViewTicket={viewExisting}
        />
      )
      break
    case STEP.plead:
      content = <PleadStep reduce={reduce} onYes={sayYes} onNo={() => goTo(STEP.puppy)} />
      break
    case STEP.puppy:
      content = <PuppyStep photo={photo} fallback={fallbackPhoto} reduce={reduce} onYes={sayYes} />
      break
    case STEP.date:
      content = (
        <DateStep
          date={date}
          birthdayDate={config.birthdayDate}
          anniversaryDate={config.anniversaryDate}
          reduce={reduce}
          onChange={setDate}
          onNext={() => goTo(STEP.colour)}
        />
      )
      break
    case STEP.colour:
      content = <ColorStep color={color} reduce={reduce} onChange={setColor} onNext={() => goTo(STEP.place)} />
      break
    case STEP.place:
      content = (
        <PlaceStep
          formattedDate={friendlyDate(date)}
          places={ordered}
          selected={selected}
          featuredId={featuredId}
          noneOpen={noneOpen}
          filter={filter}
          onFilter={setFilter}
          onSelect={(id) => {
            if (id !== selected?.place.id) sfx.tick()
            setChosenId(id)
          }}
          onChangeDate={() => goTo(STEP.date)}
          onAccept={accept}
          reduce={reduce}
        />
      )
      break
    case STEP.ticket:
      content = ticket ? (
        <TicketStep
          info={ticket.info}
          event={ticket.event}
          start={ticket.start}
          end={ticket.end}
          reduce={reduce}
          customMessage={customMessage}
          onMessageChange={setCustomMessage}
          whatsappHref={rsvp ? whatsappLink(config.whatsappNumber, noteMessage(rsvp, config.yearsTogether, customMessage)) : '#'}
          onWhatsAppSent={onWhatsAppSent}
          waSent={waSent}
          waBlocked={waBlocked}
          acceptHref={rsvp ? whatsappLink(config.whatsappNumber, acceptMessage(rsvp, config.yearsTogether)) : null}
          onChangePlace={() => goTo(STEP.place)}
        />
      ) : (
        <div className="py-20 text-center">
          <p className="text-gray-600 dark:text-gray-300">Let&apos;s pick our place first 💕</p>
          <button
            type="button"
            onClick={() => goTo(date ? STEP.place : STEP.date)}
            className="mt-4 rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white dark:bg-purple-500"
          >
            Continue planning
          </button>
        </div>
      )
      break
  }

  return (
    <div className="w-full overflow-x-clip">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        {step >= STEP.date && <StepProgress step={step} onBack={back} onJump={goTo} />}

        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.section
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduce ? 0.15 : 0.38, ease: [0.22, 1, 0.36, 1] }}
            className={centered ? `flex w-full items-center justify-center ${minHeight}` : 'w-full'}
          >
            {content}
          </motion.section>
        </AnimatePresence>
      </div>
    </div>
  )
}
