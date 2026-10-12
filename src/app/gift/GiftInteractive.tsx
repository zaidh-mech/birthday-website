'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchMemories, fetchSelectedGiftPlace, fetchPlaces, recordDateAcceptance } from '@/lib/storage'
import { Place, evaluatePlaceForDate } from '@/data/places'
import { CalendarDays, Clock, Wallet, MapPin, Info, MessageCircle, AlertCircle, Sparkles } from 'lucide-react'

export default function GiftInteractive() {
  const [step, setStep] = useState(0)
  const [date, setDate] = useState('')
  const [color, setColor] = useState('')
  const [allPlaces, setAllPlaces] = useState<Place[]>([])
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('churros')
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

      const savedPlaceId = await fetchSelectedGiftPlace()
      if (savedPlaceId) {
        setSelectedPlaceId(savedPlaceId)
      }
    }
    loadData()
  }, [])

  const chosenPlace = allPlaces.find(p => p.id === selectedPlaceId) || allPlaces[0] || {
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

  // Calculate dynamic schedule & availability for chosen date
  const availability = evaluatePlaceForDate(chosenPlace, date)

  const nextStep = () => setStep(s => s + 1)
  const handleYes = () => setStep(3)
  const handleNo1 = () => setStep(1)
  const handleNo2 = () => setStep(2)

  // Triggered when she clicks "Accept Invitation & View Ticket"
  const handleAcceptInvitation = async () => {
    // 1. Record acceptance in database / localStorage
    const rsvpData = {
      placeId: chosenPlace.id,
      placeName: chosenPlace.name,
      placeSubtitle: chosenPlace.subtitle,
      date,
      formattedDate: availability.formattedDate,
      dayName: availability.dayName,
      time: availability.time,
      format: availability.format,
      price: availability.price,
      color,
      acceptedAt: new Date().toISOString()
    }
    await recordDateAcceptance(rsvpData)

    // 2. Open WhatsApp message to boyfriend
    const phoneNumber = "94741999926"
    const text = `❤️ INVITATION ACCEPTED! ❤️\n\nHey my love! I just accepted your invitation for our 5-Year Anniversary date! 🥰\n\n📍 *Destination:* ${chosenPlace.name} (${chosenPlace.subtitle})\n📅 *Date:* ${availability.formattedDate}\n⏰ *Time:* ${availability.time}\n✨ *Offering:* ${availability.format}\n💳 *Price / Details:* ${availability.price}\n🎨 *Dress Theme:* ${color}\n\nI can't wait to celebrate with you! Mwah! 😘`
    const encoded = encodeURIComponent(text)
    window.open(`https://wa.me/${phoneNumber}?text=${encoded}`, '_blank')

    // 3. Move to Ticket
    nextStep()
  }

  const handleWhatsAppSend = () => {
    const phoneNumber = "94741999926"
    const placeTitle = `${chosenPlace.name} (${chosenPlace.subtitle})`
    const baseText = `Hey my love! ❤️\n\nI'm so excited for our 5-Year Anniversary! 🥰\nI'm ready for our date:\n📍 *Where:* ${placeTitle}\n📅 *When:* ${availability.formattedDate}\n⏰ *Time:* ${availability.time}\n✨ *Offering:* ${availability.format}\n🎨 *Dress Theme:* ${color}\n\n`
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
      <div className="w-full max-w-4xl mx-auto relative min-h-[500px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          
          {step === 0 && (
            <motion.div key="step0" variants={variants} initial="initial" animate="animate" exit="exit" className="text-center space-y-8 w-full px-4">
              <div className="space-y-4">
                <p className="text-rose-400 dark:text-purple-300 font-semibold text-sm sm:text-base uppercase tracking-[0.2em]">
                  To celebrate our 5 Years & Your Birthday
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
                Before moving to the &apos;where&apos;...
              </h2>
              <p className="text-gray-600 dark:text-gray-300 font-medium text-lg">
                Choose a colour. <span className="text-rose-400 italic">It&apos;s a secret.</span> 🤫
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
                  Next step
                </button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step5" variants={variants} initial="initial" animate="animate" exit="exit" className="w-full max-w-2xl mx-auto px-4">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-300 text-xs font-semibold uppercase tracking-widest mb-4 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>A Special Invitation For You</span>
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h2 className="font-serif text-3xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  I&apos;ve planned everything for us! 🥰
                </h2>
                <p className="text-gray-600 dark:text-gray-300 font-medium max-w-lg mx-auto text-sm md:text-base">
                  You don&apos;t have to worry about a thing. I&apos;ve already verified our date and chosen our dream spot:
                </p>
              </div>

              {/* Reveal Showcase Card */}
              <div className={`relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20 dark:border-white/10 ${chosenPlace.themeClass}`}>
                {/* Photo & Badges */}
                <div className="relative h-64 md:h-72 w-full overflow-hidden">
                  <img 
                    src={chosenPlace.image} 
                    alt={chosenPlace.name} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                  
                  {/* Dynamic Availability Badge */}
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    <span className="px-3.5 py-1.5 bg-black/60 backdrop-blur-md text-white text-xs font-bold uppercase tracking-widest rounded-xl border border-white/20">
                      {chosenPlace.type}
                    </span>
                    <span className="px-3 py-1.5 bg-rose-500/90 backdrop-blur-md text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5">
                      {availability.badge}
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-6 right-6 text-white">
                    <h3 className="font-serif text-3xl md:text-4xl font-bold leading-tight">
                      {chosenPlace.name}
                    </h3>
                    <p className="text-sm md:text-base text-white/90 font-medium mt-0.5">
                      {chosenPlace.subtitle}
                    </p>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-6 md:p-8 space-y-6">
                  <p className="text-base md:text-lg leading-relaxed italic opacity-95">
                    &quot;{chosenPlace.ambiance}&quot;
                  </p>

                  {/* Day-of-Week Specific Evaluated Schedule Box */}
                  <div className={`p-4 md:p-5 rounded-2xl border space-y-3.5 ${chosenPlace.accentClass}`}>
                    <div className="flex items-center gap-3 text-sm font-medium">
                      <CalendarDays className="w-4 h-4 opacity-80 shrink-0 text-rose-400" />
                      <span><strong>Date Selected:</strong> {availability.formattedDate}</span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <Sparkles className="w-4 h-4 opacity-80 shrink-0 text-amber-400" />
                      <span><strong>Offering for this Day:</strong> {availability.format}</span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="w-4 h-4 opacity-80 shrink-0 text-sky-400" />
                      <span><strong>Timings:</strong> {availability.time}</span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <Wallet className="w-4 h-4 opacity-80 shrink-0 text-emerald-400" />
                      <span><strong>Pricing / Experience:</strong> {availability.price}</span>
                    </div>

                    {availability.note && (
                      <div className="pt-2 border-t border-white/10 text-xs opacity-90 italic">
                        💡 {availability.note}
                      </div>
                    )}
                  </div>

                  {/* Operational Status Notice */}
                  {availability.statusMessage && (
                    <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl text-xs flex items-center gap-2.5 text-amber-200">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{availability.statusMessage}</span>
                    </div>
                  )}

                  <div className="pt-2 text-center">
                    <p className="font-cursive text-2xl md:text-3xl opacity-90 mb-6">
                      A table for two, just for you and me ❤️
                    </p>

                    <button 
                      onClick={handleAcceptInvitation} 
                      className={`w-full py-4 md:py-5 rounded-full font-bold text-lg shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2 ${chosenPlace.buttonClass}`}
                    >
                      <span>Accept Invitation &amp; View Ticket</span> 💌
                    </button>
                    <p className="text-[11px] opacity-70 mt-2">
                      (Tapping will notify me on WhatsApp and reveal your celebration ticket!)
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

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
                    Our Day
                  </h3>

                  <div className="space-y-6 text-left">
                    <div className="flex items-center gap-4 bg-rose-50/50 dark:bg-rose-900/10 p-4 rounded-2xl border border-rose-100 dark:border-rose-800/30 transition-transform hover:-translate-y-1">
                      <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center flex-shrink-0">
                        <CalendarDays className="w-6 h-6 text-rose-500 dark:text-rose-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs uppercase tracking-widest text-rose-400 dark:text-rose-500 font-semibold mb-1">When</p>
                        <p className="font-serif font-bold text-gray-900 dark:text-gray-100 text-lg">
                          {availability.formattedDate}
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
                          {chosenPlace.name} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({chosenPlace.subtitle})</span>
                        </p>
                        <p className="text-xs text-purple-600 dark:text-purple-300 font-medium mt-0.5">
                          ✨ {availability.format} • {availability.time}
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

              {/* WhatsApp RSVP */}
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
