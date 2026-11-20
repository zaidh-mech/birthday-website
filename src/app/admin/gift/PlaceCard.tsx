'use client'

import { useState } from 'react'
import { Check, Loader2, MapPin, Trash2 } from 'lucide-react'
import { Place, describeDays, getWeekdayDays, getWeekendDays } from '@/data/places'

export default function PlaceCard({
  place,
  selected,
  busy,
  onSelect,
  onDelete,
}: {
  place: Place
  selected: boolean
  busy: boolean
  onSelect: () => void
  onDelete?: () => void
}) {
  const [imageBroken, setImageBroken] = useState(false)
  const rules = place.scheduleRules
  const weekdayDays = getWeekdayDays(rules)
  const weekendDays = getWeekendDays(rules)
  const weekdayLabel = describeDays(weekdayDays)
  const weekendLabel = describeDays(weekendDays)
  const closedLabel = rules?.daysOpen && rules.daysOpen.length < 7 ? describeDays([0, 1, 2, 3, 4, 5, 6].filter((d) => !rules.daysOpen?.includes(d))) : ''

  return (
    <article
      className={`group relative rounded-2xl overflow-hidden border-2 transition-all flex flex-col min-w-0 bg-white ${
        selected ? 'border-rose-500 ring-4 ring-rose-100 shadow-lg' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
    >
      <div className="relative h-40 sm:h-44 w-full overflow-hidden bg-gradient-to-br from-rose-100 via-amber-50 to-purple-100">
        {!imageBroken ? (
          <img
            src={place.image}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImageBroken(true)}
            className="w-full h-full object-cover [@media(hover:hover)]:group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-rose-300">
            <MapPin className="w-10 h-10" aria-hidden="true" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

        <div className="absolute top-3 left-3 right-14 flex flex-wrap items-center gap-1.5">
          <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-lg">{place.type}</span>
          {place.isCustom && <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider rounded-md">Custom</span>}
        </div>

        {selected ? (
          <span className="absolute top-3 right-3 px-2.5 py-1 bg-rose-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
            <Check className="w-3.5 h-3.5" aria-hidden="true" /> Featured
          </span>
        ) : (
          onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              className="absolute top-3 right-3 p-2 bg-red-500/85 hover:bg-red-600 text-white rounded-full transition-colors disabled:opacity-50"
              aria-label={`Delete ${place.name}`}
              title="Delete custom place"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )
        )}

        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="font-serif text-lg font-bold leading-tight break-words">{place.name}</h3>
          <p className="text-xs text-white/80 truncate">{place.subtitle}</p>
        </div>
      </div>

      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <p className="text-xs text-gray-600 italic line-clamp-2">&ldquo;{place.ambiance}&rdquo;</p>

        <dl className="space-y-1.5 text-[11px] text-gray-600 bg-gray-50/80 p-2.5 rounded-xl">
          {rules?.weekday && weekdayLabel && (
            <div className="flex items-start justify-between gap-2">
              <dt className="font-semibold text-gray-700 shrink-0">{weekdayLabel}:</dt>
              <dd className="text-right text-gray-600 min-w-0 break-words">
                {rules.weekday.format} ({rules.weekday.price})
              </dd>
            </div>
          )}
          {rules?.weekend && weekendLabel && (
            <div className="flex items-start justify-between gap-2 border-t border-gray-200/60 pt-1">
              <dt className="font-semibold text-rose-600 shrink-0">{weekendLabel}:</dt>
              <dd className="text-right text-rose-700 font-medium min-w-0 break-words">
                {rules.weekend.format} ({rules.weekend.price})
              </dd>
            </div>
          )}
          {closedLabel && (
            <div className="flex items-start justify-between gap-2 border-t border-gray-200/60 pt-1">
              <dt className="font-semibold text-gray-400 shrink-0">{closedLabel}:</dt>
              <dd className="text-right text-gray-400">Closed</dd>
            </div>
          )}
          {!rules && (
            <div className="flex items-start justify-between gap-2">
              <dt className="font-semibold text-gray-700 shrink-0">{place.days}:</dt>
              <dd className="text-right">{place.price}</dd>
            </div>
          )}
        </dl>

        <button
          type="button"
          onClick={onSelect}
          disabled={busy || selected}
          aria-pressed={selected}
          className={`w-full py-2.5 rounded-xl font-medium text-xs transition-colors flex items-center justify-center gap-1.5 ${
            selected ? 'bg-rose-500 text-white font-bold cursor-default' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 disabled:opacity-60'
          }`}
        >
          {busy && !selected ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : selected ? <Check className="w-4 h-4" aria-hidden="true" /> : null}
          {selected ? 'Featured pick' : 'Set as featured pick'}
        </button>
      </div>
    </article>
  )
}
