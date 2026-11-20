'use client'

import { CalendarDays, Heart, Sparkles, TriangleAlert } from 'lucide-react'
import PlaceCard from './PlaceCard'
import { CATEGORIES, matchesCategory, type CategoryId, type EvaluatedPlace } from './giftData'

interface PlaceStepProps {
  formattedDate: string
  places: EvaluatedPlace[]
  selected: EvaluatedPlace | null
  featuredId: string | null
  noneOpen: boolean
  filter: CategoryId
  onFilter: (id: CategoryId) => void
  onSelect: (id: string) => void
  onChangeDate: () => void
  onAccept: () => void
  reduce: boolean
}

export default function PlaceStep({
  formattedDate,
  places,
  selected,
  featuredId,
  noneOpen,
  filter,
  onFilter,
  onSelect,
  onChangeDate,
  onAccept,
  reduce,
}: PlaceStepProps) {
  const filtered = places.filter(({ place }) => matchesCategory(place, filter))
  const pinned = selected && !filtered.some((p) => p.place.id === selected.place.id) ? selected : null
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c.id, places.filter(({ place }) => matchesCategory(place, c.id)).length])) as Record<
    CategoryId,
    number
  >
  const isHisPick = selected && featuredId === selected.place.id

  return (
    <div className="w-full space-y-8 py-2">
      <div className="mx-auto max-w-3xl space-y-3 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-rose-600 shadow-sm dark:border-purple-400/30 dark:bg-purple-500/10 dark:text-purple-200">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Choose our date spot</span>
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        </div>

        <h2 className="font-serif text-3xl font-bold text-gray-900 md:text-5xl dark:text-gray-100">Where would you love to go, my love? 🥰</h2>

        <p className="mx-auto max-w-2xl text-sm font-medium text-gray-600 md:text-base dark:text-gray-300">
          Hours, buffets, platters and prices below are worked out for your exact day.
        </p>

        <div className="flex items-center justify-center pt-1">
          <button
            type="button"
            onClick={onChangeDate}
            className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-600 shadow-sm transition hover:bg-rose-50 dark:border-white/15 dark:bg-white/10 dark:text-rose-200 dark:hover:bg-white/15"
          >
            <CalendarDays className="h-4 w-4 text-rose-500 dark:text-purple-300" aria-hidden="true" />
            <span>{formattedDate}</span>
            <span className="ml-1 text-[10px] font-normal text-gray-400 underline">Change date</span>
          </button>
        </div>

        {noneOpen && (
          <p className="mx-auto flex max-w-xl items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-left text-sm text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Most places are usually closed that day. You can still pick one, or choose another date.
          </p>
        )}

        {/* Category filter: scrolls sideways on phones, wraps on bigger screens */}
        <div className="-mx-4 overflow-x-auto px-4 pt-3 [scrollbar-width:none] sm:mx-0 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap sm:justify-center" role="group" aria-label="Filter places">
            {CATEGORIES.map((cat) => {
              const active = filter === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onFilter(cat.id)}
                  aria-pressed={active}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                    active
                      ? 'scale-105 bg-rose-500 text-white shadow-md dark:bg-purple-500'
                      : 'border border-gray-200 bg-white/80 text-gray-700 hover:bg-rose-50 dark:border-white/10 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20'
                  }`}
                >
                  {cat.label} <span className="opacity-70">({counts[cat.id]})</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {pinned && (
          <PlaceCard
            key={`pinned-${pinned.place.id}`}
            place={pinned.place}
            availability={pinned.availability}
            selected
            featured={featuredId === pinned.place.id}
            pinned
            index={0}
            reduce={reduce}
            onSelect={onSelect}
          />
        )}
        {filtered.map(({ place, availability }, i) => (
          <PlaceCard
            key={place.id}
            place={place}
            availability={availability}
            selected={selected?.place.id === place.id}
            featured={featuredId === place.id}
            index={i + (pinned ? 1 : 0)}
            reduce={reduce}
            onSelect={onSelect}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mx-auto max-w-md rounded-3xl border border-dashed border-rose-200 bg-white/60 p-6 text-center text-sm text-gray-600 dark:border-white/15 dark:bg-white/5 dark:text-gray-300">
          Nothing in this category on that day.{' '}
          <button type="button" onClick={() => onFilter('all')} className="font-semibold text-rose-500 underline underline-offset-2 dark:text-purple-300">
            Show all places
          </button>
        </div>
      )}

      {/* Sticky lock-in bar (kept above the phone's floating theme/sound buttons) */}
      {selected && (
        <div className="sticky bottom-20 z-30 pt-4 md:bottom-4">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-3xl border-2 border-rose-300 bg-white/95 p-3 shadow-2xl backdrop-blur-xl sm:gap-4 sm:p-5 dark:border-purple-400/40 dark:bg-[#151622]/95">
            <div className="min-w-0 flex-1 text-left">
              <div className="mb-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-500 sm:text-xs dark:text-purple-300">
                <Heart className="h-3 w-3 shrink-0 fill-current sm:h-3.5 sm:w-3.5" aria-hidden="true" />
                <span className="truncate">Your chosen spot{isHisPick ? ' · 💝 his pick too' : ''}</span>
              </div>
              <h4 className="truncate font-serif text-base font-bold text-gray-900 sm:text-xl dark:text-gray-100">
                {selected.place.name}
                <span className="hidden text-xs font-normal text-gray-500 sm:inline dark:text-gray-400"> ({selected.place.subtitle})</span>
              </h4>
              <p className="truncate text-[11px] text-gray-600 sm:text-xs dark:text-gray-300">
                {selected.availability.time}
                <span className="hidden sm:inline"> • {selected.availability.format} • {selected.availability.price}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={onAccept}
              className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/30 transition hover:scale-105 hover:from-rose-600 hover:to-pink-600 active:scale-95 sm:px-8 sm:py-4 sm:text-base"
            >
              <span className="sm:hidden">Lock it in</span>
              <span className="hidden sm:inline">Accept &amp; lock it in!</span>
              <span aria-hidden="true">💌</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
