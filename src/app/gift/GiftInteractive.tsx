'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchMemories, fetchPlaces, recordDateAcceptance } from '@/lib/storage'
import { Place, evaluatePlaceForDate, DateAvailability } from '@/data/places'
import { 
  CalendarDays, 
  Clock, 
  Wallet, 
  MapPin, 
  Info, 
  MessageCircle, 
  AlertCircle, 
  Sparkles, 
  Check, 
  Heart,
  ChevronRight,
  Utensils
} from 'lucide-react'

export default function GiftInteractive() {
  const [step, setStep] = useState(0)
  const [date, setDate] = useState('')
  const [color, setColor] = useState('')
  const [allPlaces, setAllPlaces] = useState<Place[]>([])
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [cuteFellaPhoto, setCuteFellaPhoto] = useState<string | null>(null)
  const [customMessage, setCustomMessage] = useState('')

  useEffect(() => {
    async function loadData() {
      const memories = await fetchMemories()
      const giftPhoto = memories.find(m => m.title === '[GIFT_PHOTO]')
      if (giftPhoto) {
        setCuteFellaPhoto(giftPhoto.imagePath)
      }

      const placesList = await fetchPlaces()
      setAllPlaces(placesList)
    }
    loadData()
  }, [])

  // Evaluate all places for the selected date
  const evaluatedPlaces = allPlaces.map(p => ({
    place: p,
    availability: evaluatePlaceForDate(p, date)
  }))

  // Only present places that are open on her chosen date
  const openPlaces = evaluatedPlaces.filter(item => item.availability.isOpen)
  const availablePlaces = openPlaces.length > 0 ? openPlaces : evaluatedPlaces

  // Filter by category
  const categories = [
    { id: 'all', label: 'All Places' },
    { id: 'buffet', label: '🍽️ Lunch Buffets' },
    { id: 'hightea', label: '🫖 High Tea & Platters' },
    { id: 'cafe', label: '☕ Cafes & Brunch' },
    { id: 'halal', label: '🌙 Halal Friendly' }
  ]

  const filteredPlaces = availablePlaces.filter(({ place }) => {
    if (filterCategory === 'all') return true
    const type = place.type.toLowerCase()
    const name = place.name.toLowerCase()
    const desc = (place.desc || '').toLowerCase()
    const ambiance = (place.ambiance || '').toLowerCase()

    if (filterCategory === 'buffet') {
      return type.includes('buffet') || type.includes('lunch') || name.includes('buffet') || name.includes('lunch')
    }
    if (filterCategory === 'hightea') {
      return type.includes('high tea') || type.includes('platter') || type.includes('patisserie')
    }
    if (filterCategory === 'cafe') {
      return type.includes('cafe') || type.includes('brunch') || type.includes('coffee')
    }
    if (filterCategory === 'halal') {
      return type.includes('halal') || desc.includes('halal') || ambiance.includes('halal')
    }
    return true
  })

  // Selected place object
  const currentSelection = availablePlaces.find(item => item.place.id === selectedPlaceId) || availablePlaces[0]
  const activePlace = currentSelection?.place || allPlaces[0] || {
    id: 'churros',
    name: 'The Churros',
    subtitle: 'The Kingsbury Hotel',
    time: '3:00 PM - 6:00 PM',
    days: 'Daily',
    price: 'LKR 3,800 - 5,500',
    desc: 'Elegant luxury pâtisserie high tea.',
    ambiance: 'Opulent, luxurious, and grand.',
    type: 'High Tea',
    image: 'https://pulse.lk/wp-content/uploads/2024/04/Churros-Kingsbury.jpg',
    themeClass: 'bg-[#2A1C14] text-[#F3E5D8]',
    accentClass: 'bg-[#4A3222] text-[#F3E5D8] border-[#8C6D53]',
    buttonClass: 'bg-[#8C6D53] hover:bg-[#A68365] text-white',
  }
  const activeAvailability: DateAvailability = currentSelection?.availability || evaluatePlaceForDate(activePlace, date)

  const nextStep = () => setStep(s => s + 1)
  const handleYes = () => setStep(3)
  const handleNo1 = () => setStep(1)
  const handleNo2 = () => setStep(2)

  // Triggered when she selects a place and confirms her choice
  const handleAcceptInvitation = async () => {
    // 1. Record acceptance in database / localStorage
    const rsvpData = {
      placeId: activePlace.id,
      placeName: activePlace.name,
      placeSubtitle: activePlace.subtitle,
      date,
      formattedDate: activeAvailability.formattedDate,
      dayName: activeAvailability.dayName,
      time: activeAvailability.time,
      format: activeAvailability.format,
      price: activeAvailability.price,
      color,
      acceptedAt: new Date().toISOString()
    }
    await recordDateAcceptance(rsvpData)

    // 2. Open WhatsApp message to boyfriend
    const phoneNumber = "94741999926"
    const text = `❤️ INVITATION ACCEPTED! ❤️\n\nHey my love! I just chose our date spot for our 5-Year Anniversary! 🥰\n\n📍 *Destination:* ${activePlace.name} (${activePlace.subtitle})\n📅 *Date:* ${activeAvailability.formattedDate}\n⏰ *Time:* ${activeAvailability.time}\n✨ *Offering:* ${activeAvailability.format}\n💳 *Price / Details:* ${activeAvailability.price}\n🎨 *Dress Theme:* ${color}\n\nI can't wait to celebrate with you! Mwah! 😘`
    const encoded = encodeURIComponent(text)
    window.open(`https://wa.me/${phoneNumber}?text=${encoded}`, '_blank')

    // 3. Move to Ticket
    nextStep()
  }

  const handleWhatsAppSend = () => {
    const phoneNumber = "94741999926"
    const placeTitle = `${activePlace.name} (${activePlace.subtitle})`
    const baseText = `Hey my love! ❤️\n\nI'm so excited for our 5-Year Anniversary! 🥰\nI'm ready for our date:\n📍 *Where:* ${placeTitle}\n📅 *When:* ${activeAvailability.formattedDate}\n⏰ *Time:* ${activeAvailability.time}\n✨ *Offering:* ${activeAvailability.format}\n🎨 *Dress Theme:* ${color}\n\n`
    const finalMessage = customMessage.trim() ? `${baseText}*My message to you:* ${customMessage}` : `${baseText}I can't wait to see you! 😘`
    const encodedMessage = encodeURIComponent(finalMessage)
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank')
  }

  const colors = [
    { name: 'Rose', class: 'bg-rose-400' },
    { name: 'Lavender', class: 'bg-purple-400' },
    { name: 'Sky Blue', class: 'bg-sky-400' },
    { name: 'Mint', class: 'bg-teal-400' },
    { name: 'Buttercup', class: 'bg-amber-300' },
    { name: 'Midnight', class: 'bg-slate-800' },
  ]

  const variants: any = {
    initial: { opacity: 0, scale: 0.95, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.3 } }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 min-h-[80vh] w-full">
      <div className={`w-full mx-auto relative min-h-[500px] flex items-center justify-center ${step === 5 ? 'max-w-6xl' : 'max-w-4xl'}`}>
        <AnimatePresence mode="wait">
          
          {step === 0 && (
            <motion.div key="step0" variants={variants} initial="initial" animate="animate" exit="exit" className="text-center space-y-8 w-full px-4">
              <div className="space-y-4">
                <p className="text-rose-400 dark:text-purple-300 font-semibold text-sm sm:text-base uppercase tracking-[0.2em]">
                  To celebrate our 5 Years &amp; Your Birthday
                </p>
                <h2 className="font-serif text-3xl md:text-5xl font-bold text-gray-900 dark:text-gray-100">
                  May I take you out on a date with me?
                </h2>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                <button onClick={handleYes} className="w-full sm:w-auto px-10 py-4 bg-rose-400 text-white rounded-full font-medium hover:bg-rose-500 hover:scale-105 transition-all shadow-md">
                  Yes!
                </button>
                <button onClick={handleNo1} className="w-full sm:w-auto px-10 py-4 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded-full font-medium hover:bg-gray-200 transition-colors">
                  No
                </button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" variants={variants} initial="initial" animate="animate" exit="exit" className="text-center space-y-8 w-full px-4">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-snug">
                Oh come on, you know you want to! 🙄<br/>
                <span className="text-rose-400">But I really want to take you...</span> so will you come please?
              </h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                <button onClick={handleYes} className="w-full sm:w-auto px-10 py-4 bg-rose-400 text-white rounded-full font-medium hover:bg-rose-500 hover:scale-105 transition-all shadow-md">
                  Fine, Yes!
                </button>
                <button onClick={handleNo2} className="w-full sm:w-auto px-10 py-4 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded-full font-medium hover:bg-gray-200 transition-colors">
                  Still No
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" variants={variants} initial="initial" animate="animate" exit="exit" className="text-center space-y-6 w-full px-4 flex flex-col items-center">
              {cuteFellaPhoto ? (
                <img src={cuteFellaPhoto} alt="Cute fella" className="w-48 h-48 sm:w-56 sm:h-56 object-cover rounded-2xl shadow-lg rotate-3" />
              ) : (
                <div className="w-48 h-48 sm:w-56 sm:h-56 bg-rose-100 rounded-2xl shadow-lg rotate-3 flex items-center justify-center border-2 border-dashed border-rose-300">
                  <span className="text-rose-400 font-medium px-4 text-center">Admin: Please upload cute fella photo</span>
                </div>
              )}
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-snug">
                Won&apos;t you change your mind for this cute fella? 🥺
              </h2>
              <p className="text-gray-500 dark:text-gray-400 italic max-w-md mx-auto">
                I know you won&apos;t say no for this, that is why &quot;No&quot; is not an option now.
              </p>
              <div className="flex items-center justify-center gap-6 pt-4 w-full sm:w-auto">
                <button onClick={handleYes} className="w-full sm:w-auto px-12 py-5 bg-rose-400 text-white rounded-full font-bold text-lg hover:bg-rose-500 hover:scale-110 transition-all shadow-xl animate-bounce">
                  YES! ❤️
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" variants={variants} initial="initial" animate="animate" exit="exit" className="text-center space-y-8 w-full px-4 bg-white/60 dark:bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-rose-100 dark:border-white/10 shadow-sm max-w-2xl mx-auto">
              <h2 className="font-serif text-3xl font-bold text-gray-900 dark:text-gray-100">
                Give me a date that you want to enjoy your day with me!
              </h2>
              <p className="text-gray-600 dark:text-gray-300 font-medium">
                If a weekday is the plan, inform beforehand so &apos;your babyboy&apos; can take a leave. <br/>
                <span className="text-rose-400 italic">But if it&apos;s weekend, it&apos;s fineeee!</span>
              </p>
              
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full max-w-xs p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-rose-300 text-center font-medium"
              />

              <div>
                <button 
                  disabled={!date}
                  onClick={nextStep} 
                  className="px-10 py-4 bg-gray-900 text-white rounded-full font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md w-full sm:w-auto"
                >
                  Next step
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" variants={variants} initial="initial" animate="animate" exit="exit" className="text-center space-y-8 w-full px-4">
              <h2 className="font-serif text-3xl font-bold text-gray-900 dark:text-gray-100">
                Before choosing where to go...
              </h2>
              <p className="text-gray-600 dark:text-gray-300 font-medium text-lg">
                Choose a colour for our dress theme. <span className="text-rose-400 italic">It&apos;s a secret.</span> 🤫
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 max-w-sm mx-auto">
                {colors.map(c => (
                  <button
                    key={c.name}
                    onClick={() => setColor(c.name)}
                    className={`w-16 h-16 rounded-full shadow-sm hover:scale-110 transition-transform ${c.class} ${color === c.name ? 'ring-4 ring-offset-4 ring-gray-900' : ''}`}
                    title={c.name}
                  />
                ))}
              </div>

              <div className="pt-8">
                <button 
                  disabled={!color}
                  onClick={nextStep} 
                  className="px-10 py-4 bg-gray-900 text-white rounded-full font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md w-full sm:w-auto"
                >
                  Explore Available Places ✨
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 5: Choose The Place from All Available Options on Selected Date */}
          {step === 5 && (
            <motion.div key="step5" variants={variants} initial="initial" animate="animate" exit="exit" className="w-full space-y-8 py-2">
              {/* Header */}
              <div className="text-center space-y-3 max-w-3xl mx-auto px-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-300 text-xs font-semibold uppercase tracking-widest shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Choose Your Favorite Date Destination</span>
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                
                <h2 className="font-serif text-3xl md:text-5xl font-bold text-gray-900 dark:text-gray-100">
                  Where would you love to go, my love? 🥰
                </h2>

                <p className="text-gray-600 dark:text-gray-300 font-medium text-sm md:text-base max-w-2xl mx-auto">
                  Every place below is open on your selected day. The hours, live buffets, platters, and prices shown are calculated for that exact date:
                </p>

                {/* Date Badge with Change Option */}
                <div className="pt-1 flex items-center justify-center">
                  <button
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-white/10 border border-rose-200 dark:border-white/20 text-rose-600 dark:text-rose-300 text-xs font-semibold hover:bg-rose-50 transition-colors shadow-sm"
                  >
                    <CalendarDays className="w-4 h-4 text-rose-500" />
                    <span>{activeAvailability.formattedDate}</span>
                    <span className="text-[10px] text-gray-400 font-normal underline ml-1">Change date</span>
                  </button>
                </div>

                {/* Category Filter Tabs */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setFilterCategory(cat.id)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                        filterCategory === cat.id
                          ? 'bg-rose-500 text-white shadow-md scale-105'
                          : 'bg-white/80 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-white/20 border border-gray-200 dark:border-white/10'
                      }`}
                    >
                      {cat.label} {cat.id === 'all' ? `(${availablePlaces.length})` : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Available Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
                {filteredPlaces.map(({ place, availability }) => {
                  const isSelected = (selectedPlaceId ? selectedPlaceId === place.id : activePlace.id === place.id)
                  return (
                    <div
                      key={place.id}
                      onClick={() => setSelectedPlaceId(place.id)}
                      className={`group relative rounded-3xl overflow-hidden cursor-pointer border-2 transition-all flex flex-col justify-between bg-white dark:bg-[#181924] ${
                        isSelected
                          ? 'border-rose-500 ring-4 ring-rose-200 dark:ring-rose-950 shadow-2xl -translate-y-1.5 bg-rose-50/20'
                          : 'border-gray-200 dark:border-white/10 hover:border-rose-300 hover:shadow-lg hover:-translate-y-1'
                      }`}
                    >
                      {/* Photo & Badges */}
                      <div className="relative h-52 w-full overflow-hidden bg-gray-100 dark:bg-black/40">
                        <img 
                          src={place.image} 
                          alt={place.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                        
                        {/* Badges on Top */}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                          <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-lg border border-white/10">
                            {place.type}
                          </span>
                          <span className="px-2.5 py-1 bg-rose-500/90 backdrop-blur-md text-white text-[10px] font-bold rounded-lg shadow-sm">
                            {availability.badge}
                          </span>
                        </div>

                        {/* Selected Indicator */}
                        {isSelected && (
                          <span className="absolute top-3 right-3 px-3 py-1 bg-rose-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1 animate-in zoom-in-75 duration-200">
                            <Check className="w-3.5 h-3.5" /> Selected
                          </span>
                        )}

                        <div className="absolute bottom-3 left-4 right-4 text-white">
                          <h3 className="font-serif text-xl font-bold leading-tight">{place.name}</h3>
                          <p className="text-xs text-white/80 mt-0.5">{place.subtitle}</p>
                        </div>
                      </div>

                      {/* Details Content */}
                      <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                        <p className="text-xs text-gray-600 dark:text-gray-300 italic line-clamp-2">
                          &quot;{place.ambiance}&quot;
                        </p>

                        {/* Day-of-Week Evaluated Schedule Box */}
                        <div className="bg-rose-50/70 dark:bg-rose-950/20 p-3.5 rounded-2xl border border-rose-100 dark:border-rose-900/30 space-y-2 text-xs">
                          <div className="flex items-start gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-gray-900 dark:text-gray-100">{availability.format}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                            <span>{availability.time}</span>
                          </div>

                          <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-semibold text-[11px]">
                            <Wallet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{availability.price}</span>
                          </div>

                          {availability.note && (
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 italic pt-1 border-t border-rose-200/50 dark:border-rose-900/20">
                              💡 {availability.note}
                            </p>
                          )}
                        </div>

                        {/* Select Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedPlaceId(place.id)
                          }}
                          className={`w-full py-2.5 rounded-xl font-medium text-xs transition-colors flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? 'bg-rose-500 text-white font-bold shadow-md'
                              : 'bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-800 dark:text-gray-200'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-4 h-4" /> Picked as Our Spot ❤️
                            </>
                          ) : (
                            'Select This Place'
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Floating Bottom Sticky Bar to Lock In Destination */}
              <div className="sticky bottom-4 z-30 pt-6 px-2">
                <div className="bg-white/95 dark:bg-[#151622]/95 backdrop-blur-xl p-4 md:p-6 rounded-3xl border-2 border-rose-300 dark:border-rose-800 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 max-w-3xl mx-auto">
                  <div className="text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-rose-500 dark:text-rose-400 text-xs font-bold uppercase tracking-wider mb-0.5">
                      <Heart className="w-3.5 h-3.5 fill-rose-500" />
                      <span>Your Chosen Destination:</span>
                    </div>
                    <h4 className="font-serif text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100">
                      {activePlace.name} <span className="text-xs font-normal text-gray-500 dark:text-gray-400">({activePlace.subtitle})</span>
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      {activeAvailability.format} • {activeAvailability.time} • {activeAvailability.price}
                    </p>
                  </div>

                  <button
                    onClick={handleAcceptInvitation}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-600 text-white rounded-full font-bold text-sm md:text-base shadow-lg shadow-rose-500/30 transition-all hover:scale-105 shrink-0 flex items-center justify-center gap-2"
                  >
                    <span>Accept &amp; Lock In!</span> 💌
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 6: Romantic Celebration Ticket */}
          {step === 6 && (
            <motion.div key="step6" variants={variants} initial="initial" animate="animate" exit="exit" className="text-center w-full px-4 max-w-2xl mx-auto">
              {/* Header */}
              <div className="mb-8 relative">
                <div className="text-6xl animate-bounce mb-6">💖</div>
                <h2 className="font-serif text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-purple-600 dark:from-rose-400 dark:to-purple-400">
                  It&apos;s a Date!
                </h2>
                <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium tracking-widest uppercase text-sm">
                  Mwah, I love youuuuuu
                </p>
              </div>
              
              {/* Romantic Ticket */}
              <div className="relative w-full rounded-[2rem] overflow-hidden p-1 shadow-2xl shadow-rose-500/20 dark:shadow-purple-900/30 mb-12">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-300 via-purple-300 to-rose-300 dark:from-rose-600 dark:via-purple-600 dark:to-rose-600 opacity-50" />
                
                <div className="relative bg-white/90 dark:bg-[#111218]/95 backdrop-blur-xl rounded-[1.8rem] p-8 md:p-10 border border-white/50 dark:border-white/10">
                  <div className="absolute top-4 left-4 text-rose-300 dark:text-rose-700/50">✦</div>
                  <div className="absolute top-4 right-4 text-rose-300 dark:text-rose-700/50">✦</div>
                  <div className="absolute bottom-4 left-4 text-rose-300 dark:text-rose-700/50">✦</div>
                  <div className="absolute bottom-4 right-4 text-rose-300 dark:text-rose-700/50">✦</div>

                  <h3 className="font-serif text-3xl font-bold text-rose-900 dark:text-rose-100 mb-8">
                    Our Celebration Ticket
                  </h3>

                  <div className="space-y-6 text-left">
                    <div className="flex items-center gap-4 bg-rose-50/50 dark:bg-rose-900/10 p-4 rounded-2xl border border-rose-100 dark:border-rose-800/30 transition-transform hover:-translate-y-1">
                      <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center flex-shrink-0">
                        <CalendarDays className="w-6 h-6 text-rose-500 dark:text-rose-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs uppercase tracking-widest text-rose-400 dark:text-rose-500 font-semibold mb-1">When</p>
                        <p className="font-serif font-bold text-gray-900 dark:text-gray-100 text-lg">
                          {activeAvailability.formattedDate}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 bg-purple-50/50 dark:bg-purple-900/10 p-4 rounded-2xl border border-purple-100 dark:border-purple-800/30 transition-transform hover:-translate-y-1">
                      <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-6 h-6 text-purple-500 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs uppercase tracking-widest text-purple-400 dark:text-purple-500 font-semibold mb-1">Where &amp; Format</p>
                        <p className="font-serif font-bold text-gray-900 dark:text-gray-100 text-lg">
                          {activePlace.name} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({activePlace.subtitle})</span>
                        </p>
                        <p className="text-xs text-purple-600 dark:text-purple-300 font-medium mt-0.5">
                          ✨ {activeAvailability.format} • {activeAvailability.time}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 bg-sky-50/50 dark:bg-sky-900/10 p-4 rounded-2xl border border-sky-100 dark:border-sky-800/30 transition-transform hover:-translate-y-1">
                      <div className="w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center flex-shrink-0">
                        <Info className="w-6 h-6 text-sky-500 dark:text-sky-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs uppercase tracking-widest text-sky-400 dark:text-sky-500 font-semibold mb-1">Dress Theme</p>
                        <p className="font-serif font-bold text-gray-900 dark:text-gray-100 text-lg">{color}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 text-center">
                    <p className="font-cursive text-4xl text-rose-500 dark:text-rose-400">
                      I can&apos;t wait to celebrate with you!
                    </p>
                  </div>
                </div>
              </div>

              {/* WhatsApp RSVP Message */}
              <div className="bg-white/60 dark:bg-[#1a1b26]/60 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] border border-rose-100/50 dark:border-white/5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-purple-400" />
                <h3 className="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  Send Your RSVP 💌
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 max-w-md mx-auto">
                  Add a cute message below. It will pop up right in my WhatsApp so I know you&apos;ve locked it in!
                </p>
                <textarea 
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="I can't wait! 🥰"
                  className="w-full p-5 rounded-2xl border border-rose-100 dark:border-white/10 bg-white dark:bg-black/40 focus:ring-2 focus:ring-rose-400 outline-none mb-6 min-h-[120px] text-gray-800 dark:text-gray-200 custom-scrollbar resize-none shadow-inner"
                />
                <button 
                  onClick={handleWhatsAppSend}
                  className="w-full py-4 bg-gradient-to-r from-[#25D366] to-[#1DA851] hover:from-[#1DA851] hover:to-[#128C7E] text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-green-500/20 transition-all hover:-translate-y-1 hover:shadow-green-500/40"
                >
                  <MessageCircle className="w-6 h-6" />
                  Send to my WhatsApp
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
