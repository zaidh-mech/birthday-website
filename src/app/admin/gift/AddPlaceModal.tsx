'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { ALL_DAYS, DEFAULT_WEEKEND_DAYS, Place, SHORT_DAY_NAMES, WEEK_ORDER, describeDays } from '@/data/places'
import { Banner, ui, type Notice } from '../_components/ui'

const PLACE_TYPES = [
  'Unlimited Lunch Buffet',
  'Grand Lunch Buffet',
  'High Tea Buffet',
  'High Tea Platter',
  'Brunch & Cafe',
  'Halal High Tea',
  'Halal Cafe',
  'Romantic Dinner',
]

function DayPicker({ label, value, onChange, allowed }: { label: string; value: number[]; onChange: (days: number[]) => void; allowed?: number[] }) {
  return (
    <fieldset>
      <legend className={ui.label}>{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {WEEK_ORDER.map((day) => {
          const on = value.includes(day)
          const disabled = allowed ? !allowed.includes(day) : false
          return (
            <button
              key={day}
              type="button"
              aria-pressed={on}
              disabled={disabled}
              onClick={() => onChange(on ? value.filter((d) => d !== day) : [...value, day])}
              className={`min-w-11 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-30 ${
                on ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-rose-300'
              }`}
            >
              {SHORT_DAY_NAMES[day]}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function ScheduleFields({
  title,
  tone,
  format,
  time,
  price,
  onFormat,
  onTime,
  onPrice,
}: {
  title: string
  tone: 'gray' | 'rose'
  format: string
  time: string
  price: string
  onFormat: (v: string) => void
  onTime: (v: string) => void
  onPrice: (v: string) => void
}) {
  const box = tone === 'rose' ? 'bg-rose-50/50 border-rose-100' : 'bg-gray-50 border-gray-100'
  const heading = tone === 'rose' ? 'text-rose-700' : 'text-gray-700'
  const small = ui.inputSm
  return (
    <div className={`p-4 rounded-2xl space-y-3 border ${box}`}>
      <h4 className={`text-xs font-bold uppercase tracking-wider ${heading}`}>{title}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="block">
          <span className="block text-[11px] text-gray-500 mb-1">What&apos;s served</span>
          <input type="text" value={format} onChange={(e) => onFormat(e.target.value)} placeholder="Platter service" className={small} />
        </label>
        <label className="block">
          <span className="block text-[11px] text-gray-500 mb-1">Hours</span>
          <input type="text" value={time} onChange={(e) => onTime(e.target.value)} placeholder="3:00 PM - 6:00 PM" className={small} />
        </label>
        <label className="block">
          <span className="block text-[11px] text-gray-500 mb-1">Price</span>
          <input type="text" value={price} onChange={(e) => onPrice(e.target.value)} placeholder="LKR 3,800" className={small} />
        </label>
      </div>
    </div>
  )
}

export default function AddPlaceModal({ onClose, onCreate }: { onClose: () => void; onCreate: (place: Place) => Promise<void> }) {
  const [name, setName] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [type, setType] = useState('High Tea Buffet')
  const [image, setImage] = useState('')
  const [ambiance, setAmbiance] = useState('')
  const [daysOpen, setDaysOpen] = useState<number[]>(ALL_DAYS)
  const [weekendDays, setWeekendDays] = useState<number[]>(DEFAULT_WEEKEND_DAYS)
  const [weekdayFormat, setWeekdayFormat] = useState('Platter Service')
  const [weekdayTime, setWeekdayTime] = useState('3:00 PM - 6:00 PM')
  const [weekdayPrice, setWeekdayPrice] = useState('LKR 3,800')
  const [weekendFormat, setWeekendFormat] = useState('Weekend High Tea Buffet')
  const [weekendTime, setWeekendTime] = useState('3:00 PM - 6:00 PM')
  const [weekendPrice, setWeekendPrice] = useState('LKR 5,500 nett')
  const [imageBroken, setImageBroken] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const closeRef = useRef(onClose)
  const savingRef = useRef(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    savingRef.current = saving
  }, [saving])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Like the backdrop and the close button: stay open while saving, so a failure can still be shown.
      if (e.key === 'Escape' && !savingRef.current) closeRef.current()
    }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [])

  const openWeekend = weekendDays.filter((d) => daysOpen.includes(d))
  const openWeekday = daysOpen.filter((d) => !weekendDays.includes(d))
  const weekdayLabel = describeDays(openWeekday)
  const weekendLabel = describeDays(openWeekend)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !/^https?:\/\//i.test(image.trim())) {
      setNotice({ tone: 'error', text: 'Please add a name and a photo link that starts with https://' })
      return
    }
    if (daysOpen.length === 0) {
      setNotice({ tone: 'error', text: 'Pick at least one day the place is open.' })
      return
    }

    const place: Place = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      subtitle: subtitle.trim() || 'Colombo',
      type,
      image: image.trim(),
      desc: ambiance.trim(),
      ambiance: ambiance.trim() || 'Romantic, beautiful atmosphere made for two.',
      time: weekdayTime || weekendTime || '3:00 PM - 6:00 PM',
      days: [weekdayLabel && `${weekdayLabel} (${weekdayFormat || 'weekday'})`, weekendLabel && `${weekendLabel} (${weekendFormat || 'weekend'})`].filter(Boolean).join(', ') || 'Daily',
      price: openWeekday.length && openWeekend.length ? `${weekdayPrice} - ${weekendPrice}` : openWeekend.length ? weekendPrice : weekdayPrice,
      themeClass: 'bg-[#1E1B18] text-[#F5F2EB]',
      accentClass: 'bg-[#2E2A24] text-[#E8E1D5] border-[#4A4237]',
      buttonClass: 'bg-[#D97706] hover:bg-[#B45309] text-white',
      isCustom: true,
      scheduleRules: {
        daysOpen: [...daysOpen].sort((a, b) => a - b),
        weekendDays: [...weekendDays].sort((a, b) => a - b),
        weekday: {
          isOpen: openWeekday.length > 0,
          format: weekdayFormat || 'Weekday Experience',
          time: weekdayTime || '3:00 PM - 6:00 PM',
          price: weekdayPrice || 'A la carte',
        },
        weekend: {
          isOpen: openWeekend.length > 0,
          format: weekendFormat || 'Weekend Buffet / Special',
          time: weekendTime || '3:00 PM - 6:00 PM',
          price: weekendPrice || 'Buffet pricing',
        },
      },
    }

    setSaving(true)
    setNotice(null)
    try {
      await onCreate(place)
    } catch (err) {
      setNotice({ tone: 'error', text: err instanceof Error ? err.message : 'Saving the place failed.' })
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => !saving && onClose()}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-place-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-xl p-5 sm:p-8 space-y-5 max-h-[92dvh] overflow-y-auto shadow-2xl outline-none"
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <h3 id="add-place-title" className="font-serif text-xl sm:text-2xl font-bold text-gray-900">
            Add a date spot
          </h3>
          <button type="button" onClick={onClose} disabled={saving} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <Banner notice={notice} onClose={() => setNotice(null)} />

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="place-name" className={ui.label}>
                Place name *
              </label>
              <input id="place-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rooftop Café" className={ui.input} />
            </div>
            <div>
              <label htmlFor="place-subtitle" className={ui.label}>
                Location / subtitle
              </label>
              <input id="place-subtitle" type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="e.g. Galle Face, Colombo" className={ui.input} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="place-type" className={ui.label}>
                Type
              </label>
              <select id="place-type" value={type} onChange={(e) => setType(e.target.value)} className={ui.input}>
                {PLACE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="place-image" className={ui.label}>
                Photo link *
              </label>
              <input
                id="place-image"
                type="url"
                inputMode="url"
                required
                value={image}
                onChange={(e) => {
                  setImage(e.target.value)
                  setImageBroken(false)
                }}
                placeholder="https://…"
                className={ui.input}
              />
            </div>
          </div>

          {/^https?:\/\//i.test(image.trim()) && (
            <div className="relative h-32 rounded-xl overflow-hidden bg-gray-100">
              {!imageBroken ? (
                <img src={image.trim()} alt="Place preview" className="w-full h-full object-cover" onError={() => setImageBroken(true)} />
              ) : (
                <p className="absolute inset-0 flex items-center justify-center text-xs text-amber-700 px-4 text-center">That link doesn&apos;t load as an image. Try copying the image address instead.</p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="place-ambiance" className={ui.label}>
              Vibe / description
            </label>
            <textarea
              id="place-ambiance"
              value={ambiance}
              onChange={(e) => setAmbiance(e.target.value)}
              placeholder="Warm lighting, cozy corner for long conversations…"
              rows={2}
              className={ui.input}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <DayPicker label="Open on" value={daysOpen} onChange={setDaysOpen} />
            <DayPicker label="Which days use the weekend menu?" value={weekendDays} onChange={setWeekendDays} allowed={daysOpen} />
          </div>

          {openWeekday.length > 0 && (
            <ScheduleFields
              title={`Weekday schedule (${weekdayLabel})`}
              tone="gray"
              format={weekdayFormat}
              time={weekdayTime}
              price={weekdayPrice}
              onFormat={setWeekdayFormat}
              onTime={setWeekdayTime}
              onPrice={setWeekdayPrice}
            />
          )}
          {openWeekend.length > 0 && (
            <ScheduleFields
              title={`Weekend schedule (${weekendLabel})`}
              tone="rose"
              format={weekendFormat}
              time={weekendTime}
              price={weekendPrice}
              onFormat={setWeekendFormat}
              onTime={setWeekendTime}
              onPrice={setWeekendPrice}
            />
          )}

          <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
            <button type="button" onClick={onClose} disabled={saving} className={ui.secondaryButton}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className={ui.roseButton}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              Save &amp; feature this place
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
