'use client'

import { useState, useEffect } from 'react'
import { fetchMemories, createMemory, removeMemory, fetchSelectedGiftPlace, saveSelectedGiftPlace } from '@/lib/storage'
import { Memory } from '@/data/initialData'
import { places, Place } from '@/data/places'
import { Upload, Gift, MapPin, Check, Clock, CalendarDays, Wallet, CheckCircle2 } from 'lucide-react'

export default function AdminGiftPage() {
  const [giftMemory, setGiftMemory] = useState<Memory | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')

  // Place selection state
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('churros')
  const [isSavingPlace, setIsSavingPlace] = useState(false)
  const [placeMessage, setPlaceMessage] = useState('')

  useEffect(() => {
    fetchMemories().then(mems => {
      const found = mems.find(m => m.title === '[GIFT_PHOTO]')
      if (found) setGiftMemory(found)
    })

    fetchSelectedGiftPlace().then(placeId => {
      setSelectedPlaceId(placeId)
    })
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    setIsUploading(true)
    setError('')
    try {
      if (giftMemory) {
        await removeMemory(giftMemory.id)
      }

      const newMem = await createMemory({
        title: '[GIFT_PHOTO]',
        caption: 'The cute fella for the date plan.',
        file: e.target.files[0]
      })

      setGiftMemory(newMem)
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSelectPlace = async (place: Place) => {
    setSelectedPlaceId(place.id)
    setIsSavingPlace(true)
    setPlaceMessage('')
    try {
      await saveSelectedGiftPlace(place.id)
      setPlaceMessage(`Locked in "${place.name}"! She will be invited here.`)
      setTimeout(() => setPlaceMessage(''), 4000)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSavingPlace(false)
    }
  }

  const currentPlace = places.find(p => p.id === selectedPlaceId) || places[0]

  return (
    <div className="space-y-12 max-w-5xl">
      <div>
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Gift & Date Settings</h1>
        <p className="text-gray-500 text-sm">
          Control your surprise date destination and the cute fella backup photo.
        </p>
      </div>

      {/* Date Destination Selector */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-6 h-6 text-rose-500" />
              <h2 className="text-xl font-serif font-bold text-gray-900">
                Date Destination (Where You Are Taking Her)
              </h2>
            </div>
            <p className="text-sm text-gray-500 max-w-2xl">
              Choose the spot below. She will <strong>not</strong> be asked to choose—once she completes the date & dress color steps, she will receive a special surprise invitation to this exact spot!
            </p>
          </div>

          <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 px-4 py-2.5 rounded-2xl shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Active Choice:</span>
            <span className="font-serif font-bold text-gray-900 text-sm">{currentPlace.name}</span>
          </div>
        </div>

        {placeMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{placeMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {places.map((p) => {
            const isSelected = p.id === selectedPlaceId

            return (
              <div 
                key={p.id}
                onClick={() => handleSelectPlace(p)}
                className={`group relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all flex flex-col justify-between ${
                  isSelected 
                    ? 'border-rose-500 ring-4 ring-rose-100 shadow-lg -translate-y-1' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {/* Photo & Badges */}
                <div className="relative h-44 w-full overflow-hidden bg-gray-100">
                  <img 
                    src={p.image} 
                    alt={p.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-lg">
                    {p.type}
                  </span>

                  {isSelected && (
                    <span className="absolute top-3 right-3 px-3 py-1 bg-rose-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Selected
                    </span>
                  )}

                  <div className="absolute bottom-3 left-3 text-white">
                    <h3 className="font-serif text-lg font-bold leading-tight">{p.name}</h3>
                    <p className="text-xs text-white/80">{p.subtitle}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between bg-white">
                  <p className="text-xs text-gray-600 italic line-clamp-2">
                    &quot;{p.ambiance}&quot;
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-gray-100 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="line-clamp-1">{p.days}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="line-clamp-1">{p.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wallet className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="line-clamp-1">{p.price}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectPlace(p)
                    }}
                    className={`w-full py-2.5 rounded-xl font-medium text-xs transition-colors flex items-center justify-center gap-1.5 mt-2 ${
                      isSelected
                        ? 'bg-rose-500 text-white font-bold'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-4 h-4" /> Destination Locked In
                      </>
                    ) : (
                      'Select This Destination'
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Cute Fella Photo */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 max-w-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="w-6 h-6 text-rose-500" />
          <h2 className="text-xl font-serif font-bold text-gray-900">
            &quot;Cute Fella&quot; Persuasion Photo
          </h2>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          This photo appears if she dares to click &quot;No&quot; twice on the date invitation!
        </p>

        <div className="flex flex-col items-center text-center p-6 bg-gray-50/60 rounded-2xl border border-gray-100">
          {giftMemory ? (
            <div className="space-y-4 flex flex-col items-center">
              <img 
                src={giftMemory.imagePath} 
                alt="Cute fella" 
                className="w-48 h-48 object-cover rounded-2xl shadow-md border-4 border-rose-100" 
              />
              <p className="text-sm text-green-600 font-medium">Photo is live!</p>
              
              <label className="cursor-pointer px-6 py-2.5 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-black transition-colors inline-block">
                {isUploading ? 'Uploading...' : 'Replace Photo'}
                <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={isUploading} />
              </label>
            </div>
          ) : (
            <div className="space-y-4 flex flex-col items-center">
              <div className="w-48 h-48 rounded-2xl bg-white border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400">
                No photo uploaded
              </div>
              <label className="cursor-pointer px-6 py-3 bg-rose-500 text-white rounded-full text-sm font-medium hover:bg-rose-600 transition-colors inline-block flex items-center gap-2">
                <Upload className="w-4 h-4" />
                {isUploading ? 'Uploading...' : 'Upload Photo'}
                <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={isUploading} />
              </label>
            </div>
          )}

          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        </div>
      </div>
    </div>
  )
}
