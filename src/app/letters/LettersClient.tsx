'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { X } from 'lucide-react'

type Letter = {
  id: string
  title: string
  content: string
  occasion: string
  date: Date
}

export default function LettersClient({ letters }: { letters: Letter[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  
  const selectedLetter = letters.find(l => l.id === selectedId)

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {letters.map((letter) => (
          <motion.div
            layoutId={`card-${letter.id}`}
            key={letter.id}
            onClick={() => setSelectedId(letter.id)}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow group relative overflow-hidden"
            whileHover={{ y: -4 }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
            
            <motion.div layoutId={`occasion-${letter.id}`} className="text-xs font-semibold uppercase tracking-wider text-rose-400 mb-2">
              {letter.occasion}
            </motion.div>
            <motion.h2 layoutId={`title-${letter.id}`} className="font-serif text-xl font-bold text-gray-900 mb-4">
              {letter.title}
            </motion.h2>
            <motion.p layoutId={`date-${letter.id}`} className="text-sm text-gray-400 font-light mt-auto pt-4 border-t border-gray-50">
              {format(new Date(letter.date), 'MMMM do, yyyy')}
            </motion.p>
          </motion.div>
        ))}
        {letters.length === 0 && (
          <div className="col-span-full text-center py-20 text-gray-400 font-light">
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
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div
              layoutId={`card-${selectedLetter.id}`}
              className="relative w-full max-w-2xl bg-[#fdfbf7] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedId(null)}
                className="absolute top-6 right-6 p-2 bg-white/50 hover:bg-gray-100 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
              
              <div className="p-8 sm:p-12 overflow-y-auto custom-scrollbar">
                <motion.div layoutId={`occasion-${selectedLetter.id}`} className="text-sm font-semibold uppercase tracking-wider text-rose-400 mb-3">
                  {selectedLetter.occasion}
                </motion.div>
                <motion.h2 layoutId={`title-${selectedLetter.id}`} className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  {selectedLetter.title}
                </motion.h2>
                <motion.p layoutId={`date-${selectedLetter.id}`} className="text-gray-400 mb-8 pb-8 border-b border-gray-200">
                  {format(new Date(selectedLetter.date), 'MMMM do, yyyy')}
                </motion.p>
                
                <div className="prose prose-rose max-w-none font-sans font-light text-gray-700 leading-relaxed whitespace-pre-wrap">
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
