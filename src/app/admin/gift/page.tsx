'use client'

import { useState, useEffect } from 'react'
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
  DateRSVP
} from '@/lib/storage'
import { Memory } from '@/data/initialData'
import { Place } from '@/data/places'
import { 
  Upload, 
  Gift, 
  MapPin, 
  Check, 
  Clock, 
  CalendarDays, 
  Wallet, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Sparkles, 
  Heart, 
  X,
  AlertCircle
} from 'lucide-react'

export default function AdminGiftPage() {
  const [giftMemory, setGiftMemory] = useState<Memory | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')

  // Places state
  const [placesList, setPlacesList] = useState<Place[]>([])
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('churros')
  const [placeMessage, setPlaceMessage] = useState('')

  // RSVP state
  const [rsvp, setRsvp] = useState<DateRSVP | null>(null)

  // Add Place Form state
  const [showAddModal, setShowAddModal] = useState(false)
  const [name, setName] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [type, setType] = useState('High Tea Buffet')
  const [image, setImage] = useState('')
  const [ambiance, setAmbiance] = useState('')
  const [weekdayFormat, setWeekdayFormat] = useState('Platter Service')
  const [weekdayTime, setWeekdayTime] = useState('3:00 PM - 6:00 PM')
  const [weekdayPrice, setWeekdayPrice] = useState('LKR 3,800')
  const [weekendFormat, setWeekendFormat] = useState('Weekend High Tea Buffet')
  const [weekendTime, setWeekendTime] = useState('3:00 PM - 6:00 PM')
  const [weekendPrice, setWeekendPrice] = useState('LKR 5,500 nett')

  useEffect(() => {
    fetchMemories().then(mems => {
      const found = mems.find(m => m.title === '[GIFT_PHOTO]')
      if (found) setGiftMemory(found)
    })

    fetchPlaces().then(setPlacesList)

    fetchSelectedGiftPlace().then(setSelectedPlaceId)

    fetchDateAcceptance().then(setRsvp)
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
    setPlaceMessage('')
    try {
      await saveSelectedGiftPlace(place.id)
      setPlaceMessage(`Locked in "${place.name}"! She will be invited here.`)
      setTimeout(() => setPlaceMessage(''), 4000)
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreatePlace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !image) return

    const newPlace: Place = {
      id: `custom-${Date.now()}`,
      name,
      subtitle: subtitle || 'Colombo',
      type,
      image,
      desc: ambiance,
      ambiance: ambiance || 'Romantic, beautiful atmosphere made for two.',
      time: weekdayTime || '3:00 PM - 6:00 PM',
      days: 'Daily',
      price: `${weekdayPrice} - ${weekendPrice}`,
      themeClass: 'bg-[#1E1B18] text-[#F5F2EB]',
      accentClass: 'bg-[#2E2A24] text-[#E8E1D5] border-[#4A4237]',
      buttonClass: 'bg-[#D97706] hover:bg-[#B45309] text-white',
      isCustom: true,
      scheduleRules: {
        daysOpen: [0, 1, 2, 3, 4, 5, 6],
        weekendDays: [5, 6, 0],
        weekday: {
          isOpen: true,
          format: weekdayFormat || 'Weekday Experience',
          time: weekdayTime || '3:00 PM - 6:00 PM',
          price: weekdayPrice || 'A la carte'
        },
        weekend: {
          isOpen: true,
          format: weekendFormat || 'Weekend Buffet / Special',
          time: weekendTime || '3:00 PM - 6:00 PM',
          price: weekendPrice || 'Buffet pricing'
        }
      }
    }

    const updated = await saveCustomPlace(newPlace)
    setPlacesList(updated)
    setSelectedPlaceId(newPlace.id)
    await saveSelectedGiftPlace(newPlace.id)

    // Reset Form
    setName('')
    setSubtitle('')
    setImage('')
    setAmbiance('')
    setShowAddModal(false)
    setPlaceMessage(`Added & Selected "${newPlace.name}"! She will be invited here.`)
  }

  const handleDeletePlace = async (placeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to remove this custom place?')) return
    const updated = await removeCustomPlace(placeId)
    setPlacesList(updated)
    if (selectedPlaceId === placeId) {
      setSelectedPlaceId('churros')
      await saveSelectedGiftPlace('churros')
    }
  }

  const handleClearRsvp = async () => {
    if (confirm('Acknowledge & clear this RSVP alert?')) {
      await clearDateAcceptance()
      setRsvp(null)
    }
  }

  const currentPlace = placesList.find(p => p.id === selectedPlaceId) || placesList[0]

  return (
    <div className="space-y-12 max-w-5xl">
      <div>
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Gift &amp; Date Settings</h1>
        <p className="text-gray-500 text-sm">
          Select where she will be invited, add custom date spots with weekday/weekend schedules, and view her responses.
        </p>
      </div>

      {/* Live RSVP Alert Banner */}
      {rsvp && (
        <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white p-6 md:p-8 rounded-3xl shadow-xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                <Heart className="w-6 h-6 text-white fill-white animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-rose-200">Live RSVP Alert</span>
                <h2 className="text-2xl font-serif font-bold">She Accepted Your Date Invitation! 🎉</h2>
              </div>
            </div>
            <button
              onClick={handleClearRsvp}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-medium transition-colors border border-white/20 self-start sm:self-auto"
            >
              Acknowledge &amp; Clear
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="bg-white/10 p-3.5 rounded-2xl backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-wider text-rose-200 font-bold mb-1">Destination</p>
              <p className="font-serif font-bold text-base leading-tight">{rsvp.placeName}</p>
              <p className="text-xs text-rose-100/80">{rsvp.placeSubtitle}</p>
            </div>
            <div className="bg-white/10 p-3.5 rounded-2xl backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-wider text-rose-200 font-bold mb-1">Chosen Date</p>
              <p className="font-serif font-bold text-base leading-tight">{rsvp.formattedDate}</p>
            </div>
            <div className="bg-white/10 p-3.5 rounded-2xl backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-wider text-rose-200 font-bold mb-1">Offering &amp; Time</p>
              <p className="font-serif font-bold text-base leading-tight">{rsvp.format}</p>
              <p className="text-xs text-rose-100/80">{rsvp.time}</p>
            </div>
            <div className="bg-white/10 p-3.5 rounded-2xl backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-wider text-rose-200 font-bold mb-1">Dress Theme</p>
              <p className="font-serif font-bold text-base leading-tight">{rsvp.color}</p>
              <p className="text-xs text-rose-100/80">{rsvp.price}</p>
            </div>
          </div>

          <p className="text-xs text-rose-100/70 pt-1">
            Accepted at {new Date(rsvp.acceptedAt).toLocaleString()}. WhatsApp was also prompted on her phone.
          </p>
        </div>
      )}

      {/* Date Destination Selector */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-6 h-6 text-rose-500" />
              <h2 className="text-xl font-serif font-bold text-gray-900">
                Date Destination (Where She Will Be Invited)
              </h2>
            </div>
            <p className="text-sm text-gray-500 max-w-2xl">
              Choose the spot below. The app will <strong>automatically check the day of the week</strong> she selects to display the exact operating hours, buffet availability, and pricing for that day!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-2xl shadow-sm transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" /> Add New Place
            </button>

            {currentPlace && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 px-4 py-2.5 rounded-2xl shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Active:</span>
                <span className="font-serif font-bold text-gray-900 text-sm">{currentPlace.name}</span>
              </div>
            )}
          </div>
        </div>

        {placeMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{placeMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {placesList.map((p) => {
            const isSelected = p.id === selectedPlaceId
            const rules = p.scheduleRules

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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-lg">
                      {p.type}
                    </span>
                    {p.isCustom && (
                      <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider rounded-md">
                        Custom
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <span className="absolute top-3 right-3 px-3 py-1 bg-rose-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Selected
                    </span>
                  )}

                  {p.isCustom && !isSelected && (
                    <button
                      onClick={(e) => handleDeletePlace(p.id, e)}
                      className="absolute top-3 right-3 p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-full transition-colors"
                      title="Delete custom place"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="font-serif text-lg font-bold leading-tight">{p.name}</h3>
                    <p className="text-xs text-white/80">{p.subtitle}</p>
                  </div>
                </div>

                {/* Details & Schedules */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between bg-white">
                  <p className="text-xs text-gray-600 italic line-clamp-2">
                    &quot;{p.ambiance}&quot;
                  </p>

                  {/* Weekday vs Weekend Schedule breakdown */}
                  <div className="space-y-1.5 pt-2 border-t border-gray-100 text-[11px] text-gray-600 bg-gray-50/70 p-2.5 rounded-xl">
                    {rules?.weekday && (
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-gray-700">Mon–Thu:</span>
                        <span className="text-right text-gray-600">
                          {rules.weekday.format} ({rules.weekday.price})
                        </span>
                      </div>
                    )}
                    {rules?.weekend && (
                      <div className="flex items-start justify-between gap-2 border-t border-gray-200/60 pt-1">
                        <span className="font-semibold text-rose-600">Fri–Sun:</span>
                        <span className="text-right text-rose-700 font-medium">
                          {rules.weekend.format} ({rules.weekend.price})
                        </span>
                      </div>
                    )}
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

      {/* Add Custom Place Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="font-serif text-2xl font-bold text-gray-900">Add New Date Destination</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlace} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Place Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Cinnamon Grand Coffee Stop"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Subtitle / Location</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g. Galle Face, Colombo"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Type / Category</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                  >
                    <option value="High Tea Buffet">High Tea Buffet</option>
                    <option value="High Tea Platter">High Tea Platter</option>
                    <option value="Brunch & Cafe">Brunch &amp; Cafe</option>
                    <option value="Halal High Tea">Halal High Tea</option>
                    <option value="Halal Cafe">Halal Cafe</option>
                    <option value="Romantic Dinner">Romantic Dinner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Photo Image URL *</label>
                  <input
                    type="url"
                    required
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Ambiance &amp; Vibe Quote</label>
                <textarea
                  value={ambiance}
                  onChange={(e) => setAmbiance(e.target.value)}
                  placeholder="Luxurious, warm lighting, cozy corner for deep conversations..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                />
              </div>

              {/* Weekday Schedule Rules */}
              <div className="p-4 bg-gray-50 rounded-2xl space-y-3 border border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Weekday Schedule (Mon–Thu)</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Format</label>
                    <input
                      type="text"
                      value={weekdayFormat}
                      onChange={(e) => setWeekdayFormat(e.target.value)}
                      placeholder="Platter Service"
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Hours</label>
                    <input
                      type="text"
                      value={weekdayTime}
                      onChange={(e) => setWeekdayTime(e.target.value)}
                      placeholder="3:00 PM - 6:00 PM"
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Price</label>
                    <input
                      type="text"
                      value={weekdayPrice}
                      onChange={(e) => setWeekdayPrice(e.target.value)}
                      placeholder="LKR 3,800"
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Weekend Schedule Rules */}
              <div className="p-4 bg-rose-50/50 rounded-2xl space-y-3 border border-rose-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700">Weekend Schedule (Fri–Sun)</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Format</label>
                    <input
                      type="text"
                      value={weekendFormat}
                      onChange={(e) => setWeekendFormat(e.target.value)}
                      placeholder="Weekend Buffet"
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Hours</label>
                    <input
                      type="text"
                      value={weekendTime}
                      onChange={(e) => setWeekendTime(e.target.value)}
                      placeholder="3:00 PM - 6:00 PM"
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Price</label>
                    <input
                      type="text"
                      value={weekendPrice}
                      onChange={(e) => setWeekendPrice(e.target.value)}
                      placeholder="LKR 5,500 nett"
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold shadow-md"
                >
                  Save &amp; Select Place
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
