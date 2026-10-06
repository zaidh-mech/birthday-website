'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Memory } from '@/data/initialData'
import { fetchMemories } from '@/lib/storage'
import { Check } from 'lucide-react'

export default function GiftInteractive() {
  const [step, setStep] = useState(0)
  const [date, setDate] = useState('')
  const [color, setColor] = useState('')
  const [place, setPlace] = useState('')
  const [cuteFellaPhoto, setCuteFellaPhoto] = useState<string | null>(null)

  useEffect(() => {
    async function loadPhoto() {
      const memories = await fetchMemories()
      const giftPhoto = memories.find(m => m.title === '[GIFT_PHOTO]')
      if (giftPhoto) {
        setCuteFellaPhoto(giftPhoto.imagePath)
      }
    }
    loadPhoto()
  }, [])

  const nextStep = () => setStep(s => s + 1)

  const handleYes = () => setStep(3)
  const handleNo1 = () => setStep(1)
  const handleNo2 = () => setStep(2)

  const colors = [
    { name: 'Rose', class: 'bg-rose-400' },
    { name: 'Lavender', class: 'bg-purple-400' },
    { name: 'Sky Blue', class: 'bg-sky-400' },
    { name: 'Mint', class: 'bg-teal-400' },
    { name: 'Buttercup', class: 'bg-amber-300' },
    { name: 'Midnight', class: 'bg-slate-800' },
  ]

  const places = [
    {
      id: 'churros',
      name: 'The Churros - Kingsbury',
      time: '3:00 PM - 6:00 PM',
      days: 'Mon-Thu (Platter), Fri-Sun (Buffet)',
      price: 'LKR 3,800 - 5,500',
      desc: 'Elegant luxury pâtisserie high tea at a premium hotel.',
      type: 'High Tea'
    },
    {
      id: 'mandarina',
      name: 'Mandarina Colombo',
      time: '3:30 PM - 5:30 PM',
      days: 'Fri-Sun',
      price: 'LKR 3,500 nett',
      desc: 'Classic hotel high tea with a popular weekend buffet.',
      type: 'Buffet'
    },
    {
      id: 'beira',
      name: 'Beira Kitchen',
      time: '3:30 PM - 5:30 PM',
      days: 'Daily',
      price: 'LKR 4,300 - 4,500 nett',
      desc: 'Vibrant tea time affair with live action stations & gelato.',
      type: 'Buffet'
    },
    {
      id: 'thegrind',
      name: 'The Grind Coffeehouse',
      time: '8:00 AM - 10:00 PM',
      days: 'Daily',
      price: 'A la carte',
      desc: 'Aesthetic, upscale vibe with specialty coffee & bagels.',
      type: 'Brunch/Cafe'
    },
    {
      id: 'radicle',
      name: 'Radicle Cafe',
      time: 'Closes at 6:00 PM',
      days: 'Daily',
      price: 'A la carte',
      desc: 'Tranquil oasis inside a 100+ year-old colonial building.',
      type: 'Specialty Cafe'
    }
  ]

  const variants: any = {
    initial: { opacity: 0, scale: 0.95, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.3 } }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 min-h-[80vh] w-full">
      <div className="w-full max-w-2xl mx-auto relative min-h-[500px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          
          {step === 0 && (
            <motion.div key="step0" variants={variants} initial="initial" animate="animate" exit="exit" className="text-center space-y-8 w-full px-4">
              <h2 className="font-serif text-3xl md:text-5xl font-bold text-gray-900">
                May I take you out on a date with me?
              </h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                <button onClick={handleYes} className="w-full sm:w-auto px-10 py-4 bg-rose-400 text-white rounded-full font-medium hover:bg-rose-500 hover:scale-105 transition-all shadow-md">
                  Yes!
                </button>
                <button onClick={handleNo1} className="w-full sm:w-auto px-10 py-4 bg-gray-100 text-gray-600 rounded-full font-medium hover:bg-gray-200 transition-colors">
                  No
                </button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" variants={variants} initial="initial" animate="animate" exit="exit" className="text-center space-y-8 w-full px-4">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 leading-snug">
                Oh come on, you know you want to! 🙄<br/>
                <span className="text-rose-400">But I really want to take you...</span> so will you come please?
              </h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                <button onClick={handleYes} className="w-full sm:w-auto px-10 py-4 bg-rose-400 text-white rounded-full font-medium hover:bg-rose-500 hover:scale-105 transition-all shadow-md">
                  Fine, Yes!
                </button>
                <button onClick={handleNo2} className="w-full sm:w-auto px-10 py-4 bg-gray-100 text-gray-600 rounded-full font-medium hover:bg-gray-200 transition-colors">
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
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-gray-900 leading-snug">
                Won't you change your mind for this cute fella? 🥺
              </h2>
              <p className="text-gray-500 italic max-w-md mx-auto">
                I know you won't say no for this, that is why "No" is not an option now.
              </p>
              <div className="flex items-center justify-center gap-6 pt-4 w-full sm:w-auto">
                <button onClick={handleYes} className="w-full sm:w-auto px-12 py-5 bg-rose-400 text-white rounded-full font-bold text-lg hover:bg-rose-500 hover:scale-110 transition-all shadow-xl animate-bounce">
                  YES! ❤️
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" variants={variants} initial="initial" animate="animate" exit="exit" className="text-center space-y-8 w-full px-4 bg-white/60 backdrop-blur-md p-8 rounded-3xl border border-rose-100 shadow-sm">
              <h2 className="font-serif text-3xl font-bold text-gray-900">
                Give me a date that you want to enjoy your day with me!
              </h2>
              <p className="text-gray-600 font-medium">
                If a weekday is the plan, inform beforehand so 'your babyboy' can take a leave. <br/>
                <span className="text-rose-400 italic">But if it's weekend, it's fineeee!</span>
              </p>
              
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full max-w-xs p-4 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-rose-300 text-center font-medium"
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
              <h2 className="font-serif text-3xl font-bold text-gray-900">
                Before moving to the 'where'...
              </h2>
              <p className="text-gray-600 font-medium text-lg">
                Choose a colour. <span className="text-rose-400 italic">It's a secret.</span> 🤫
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
            <motion.div key="step5" variants={variants} initial="initial" animate="animate" exit="exit" className="text-center space-y-6 w-full px-4 flex flex-col justify-center">
              <div className="flex-shrink-0">
                <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2">
                  Where should I take you?
                </h2>
                <p className="text-gray-600 font-medium mb-6">
                  Select your favorite vibe from the options below!
                </p>
              </div>

              <div className="overflow-y-auto custom-scrollbar pr-2 space-y-4 text-left pb-10 flex-1">
                {places.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => setPlace(p.name)}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      place === p.name ? 'border-rose-400 bg-rose-50/50 shadow-md scale-[1.02]' : 'border-gray-100 bg-white hover:border-rose-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                        {p.name}
                        {place === p.name && <Check className="w-5 h-5 text-rose-500" />}
                      </h3>
                      <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 rounded-full text-gray-600">
                        {p.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{p.desc}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl">
                      <div><span className="font-medium text-gray-900">Days:</span> {p.days}</div>
                      <div><span className="font-medium text-gray-900">Time:</span> {p.time}</div>
                      <div className="col-span-2"><span className="font-medium text-gray-900">Price:</span> {p.price}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex-shrink-0 bg-gradient-to-t from-gray-50 to-transparent pb-4">
                <button 
                  disabled={!place}
                  onClick={nextStep} 
                  className="px-10 py-4 bg-gray-900 text-white rounded-full font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md w-full sm:w-auto"
                >
                  Lock it in!
                </button>
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div key="step6" variants={variants} initial="initial" animate="animate" exit="exit" className="text-center space-y-6 w-full px-4">
              <div className="text-6xl animate-bounce mb-4">🎉</div>
              <h2 className="font-serif text-4xl font-bold text-gray-900">
                Perfect!
              </h2>
              <div className="text-gray-600 text-lg space-y-2 bg-white/60 p-6 rounded-2xl border border-rose-100 inline-block text-left">
                <p><strong>Date:</strong> {date}</p>
                <p><strong>Secret Color:</strong> {color}</p>
                <p><strong>Location:</strong> {place}</p>
              </div>
              <p className="text-rose-500 font-medium text-xl mt-6">
                I've locked in the details. I can't wait to spend the day with you! ❤️
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
