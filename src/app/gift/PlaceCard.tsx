'use client'

import { memo, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Clock, Info, Sparkles, Wallet } from 'lucide-react'
import type { DateAvailability, Place } from '@/data/places'
import { placeEmoji } from './giftData'

interface PlaceCardProps {
  place: Place
  availability: DateAvailability
  selected: boolean
  featured: boolean
  /** Shown first because it's selected but hidden by the active filter. */
  pinned?: boolean
  index: number
  reduce: boolean
  onSelect: (id: string) => void
}

function PlaceCardImpl({ place, availability, selected, featured, pinned = false, index, reduce, onSelect }: PlaceCardProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = Boolean(place.image) && !imgFailed

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.04 }}
      onClick={() => onSelect(place.id)}
      className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border-2 bg-white transition-[translate,box-shadow,border-color] duration-300 dark:bg-[#181924] ${
        selected
          ? '-translate-y-1 border-rose-500 shadow-2xl shadow-rose-500/20 ring-4 ring-rose-200/70 dark:border-purple-400 dark:shadow-purple-900/40 dark:ring-purple-500/20'
          : 'border-gray-200/80 hover:-translate-y-1 hover:border-rose-300 hover:shadow-xl dark:border-white/10 dark:hover:border-purple-400/50'
      }`}
    >
      {pinned && (
        <div className="bg-rose-500 px-4 py-1.5 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-white dark:bg-purple-500">
          📌 Your pick (not in this filter)
        </div>
      )}

      {/* Photo & badges */}
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-rose-100 to-purple-100 sm:h-52 dark:from-rose-950/50 dark:to-purple-950/50">
        {showImage ? (
          <img
            src={place.image}
            alt={place.name}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl" aria-hidden="true">
            {placeEmoji(place)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

        <div className="absolute left-3 top-3 flex max-w-[62%] flex-wrap gap-1.5">
          <span className="rounded-lg border border-white/10 bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
            {place.type}
          </span>
          <span className="rounded-lg bg-rose-500/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-md dark:bg-purple-500/90">
            {availability.badge}
          </span>
        </div>

        {featured && (
          <span className="absolute right-3 top-3 rounded-full bg-amber-300 px-2.5 py-1 text-[11px] font-bold text-amber-950 shadow-lg ring-2 ring-white/60">
            💝 His pick
          </span>
        )}

        <div className="absolute bottom-3 left-4 right-14 text-white">
          <h3 className="font-serif text-xl font-bold leading-tight">{place.name}</h3>
          <p className="mt-0.5 text-xs text-white/80">{place.subtitle}</p>
        </div>

        <span
          className={`absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full shadow-lg transition-all duration-300 ${
            selected ? 'scale-100 bg-rose-500 text-white dark:bg-purple-500' : 'scale-90 bg-white/20 text-white/0 ring-2 ring-white/70 backdrop-blur-sm'
          }`}
          aria-hidden="true"
        >
          <Check className="h-5 w-5" strokeWidth={3} />
        </span>
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between gap-4 p-5">
        <p className="line-clamp-2 text-xs italic text-gray-600 dark:text-gray-300">&ldquo;{place.ambiance}&rdquo;</p>

        <div className="space-y-2 rounded-2xl border border-rose-100 bg-rose-50/70 p-3.5 text-xs dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden="true" />
            <span className="font-bold text-gray-900 dark:text-gray-100">{availability.format}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-300">
            <Clock className="h-3.5 w-3.5 shrink-0 text-sky-500" aria-hidden="true" />
            <span>{availability.time}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-800 dark:text-gray-200">
            <Wallet className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
            <span>{availability.price}</span>
          </div>
          {availability.note && (
            <p className="border-t border-rose-200/50 pt-1.5 text-[10px] italic text-gray-500 dark:border-white/10 dark:text-gray-400">💡 {availability.note}</p>
          )}
          {availability.statusMessage && (
            <p className="flex items-start gap-1.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
              <Info className="mt-px h-3 w-3 shrink-0" aria-hidden="true" />
              {availability.statusMessage}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onSelect(place.id)
          }}
          aria-pressed={selected}
          aria-label={selected ? `${place.name} is our spot` : `Pick ${place.name}`}
          className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-medium transition-colors ${
            selected
              ? 'bg-rose-500 font-bold text-white shadow-md dark:bg-purple-500'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/20'
          }`}
        >
          {selected ? (
            <>
              <Check className="h-4 w-4" aria-hidden="true" /> Picked as our spot ❤️
            </>
          ) : (
            'Select this place'
          )}
        </button>
      </div>
    </motion.div>
  )
}

const PlaceCard = memo(PlaceCardImpl)
export default PlaceCard
