'use client'

import { useState, useEffect } from 'react'
import { fetchMemories, setSessionAuthorized } from '@/lib/storage'
import MemoriesGallery from './MemoriesGallery'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, LockOpen } from 'lucide-react'
import { Memory } from '@/data/initialData'

// The Love Letter Configuration
const letterParts = [
  { type: 'text', content: "To my dearest " },
  { type: 'input', id: 'blank1', placeholder: "pet name", answer: "baby" }, // Change this answer!
  { type: 'text', content: ",\n\nFrom the very first time we went to " },
  { type: 'input', id: 'blank2', placeholder: "place", answer: "colombo" }, // Change this answer!
  { type: 'text', content: ", I knew you were someone special. I absolutely love your " },
  { type: 'input', id: 'blank3', placeholder: "feature", answer: "smile" }, // Change this answer!
  { type: 'text', content: " and how you always make my days brighter. I can't wait to spend " },
  { type: 'input', id: 'blank4', placeholder: "time", answer: "forever" }, // Change this answer!
  { type: 'text', content: " with you.\n\nYours always." }
]

export default function MemoriesContainer() {
  const [memories, setMemories] = useState<Memory[] | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [shake, setShake] = useState(false)

  // Force reset state whenever this page is visited/mounted
  useEffect(() => {
    setMemories(null)
    setError('')
  }, [])

  async function handleUnlock() {
    setError('')
    setLoading(true)
    
    // Check if all answers are correct (case-insensitive, ignoring surrounding spaces)
    let allCorrect = true
    letterParts.forEach(part => {
      if (part.type === 'input') {
        const userAnswer = (answers[part.id as string] || '').toLowerCase().trim()
        const correctAnswer = part.answer?.toLowerCase().trim()
        if (userAnswer !== correctAnswer) {
          allCorrect = false
        }
      }
    })

    if (allCorrect) {
      try {
        setSessionAuthorized('viewer', true)
        const data = await fetchMemories()
        setMemories(data)
      } catch (err) {
        setError('Something went wrong.')
      }
    } else {
      setError("Hmm, that doesn't seem quite right. Try again!")
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
    
    setLoading(false)
  }

  if (memories) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6 pt-32 pb-24">
        <div className="text-center mb-16 space-y-4">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-900">Our Memories</h1>
          <p className="font-sans text-gray-500 font-light">Snapshots of our time together.</p>
        </div>
        <MemoriesGallery memories={memories} />
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl bg-[#FDFBF7] p-8 md:p-12 rounded-[2rem] shadow-lg shadow-rose-900/5 border border-rose-100 text-center mx-6 relative overflow-hidden"
    >
      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-24 h-24 bg-rose-100 rounded-br-[100px] opacity-50" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-rose-50 rounded-tl-[100px] opacity-50" />

      <div className="relative z-10">
        <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Heart className="w-6 h-6 text-rose-500 fill-rose-500/20" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2">A Letter for You</h2>
        <p className="text-sm text-rose-400 mb-10 font-medium tracking-wide uppercase">Fill in the blanks to unlock our memories</p>
        
        <motion.div 
          animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="text-left font-serif text-lg md:text-xl text-gray-800 leading-loose bg-white/60 p-6 md:p-8 rounded-2xl border border-rose-50/50 shadow-sm backdrop-blur-sm"
        >
          {letterParts.map((part, index) => {
            if (part.type === 'text') {
              return <span key={index} className="whitespace-pre-wrap">{part.content}</span>
            } else if (part.type === 'input') {
              return (
                <input
                  key={part.id}
                  type="text"
                  placeholder={part.placeholder}
                  value={answers[part.id as string] || ''}
                  onChange={(e) => {
                    setError('')
                    setAnswers(prev => ({ ...prev, [part.id as string]: e.target.value }))
                  }}
                  className={`inline-block mx-2 border-b-2 bg-rose-50/50 text-center text-rose-600 font-bold focus:outline-none focus:bg-rose-100 transition-colors w-28 md:w-32 rounded-t-md px-2 py-1 ${error ? 'border-red-400' : 'border-rose-300 focus:border-rose-500'}`}
                />
              )
            }
            return null
          })}
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-red-500 text-sm mt-6 font-medium"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          onClick={handleUnlock}
          disabled={loading}
          className="mt-10 inline-flex items-center gap-3 bg-rose-600 text-white font-medium px-8 py-4 rounded-full hover:bg-rose-700 hover:shadow-md hover:shadow-rose-600/20 transition-all disabled:opacity-70 active:scale-95"
        >
          {loading ? 'Opening...' : (
            <>
              Open the Safe <LockOpen className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </motion.div>
  )
}
