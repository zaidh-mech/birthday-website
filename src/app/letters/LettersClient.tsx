'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { X } from 'lucide-react'

import { Letter } from '@/data/initialData'

export default function LettersClient({ letters }: { letters: Letter[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  
  const selectedLetter = letters.find(l => l.id === selectedId)

  return (
    <>
      <div className="flex flex-col items-center -space-y-16 md:-space-y-24 pt-10 pb-32 px-4">
        {letters.map((letter, i) => {
          const rotation = (i % 2 === 0 ? 1 : -1) * ((i % 3) + 2)
          const xOffset = (i % 2 === 0 ? 1 : -1) * ((i % 4) * 8)
          const zIndex = letters.length - i

          return (
            <motion.div
              layoutId={`card-${letter.id}`}
              key={letter.id}
              onClick={() => setSelectedId(letter.id)}
              initial={{ rotate: rotation, x: xOffset }}
              animate={{ rotate: rotation, x: xOffset }}
              whileHover={{ 
                scale: 1.05, 
                rotate: 0, 
                y: -30, 
                zIndex: 100 
              }}
              style={{ zIndex }}
              className="w-full max-w-lg bg-[#fffcf9] dark:bg-[#111218] p-6 sm:p-8 md:p-10 rounded-2xl shadow-lg border border-[#f5e6db] dark:border-white/10 cursor-pointer relative group transition-colors duration-1000"
            >
              <div className="absolute top-6 right-6 w-12 h-12 rounded-full border border-dashed border-rose-200 dark:border-white/20 flex items-center justify-center text-rose-200 dark:text-purple-300 bg-rose-50/50 dark:bg-white/5 group-hover:bg-rose-100 dark:group-hover:bg-white/10 transition-colors">
                <span className="text-xl">💌</span>
              </div>
              
              <motion.div layoutId={`occasion-${letter.id}`} className="text-xs font-semibold uppercase tracking-widest text-rose-400 dark:text-purple-300 mb-3">
                {letter.occasion}
              </motion.div>
              <motion.h2 layoutId={`title-${letter.id}`} className="font-serif text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6 w-5/6">
                {letter.title}
              </motion.h2>
              <motion.p layoutId={`date-${letter.id}`} className="text-sm text-gray-400 dark:text-gray-500 font-light font-sans tracking-wide">
                {format(new Date(letter.date), 'MMMM do, yyyy')}
              </motion.p>
            </motion.div>
          )
        })}
        {letters.length === 0 && (
          <div className="text-center py-20 text-gray-400 dark:text-gray-500 font-light">
            No letters yet. Someone needs to start writing!
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedId && selectedLetter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)}
              className="absolute inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              layoutId={`card-${selectedLetter.id}`}
              className="relative w-full max-w-2xl bg-[#fdfbf7] dark:bg-[#0b0c10] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border dark:border-white/10 transition-colors duration-1000"
            >
              <button 
                onClick={() => setSelectedId(null)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 bg-white/50 dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
              
              <div className="p-6 sm:p-10 md:p-12 overflow-y-auto custom-scrollbar">
                <motion.div layoutId={`occasion-${selectedLetter.id}`} className="text-sm font-semibold uppercase tracking-wider text-rose-400 dark:text-purple-300 mb-3">
                  {selectedLetter.occasion}
                </motion.div>
                <motion.h2 layoutId={`title-${selectedLetter.id}`} className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {selectedLetter.title}
                </motion.h2>
                <motion.p layoutId={`date-${selectedLetter.id}`} className="text-gray-400 dark:text-gray-500 mb-8 pb-8 border-b border-gray-200 dark:border-white/10">
                  {format(new Date(selectedLetter.date), 'MMMM do, yyyy')}
                </motion.p>
                
                <div className="prose prose-rose dark:prose-invert max-w-none font-sans font-light text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {selectedLetter.content}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
