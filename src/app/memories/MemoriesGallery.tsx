'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { X } from 'lucide-react'

import { Memory } from '@/data/initialData'

export default function MemoriesGallery({ memories }: { memories: Memory[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const visibleMemories = memories.filter(m => m.title !== '[GIFT_PHOTO]')
  const selectedMemory = visibleMemories.find(m => m.id === selectedId)

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleMemories.map((memory) => (
          <motion.div
            layoutId={`memory-${memory.id}`}
            key={memory.id}
            onClick={() => setSelectedId(memory.id)}
            className="relative rounded-2xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-md transition-shadow aspect-square bg-gray-950"
          >
            {/* Cinematic Blurred Background to fill the square without black bars */}
            <img 
              src={memory.imagePath} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-125 transition-transform duration-700 group-hover:scale-150" 
            />
            
            {/* Full Uncropped Photo - Zero Cropping */}
            <img 
              src={memory.imagePath} 
              alt={memory.title} 
              className="absolute inset-0 w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 z-10 drop-shadow-2xl" 
            />
            
            {/* Darker Gradient Overlay for readability */}
            <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
              <h3 className="text-white font-serif text-xl font-bold translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{memory.title}</h3>
            </div>
          </motion.div>
        ))}
        {memories.length === 0 && (
          <div className="col-span-full text-center py-20 text-gray-400 dark:text-gray-500 font-light break-inside-avoid">
            No memories uploaded yet.
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedId && selectedMemory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)}
              className="absolute inset-0 bg-gray-900/90 backdrop-blur-md"
            />
            <motion.div
              layoutId={`memory-${selectedMemory.id}`}
              className="relative w-full max-w-4xl bg-transparent flex flex-col md:flex-row items-center gap-8 z-10"
            >
              <button 
                onClick={() => setSelectedId(null)}
                className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="w-full md:w-3/5 rounded-2xl overflow-hidden shadow-2xl bg-black">
                 <img 
                   src={selectedMemory.imagePath} 
                   alt={selectedMemory.title}
                   className="w-full max-h-[70vh] object-contain"
                 />
              </div>

              <div className="w-full md:w-2/5 text-white space-y-4">
                <h2 className="font-serif text-3xl md:text-4xl font-bold">{selectedMemory.title}</h2>
                <div className="h-px w-12 bg-white/20" />
                <p className="text-lg font-light text-white/90 leading-relaxed italic">
                  "{selectedMemory.caption}"
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
