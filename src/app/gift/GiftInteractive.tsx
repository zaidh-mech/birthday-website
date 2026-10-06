'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Memory } from '@/data/initialData'
import { fetchMemories } from '@/lib/storage'

export default function GiftInteractive() {
  const [step, setStep] = useState(0)
  const [date, setDate] = useState('')
  const [color, setColor] = useState('')
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

  const handleYes = () => {
    setStep(3) // Jump to date picker
  }

  const handleNo1 = () => {
    setStep(1)
  }

  const handleNo2 = () => {
    setStep(2)
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
    initial: { opacity: 0, scale: 0.9, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', bounce: 0.5 } },
    exit: { opacity: 0, scale: 0.9, y: -20, transition: { duration: 0.2 } }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[70vh]">
      <div className="w-full max-w-xl mx-auto relative h-[400px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          
          {step === 0 && (
            <motion.div key="step0" variants={variants} initial="initial" animate="animate" exit="exit" className="text-center space-y-8 absolute w-full">
              <h2 className="font-serif text-3xl md:text-5xl font-bold text-gray-900">
                May I take you out on a date with me?
              </h2>
              <div className="flex items-center justify-center gap-6">
                <button onClick={handleYes} className="px-8 py-3 bg-rose-400 text-white rounded-full font-medium hover:bg-rose-500 hover:scale-105 transition-all shadow-md">
                  Yes!
                </button>
                <button onClick={handleNo1} className="px-8 py-3 bg-gray-100 text-gray-600 rounded-full font-medium hover:bg-gray-200 transition-colors">
                  No
                </button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" variants={variants} initial="initial" animate="animate" exit="exit" className="text-center space-y-8 absolute w-full">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 leading-snug">
                Oh come on, you know you want to! 🙄<br/>
                <span className="text-rose-400">But I really want to take you...</span> so will you come please?
              </h2>
              <div className="flex items-center justify-center gap-6">
                <button onClick={handleYes} className="px-8 py-3 bg-rose-400 text-white rounded-full font-medium hover:bg-rose-500 hover:scale-105 transition-all shadow-md">
                  Fine, Yes!
                </button>
                <button onClick={handleNo2} className="px-8 py-3 bg-gray-100 text-gray-600 rounded-full font-medium hover:bg-gray-200 transition-colors">
                  Still No
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" variants={variants} initial="initial" animate="animate" exit="exit" className="text-center space-y-6 absolute w-full flex flex-col items-center">
              {cuteFellaPhoto ? (
                <img src={cuteFellaPhoto} alt="Cute fella" className="w-48 h-48 object-cover rounded-2xl shadow-lg rotate-3" />
              ) : (
                <div className="w-48 h-48 bg-rose-100 rounded-2xl shadow-lg rotate-3 flex items-center justify-center border-2 border-dashed border-rose-300">
                  <span className="text-rose-400 font-medium px-4 text-center">Admin: Please upload cute fella photo</span>
                </div>
              )}
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-gray-900 leading-snug">
                Won't you change your mind for this cute fella? 🥺
              </h2>
              <p className="text-gray-500 italic">
                I know you won't say no for this, that is why "No" is not an option now.
              </p>
              <div className="flex items-center justify-center gap-6 pt-4">
                <button onClick={handleYes} className="px-10 py-4 bg-rose-400 text-white rounded-full font-bold text-lg hover:bg-rose-500 hover:scale-110 transition-all shadow-xl animate-bounce">
                  YES! ❤️
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" variants={variants} initial="initial" animate="animate" exit="exit" className="text-center space-y-8 absolute w-full bg-white/50 backdrop-blur-md p-8 rounded-3xl border border-rose-100 shadow-sm">
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
                  className="px-8 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next step
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" variants={variants} initial="initial" animate="animate" exit="exit" className="text-center space-y-8 absolute w-full">
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
                  className="px-10 py-4 bg-gray-900 text-white rounded-full font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  Lock it in!
                </button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step5" variants={variants} initial="initial" animate="animate" exit="exit" className="text-center space-y-6 absolute w-full">
              <div className="text-6xl animate-bounce mb-4">🎉</div>
              <h2 className="font-serif text-4xl font-bold text-gray-900">
                Perfect!
              </h2>
              <p className="text-gray-600 text-lg">
                I've locked in the details. I can't wait to spend the day with you!<br/>
                More questions coming soon... ❤️
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
