'use client'

import { useState, useEffect } from 'react'
import { fetchMemories, fetchLetters, setSessionAuthorized, getSafeUnlockedOverride } from '@/lib/storage'
import MemoriesGallery from './MemoriesGallery'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, LockOpen } from 'lucide-react'
import { Memory } from '@/data/initialData'

const DEFAULT_LETTER_TEXT = `To my dearest [pet name|baby],

From the very first time we went to [place|colombo], I knew you were someone special. I absolutely love your [feature|smile] and how you always make my days brighter. I can't wait to spend [time|forever] with you.

Yours always.`

export default function MemoriesContainer() {
  const [memories, setMemories] = useState<Memory[] | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [shake, setShake] = useState(false)
  const [letterParts, setLetterParts] = useState<any[]>([])

  useEffect(() => {
    setMemories(null)
    setError('')
    
    // Fetch letter config
    async function loadLetter() {
      if (getSafeUnlockedOverride()) {
        const data = await fetchMemories();
        setMemories(data);
        return;
      }
      const letters = await fetchLetters()
      const lockLetter = letters.find(l => l.title === '[LOCK_LETTER]')
      const rawText = lockLetter ? lockLetter.content : DEFAULT_LETTER_TEXT
      
      const regex = /\[([^\|]+)\|([^\]]+)\]/g
      let lastIndex = 0
      const parts = []
      let match
      let blankCount = 1

      while ((match = regex.exec(rawText)) !== null) {
        if (match.index > lastIndex) {
          parts.push({ type: 'text', content: rawText.substring(lastIndex, match.index) })
        }
        parts.push({ 
          type: 'input', 
          id: `blank${blankCount++}`, 
          placeholder: match[1].trim(), 
          answer: match[2].trim() 
        })
        lastIndex = regex.lastIndex
      }
      if (lastIndex < rawText.length) {
        parts.push({ type: 'text', content: rawText.substring(lastIndex) })
      }
      setLetterParts(parts)
    }
    
    loadLetter()
  }, [])

  async function handleUnlock() {
    setError('')
    setLoading(true)
    
    let allCorrect = true
    letterParts.forEach(part => {
      if (part.type === 'input') {
        const userAnswer = (answers[part.id] || '').toLowerCase().trim()
        const correctAnswer = (part.answer || '').toLowerCase().trim()
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
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100">Our Memories</h1>
          <p className="font-serif italic text-lg text-rose-900/80 dark:text-rose-100/80">Snapshots of our time together.</p>
        </div>
        <MemoriesGallery memories={memories} />
      </div>
    )
  }

  if (letterParts.length === 0) {
    return <div className="min-h-screen bg-transparent" />
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full pt-32 pb-24">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-[#FDFBF7] dark:bg-[#111218] p-6 sm:p-8 md:p-12 rounded-[2rem] shadow-lg shadow-rose-900/5 dark:shadow-none border border-rose-100 dark:border-white/10 text-center mx-4 sm:mx-6 relative overflow-hidden transition-colors duration-1000"
      >
      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-24 h-24 bg-rose-100 dark:bg-white/5 rounded-br-[100px] opacity-50 transition-colors" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-rose-50 dark:bg-white/5 rounded-tl-[100px] opacity-50 transition-colors" />

      <div className="relative z-10">
        <div className="w-14 h-14 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner transition-colors">
          <Heart className="w-6 h-6 text-rose-500 dark:text-rose-400 fill-rose-500/20" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">A Letter for You</h2>
        <p className="text-sm text-rose-400 mb-10 font-medium tracking-wide uppercase">Fill in the blanks to unlock our memories</p>
        
        <motion.div 
          animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="text-left font-serif text-lg md:text-xl text-gray-800 dark:text-gray-200 leading-loose bg-white/60 dark:bg-white/10 p-6 md:p-8 rounded-2xl border border-rose-50/50 dark:border-white/10 shadow-sm backdrop-blur-sm transition-colors duration-1000"
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
                  value={answers[part.id] || ''}
                  onChange={(e) => {
                    setError('')
                    setAnswers(prev => ({ ...prev, [part.id]: e.target.value }))
                  }}
                  className={`inline-block mx-2 border-b-2 bg-rose-50/50 dark:bg-white/10 text-center text-rose-600 dark:text-purple-300 font-bold focus:outline-none focus:bg-rose-100 dark:focus:bg-white/20 transition-colors w-28 md:w-32 rounded-t-md px-2 py-1 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${error ? 'border-red-400' : 'border-rose-300 dark:border-purple-400 focus:border-rose-500 dark:focus:border-purple-300'}`}
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
    </div>
  )
}
