'use client'

import { useEffect, useRef, useState } from 'react'
import {
  fetchMemories,
  createMemory,
  removeMemory,
  fetchSelectedGiftPlace,
  saveSelectedGiftPlace,
  fetchPlaces,
  saveCustomPlace,
  removeCustomPlace,
  fetchDateAcceptance,
  clearDateAcceptance,
  DEFAULT_GIFT_PLACE_ID,
  DateRSVP,
} from '@/lib/storage'
import { Memory } from '@/data/initialData'
import { Place } from '@/data/places'
import { Upload, Gift, MapPin, Plus, Heart, Loader2 } from 'lucide-react'
import { Banner, PageHeader, errorMessage, safeFormat, ui, useNotice, validateImageFile } from '../_components/ui'
import AddPlaceModal from './AddPlaceModal'
import PlaceCard from './PlaceCard'

const GIFT_PHOTO_TITLE = '[GIFT_PHOTO]'

export default function AdminGiftPage() {
  const [giftMemory, setGiftMemory] = useState<Memory | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [photoNotice, setPhotoNotice] = useNotice()

  const [placesList, setPlacesList] = useState<Place[]>([])
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>(DEFAULT_GIFT_PLACE_ID)
  const [busyPlaceId, setBusyPlaceId] = useState<string | null>(null)
  const [placeNotice, setPlaceNotice] = useNotice(5000)
  const [showAddModal, setShowAddModal] = useState(false)

  const [rsvp, setRsvp] = useState<DateRSVP | null>(null)
  const [clearingRsvp, setClearingRsvp] = useState(false)
  const [rsvpNotice, setRsvpNotice] = useNotice()

  const photoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchMemories().then((mems) => setGiftMemory(mems.find((m) => m.title === GIFT_PHOTO_TITLE) ?? null))
    fetchPlaces().then(setPlacesList)
    fetchSelectedGiftPlace().then(setSelectedPlaceId)
    fetchDateAcceptance().then(setRsvp)
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // so picking the same file again still triggers a change
    if (!file) return
    const problem = validateImageFile(file)
    if (problem) {
      setPhotoNotice({ tone: 'error', text: problem })
      return
    }

    setIsUploading(true)
    setPhotoNotice(null)
    try {
      // Upload the new photo first, so a failed upload never leaves her with no photo.
      const newMem = await createMemory({ title: GIFT_PHOTO_TITLE, caption: 'The cute fella for the date plan.', file })
      const previous = giftMemory
      setGiftMemory(newMem)
      if (previous) {
        try {
          await removeMemory(previous.id)
        } catch (err) {
          console.warn('Old gift photo could not be removed:', err)
        }
      }
      setPhotoNotice({ tone: 'success', text: 'Photo is live!' })
    } catch (err) {
      setPhotoNotice({ tone: 'error', text: errorMessage(err, 'Upload failed.') })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSelectPlace = async (place: Place) => {
    const previous = selectedPlaceId
    setSelectedPlaceId(place.id)
    setBusyPlaceId(place.id)
    setPlaceNotice(null)
    try {
      await saveSelectedGiftPlace(place.id)
      setPlaceNotice({ tone: 'success', text: `"${place.name}" is now the featured pick. She can still choose any spot for her date.` })
    } catch (err) {
      setSelectedPlaceId(previous)
      setPlaceNotice({ tone: 'error', text: errorMessage(err) })
    } finally {
      setBusyPlaceId(null)
    }
  }

  const handleCreatePlace = async (place: Place) => {
    // Errors bubble up to the modal, which shows them and stays open.
    const updated = await saveCustomPlace(place)
    setPlacesList(updated)
    setShowAddModal(false)
    try {
      await saveSelectedGiftPlace(place.id)
      setSelectedPlaceId(place.id)
      setPlaceNotice({ tone: 'success', text: `Added "${place.name}" and made it the featured pick.` })
    } catch (err) {
      setPlaceNotice({ tone: 'error', text: `Added "${place.name}", but it couldn't be featured: ${errorMessage(err)}` })
    }
  }

  const handleDeletePlace = async (place: Place) => {
    if (!window.confirm(`Remove "${place.name}" from the date spots?`)) return
    setBusyPlaceId(place.id)
    setPlaceNotice(null)
    try {
      const updated = await removeCustomPlace(place.id)
      setPlacesList(updated)
      if (selectedPlaceId === place.id) {
        await saveSelectedGiftPlace(DEFAULT_GIFT_PLACE_ID)
        setSelectedPlaceId(DEFAULT_GIFT_PLACE_ID)
      }
      setPlaceNotice({ tone: 'success', text: `"${place.name}" was removed.` })
    } catch (err) {
      setPlaceNotice({ tone: 'error', text: errorMessage(err) })
    } finally {
      setBusyPlaceId(null)
    }
  }

  const handleClearRsvp = async () => {
    if (!window.confirm('Mark her answer as seen and clear it?')) return
    setClearingRsvp(true)
    try {
      await clearDateAcceptance()
      setRsvp(null)
    } catch (err) {
      setRsvpNotice({ tone: 'error', text: errorMessage(err) })
    } finally {
      setClearingRsvp(false)
    }
  }

  const acceptedAt = rsvp ? safeFormat(rsvp.acceptedAt, 'PPpp') : ''

  return (
    <div className="space-y-8 sm:space-y-12 max-w-5xl">
      <PageHeader title="Gift & Date" subtitle="Choose the featured date spot, add your own spots with their own weekday/weekend menus, and see her answer." />

      <Banner notice={rsvpNotice} onClose={() => setRsvpNotice(null)} />

      {/* Her answer */}
      {rsvp && (
        <section className="bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 text-white p-5 sm:p-8 rounded-3xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/20 pb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shrink-0">
                <Heart className="w-6 h-6 text-white fill-white motion-safe:animate-pulse" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold uppercase tracking-widest text-rose-100">Her answer is in</span>
                <h2 className="text-xl sm:text-2xl font-serif font-bold">She said yes to your date! 🎉</h2>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClearRsvp}
              disabled={clearingRsvp}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-medium transition-colors border border-white/20 self-start sm:self-auto disabled:opacity-60 flex items-center gap-1.5"
            >
              {clearingRsvp && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
              Seen it, clear
            </button>
          </div>

          <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Destination', main: rsvp.placeName, sub: rsvp.placeSubtitle },
              { label: 'Date', main: rsvp.formattedDate, sub: rsvp.dayName },
              { label: 'What & when', main: rsvp.format, sub: rsvp.time },
              { label: 'Dress colour', main: rsvp.color, sub: rsvp.price },
            ].map((item) => (
              <div key={item.label} className="bg-white/10 p-3.5 rounded-2xl backdrop-blur-sm min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-rose-100 font-bold mb-1">{item.label}</p>
                <p className="font-serif font-bold text-base leading-tight break-words">{item.main}</p>
                {item.sub && <p className="text-xs text-rose-50/80 break-words">{item.sub}</p>}
              </div>
            ))}
          </div>

          {rsvp.customMessage && <p className="font-cursive text-xl leading-snug bg-white/10 rounded-2xl px-4 py-3 break-words">&ldquo;{rsvp.customMessage}&rdquo;</p>}

          {acceptedAt && <p className="text-xs text-rose-50/80">Answered {acceptedAt}.</p>}
        </section>
      )}

      {/* Date spots */}
      <section className={`${ui.card} space-y-6`}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-gray-100 pb-5">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-lg sm:text-xl font-serif font-bold text-gray-900 mb-1">
              <MapPin className="w-5 h-5 text-rose-500 shrink-0" aria-hidden="true" /> Date spots she can choose from
            </h2>
            <p className="text-sm text-gray-500 max-w-2xl">
              Every spot below is offered on her gift page. When she picks a day, the page shows that spot&apos;s menu, hours and price for that day.
            </p>
          </div>
          <button type="button" onClick={() => setShowAddModal(true)} className={`${ui.primaryButton} shrink-0 self-start`}>
            <Plus className="w-4 h-4" aria-hidden="true" /> Add a spot
          </button>
        </div>

        <Banner notice={placeNotice} onClose={() => setPlaceNotice(null)} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {placesList.map((p) => (
            <PlaceCard
              key={p.id}
              place={p}
              selected={p.id === selectedPlaceId}
              busy={busyPlaceId === p.id}
              onSelect={() => handleSelectPlace(p)}
              onDelete={p.isCustom ? () => handleDeletePlace(p) : undefined}
            />
          ))}
          {placesList.length === 0 && (
            <div className="col-span-full py-12 flex justify-center text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" aria-label="Loading places" />
            </div>
          )}
        </div>
      </section>

      {showAddModal && <AddPlaceModal onClose={() => setShowAddModal(false)} onCreate={handleCreatePlace} />}

      {/* Persuasion photo */}
      <section className={`${ui.card} max-w-2xl`}>
        <h2 className="flex items-center gap-2 mb-1 text-lg sm:text-xl font-serif font-bold text-gray-900">
          <Gift className="w-5 h-5 text-rose-500 shrink-0" aria-hidden="true" /> &ldquo;Cute fella&rdquo; persuasion photo
        </h2>
        <p className="text-gray-500 text-sm mb-5">This photo appears if she dares to press &ldquo;No&rdquo; twice on the date invitation.</p>

        <Banner notice={photoNotice} onClose={() => setPhotoNotice(null)} className="mb-4" />

        <div className="flex flex-col items-center text-center p-5 sm:p-6 bg-gray-50/60 rounded-2xl border border-gray-100 gap-4">
          {giftMemory ? (
            <img src={giftMemory.imagePath} alt="The cute fella photo" className="w-40 h-40 sm:w-48 sm:h-48 object-cover [object-position:center_30%] rounded-2xl shadow-md border-4 border-rose-100" />
          ) : (
            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl bg-white border-2 border-dashed border-gray-200 flex items-center justify-center text-sm text-gray-400 px-4">No photo yet</div>
          )}
          <input ref={photoInputRef} id="gift-photo" type="file" accept="image/*" onChange={handleUpload} className="sr-only" disabled={isUploading} />
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            disabled={isUploading}
            className={giftMemory ? ui.primaryButton : ui.roseButton}
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Upload className="w-4 h-4" aria-hidden="true" />}
            {isUploading ? 'Uploading…' : giftMemory ? 'Replace photo' : 'Upload photo'}
          </button>
        </div>
      </section>
    </div>
  )
}
