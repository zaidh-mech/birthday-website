'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import { AnimatePresence, type MotionValue } from 'framer-motion'
import { fetchPolaroids } from '@/lib/storage'
import { getPhotos, shuffle } from '@/lib/photos'
import { asset } from '@/lib/basePath'
import { useInterval, useMediaQuery } from '@/lib/hooks'
import DraggablePolaroid, { type PolaroidSlot } from './DraggablePolaroid'
import PhotoLightbox from './PhotoLightbox'
import type { ViewerPhoto } from './types'

/**
 * Six resting places around the hero card. On phones only the four corner
 * slots show, and they sit in bands reserved above and below the card (see
 * HeroSection), so they never cover the headline.
 */
const SLOTS: PolaroidSlot[] = [
  { className: 'left-2 top-[100px] sm:left-[2%] sm:top-[14%] lg:left-[6%] xl:left-[9%]', rotate: -7, depth: 1.2 },
  { className: 'right-2 top-[100px] sm:right-[2%] sm:top-[12%] lg:right-[7%] xl:right-[10%]', rotate: 8, depth: 0.8 },
  { className: 'hidden sm:block sm:left-[1%] sm:top-[47%] lg:left-[2%] xl:left-[4%]', rotate: 4, depth: 1.5 },
  { className: 'hidden sm:block sm:right-[1%] sm:top-[44%] lg:right-[2%] xl:right-[4%]', rotate: -5, depth: 1.1 },
  { className: 'left-2 bottom-[84px] sm:bottom-[6%] sm:left-[11%] lg:left-[15%] xl:left-[19%]', rotate: -4, depth: 0.7 },
  { className: 'right-2 bottom-[84px] sm:bottom-[5%] sm:right-[11%] lg:right-[16%] xl:right-[20%]', rotate: 6, depth: 1.3 },
]
const MOBILE_SLOTS = [0, 1, 4, 5]
const ALL_SLOTS = [0, 1, 2, 3, 4, 5]
/** Fill order so phones get photos first when there are only a few. */
const FILL_ORDER = [0, 1, 4, 5, 2, 3]

const CYCLE_MS = 8000
const IDLE_BEFORE_CYCLE_MS = 12000

interface SlotState {
  /** index into photos, or null for an empty slot */
  photo: number | null
  /** 0 for the first batch, increments for each swap (controls entrance delay) */
  gen: number
}

interface HeroPolaroidsProps {
  constraintsRef: RefObject<HTMLElement | null>
  parallaxX: MotionValue<number>
  parallaxY: MotionValue<number>
  parallaxOn: boolean
  canHover: boolean
}

function toViewerPhotosFromLocal(): ViewerPhoto[] {
  return getPhotos().map((p) => ({
    id: p.id,
    src: p.src,
    thumb: p.thumb,
    caption: p.caption,
    date: p.date,
    blur: p.blur,
    color: p.color,
  }))
}

export default function HeroPolaroids({ constraintsRef, parallaxX, parallaxY, parallaxOn, canHover }: HeroPolaroidsProps) {
  const isWide = useMediaQuery('(min-width: 640px)')
  const [photos, setPhotos] = useState<ViewerPhoto[] | null>(null)
  const [slots, setSlots] = useState<SlotState[]>([])
  const [order, setOrder] = useState<string[]>([])
  const [lifted, setLifted] = useState<Record<string, boolean>>({})
  const [draggingKey, setDraggingKey] = useState<string | null>(null)
  const [hoverKey, setHoverKey] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const lastInteraction = useRef(0)

  // Cloud polaroids first; our local photos when there are none.
  useEffect(() => {
    let alive = true
    fetchPolaroids()
      .catch(() => [])
      .then((list) => {
        if (!alive) return
        const cloud = list
          .filter((p) => Boolean(p.imagePath))
          .map<ViewerPhoto>((p) => ({ id: `polaroid-${p.id}`, src: asset(p.imagePath), thumb: asset(p.imagePath), caption: p.caption || '' }))
        const next = cloud.length > 0 ? cloud : toViewerPhotosFromLocal()
        const indices = shuffle(next.map((_, i) => i))
        const initial: SlotState[] = SLOTS.map(() => ({ photo: null, gen: 0 }))
        FILL_ORDER.forEach((slot, k) => {
          initial[slot] = { photo: indices[k] ?? null, gen: 0 }
        })
        setPhotos(next)
        setSlots(initial)
      })
    return () => {
      alive = false
    }
  }, [])

  const visibleSlots = isWide ? ALL_SLOTS : MOBILE_SLOTS
  const canCycle = photos !== null && photos.length > visibleSlots.length && lightboxIndex === null && draggingKey === null

  // Every ~8s swap two polaroids for ones not on screen — but only when she
  // hasn't been playing with them for a while.
  useInterval(
    () => {
      if (!photos || document.hidden) return
      if (Date.now() - lastInteraction.current < IDLE_BEFORE_CYCLE_MS) return
      // Only photos she can see count as shown: the ones parked in the slots phones hide must still rotate in.
      const shown = new Set(visibleSlots.map((s) => slots[s]?.photo).filter((p): p is number => p != null))
      const pool = shuffle(photos.map((_, i) => i).filter((i) => !shown.has(i)))
      if (pool.length === 0) return
      const targets = shuffle(visibleSlots.filter((s) => slotKey(s) !== hoverKey)).slice(0, Math.min(2, pool.length))
      const nextGen = Math.max(0, ...slots.map((s) => s.gen)) + 1
      const next = slots.slice()
      targets.forEach((slot, t) => {
        const incoming = pool[t]
        // A photo taken from a hidden slot swaps places with the one it replaces, so no photo sits in two slots.
        const parked = next.findIndex((s, i) => !visibleSlots.includes(i) && s.photo === incoming)
        if (parked !== -1) next[parked] = { photo: next[slot].photo, gen: nextGen }
        next[slot] = { photo: incoming, gen: nextGen }
      })
      setSlots(next)
      const keys = new Set(next.map((s, i) => keyFor(i, s)).filter(Boolean))
      setOrder((o) => o.filter((k) => keys.has(k)))
      setLifted((l) => Object.fromEntries(Object.entries(l).filter(([k]) => keys.has(k))))
    },
    canCycle ? CYCLE_MS : null,
  )

  function keyFor(slotIndex: number, state: SlotState | undefined): string {
    if (!photos || !state || state.photo === null) return ''
    return `${slotIndex}-${photos[state.photo]?.id ?? 'x'}`
  }
  function slotKey(slotIndex: number): string {
    return keyFor(slotIndex, slots[slotIndex])
  }

  const touch = () => {
    lastInteraction.current = Date.now()
  }

  const zFor = (key: string, slotIndex: number): number => {
    if (draggingKey === key) return 1000
    if (hoverKey === key) return 500
    const rank = order.indexOf(key)
    const base = rank === -1 ? 1 + slotIndex : 10 + rank
    // Once she has moved a polaroid it may rest on top of the card; untouched ones tuck behind it.
    return lifted[key] ? 200 + base : base
  }

  return (
    <>
      <div className="pointer-events-none absolute inset-0">
        <AnimatePresence>
          {photos &&
            slots.map((state, slotIndex) => {
              if (state.photo === null) return null
              const photo = photos[state.photo]
              if (!photo) return null
              const key = `${slotIndex}-${photo.id}`
              const photoIndex = state.photo
              return (
                <DraggablePolaroid
                  key={key}
                  photo={photo}
                  slot={SLOTS[slotIndex]}
                  zIndex={zFor(key, slotIndex)}
                  enterDelay={state.gen === 0 ? 0.55 + slotIndex * 0.09 : 0.2}
                  constraintsRef={constraintsRef}
                  parallaxX={parallaxX}
                  parallaxY={parallaxY}
                  parallaxOn={parallaxOn}
                  canHover={canHover}
                  eager={state.gen === 0}
                  dragging={draggingKey === key}
                  onOpen={() => {
                    touch()
                    setLightboxIndex(photoIndex)
                  }}
                  onPress={() => {
                    touch()
                    setOrder((o) => [...o.filter((k) => k !== key), key])
                  }}
                  onDragChange={(isDragging) => {
                    touch()
                    setDraggingKey(isDragging ? key : null)
                    if (isDragging) setLifted((l) => (l[key] ? l : { ...l, [key]: true }))
                  }}
                  onHoverChange={(hovering) => {
                    if (hovering) touch()
                    setHoverKey((h) => (hovering ? key : h === key ? null : h))
                  }}
                />
              )
            })}
        </AnimatePresence>
      </div>

      <PhotoLightbox
        items={photos ?? []}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </>
  )
}
