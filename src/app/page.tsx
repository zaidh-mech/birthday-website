'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, ChevronLeft, ChevronRight, Heart } from 'lucide-react'
import Link from 'next/link'
import { fetchPolaroids, Polaroid } from '@/lib/storage'

const polaroidPositions = [
  'top-[2%] left-[2%] md:top-[8%] md:left-[8%] -rotate-6',
  'top-[2%] right-[2%] md:top-[10%] md:right-[8%] rotate-12',
  'bottom-[2%] left-[2%] md:bottom-[10%] md:left-[10%] rotate-3',
  'bottom-[2%] right-[2%] md:bottom-[8%] md:right-[10%] -rotate-6',
  'hidden sm:flex top-[45%] left-[2%] md:left-[4%] -rotate-12',
  'hidden sm:flex top-[52%] right-[2%] md:right-[4%] rotate-6',
]

export default function Home() {
  const [allPolaroids, setAllPolaroids] = useState<Polaroid[]>([])
  const [startIndex, setStartIndex] = useState(0)
  const [selectedPolaroid, setSelectedPolaroid] = useState<Polaroid | null>(null)

  useEffect(() => {
    fetchPolaroids().then(data => {
      setAllPolaroids(data)
    })
  }, [])

  // Auto-cycle through all polaroids if there are more than 6
  useEffect(() => {
    if (allPolaroids.length <= 6) return
    const interval = setInterval(() => {
      setStartIndex(prev => (prev + 2) % allPolaroids.length)
    }, 7000)
    return () => clearInterval(interval)
  }, [allPolaroids.length])

  // Get current active polaroids to display (up to 6)
  const activePolaroids = allPolaroids.length > 0 
    ? Array.from({ length: Math.min(6, allPolaroids.length) }).map((_, i) => {
        return allPolaroids[(startIndex + i) % allPolaroids.length]
      })
    : []

  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  }

  const itemVars = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } }
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 pt-16 pb-8 md:pt-20 md:pb-10 min-h-[100dvh] relative overflow-hidden transition-colors duration-1000">
      
      {/* Background Scattered Polaroids */}
      <AnimatePresence mode="popLayout">
        {activePolaroids.map((polaroid, index) => (
          <motion.div
            key={`${polaroid.id}-${index}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.8, delay: index * 0.1 }}
            onClick={() => setSelectedPolaroid(polaroid)}
            className={`absolute z-0 w-28 sm:w-36 md:w-44 bg-white p-2 md:p-3 rounded-sm shadow-xl border border-gray-100 transition-all duration-300 hover:z-40 hover:scale-110 md:hover:scale-125 hover:rotate-0 hover:shadow-2xl flex flex-col cursor-pointer ${polaroidPositions[index % polaroidPositions.length]}`}
          >
            <div className="w-full aspect-[3/4] bg-gray-100 overflow-hidden relative rounded-xs">
              <img 
                src={polaroid.imagePath} 
                alt={polaroid.caption} 
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            {polaroid.caption && (
              <div className="pt-1.5 pb-0.5 px-1 min-h-[2rem] md:min-h-[2.75rem] flex items-center justify-center">
                <p className="text-center font-serif text-[9px] md:text-xs text-gray-700 leading-tight break-words line-clamp-2 md:line-clamp-3">
                  {polaroid.caption}
                </p>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      <motion.div 
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="max-w-[90vw] sm:max-w-xl md:max-w-2xl text-center space-y-4 md:space-y-8 z-10 transition-colors duration-1000 bg-white/40 dark:bg-black/30 p-5 sm:p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] backdrop-blur-md shadow-2xl border border-white/60 dark:border-white/10"
      >
        <motion.div variants={itemVars} className="flex justify-center">
          <div className="px-3.5 py-1 md:px-4 md:py-1.5 backdrop-blur-md rounded-full shadow-sm flex items-center gap-2 transition-colors duration-1000 bg-white/70 dark:bg-white/10 border border-rose-100 dark:border-white/20">
            <Sparkles className="w-3 h-3 text-rose-400 dark:text-purple-300" />
            <span className="text-[9px] md:text-[10px] font-semibold tracking-[0.2em] uppercase transition-colors duration-1000 text-rose-500 dark:text-purple-200">
              A little world, made for you
            </span>
          </div>
        </motion.div>

        <motion.h1 variants={itemVars} className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight md:leading-none transition-colors duration-1000 text-gray-900 dark:text-gray-100">
          Happy 5 Years,<br />
          & Happy Birthday <br />
          <span className="font-cursive font-normal pr-4 transition-colors duration-1000 text-rose-400 dark:text-purple-300">my everything.</span>
        </motion.h1>
        
        <motion.p variants={itemVars} className="font-serif italic text-xs sm:text-base md:text-xl leading-relaxed text-rose-900/80 dark:text-rose-100/80 max-w-xl mx-auto transition-colors duration-1000">
          &quot;A tiny universe holding my letters to you, our memories from the past 5 years, and all the quiet moments we share.&quot;
        </motion.p>

        <motion.div variants={itemVars} className="pt-2 md:pt-4">
          <Link 
            href="/gift"
            className="inline-block px-6 py-2.5 sm:px-8 sm:py-3.5 md:px-10 md:py-4 text-sm sm:text-base text-white rounded-full font-medium transition-all shadow-sm hover:shadow-md hover:-translate-y-1 duration-700 bg-rose-400 hover:bg-rose-500 dark:bg-purple-500/80 dark:hover:bg-purple-500 dark:backdrop-blur-md dark:shadow-purple-500/20"
          >
            Explore your surprise gift
          </Link>
        </motion.div>
      </motion.div>

      {/* Polaroid Full Detail Modal / Lightbox */}
      <AnimatePresence>
        {selectedPolaroid && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPolaroid(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-2xl shadow-2xl max-w-sm sm:max-w-md w-full border border-rose-100 dark:border-zinc-800 flex flex-col items-center"
            >
              <button
                onClick={() => setSelectedPolaroid(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-500 dark:text-gray-300 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-full aspect-[3/4] bg-gray-100 dark:bg-zinc-800 rounded-xl overflow-hidden relative shadow-inner">
                <img
                  src={selectedPolaroid.imagePath}
                  alt={selectedPolaroid.caption}
                  className="w-full h-full object-cover"
                />
              </div>

              {selectedPolaroid.caption && (
                <div className="mt-4 text-center px-2">
                  <div className="flex items-center justify-center gap-1.5 text-rose-400 mb-1">
                    <Heart className="w-3.5 h-3.5 fill-rose-400" />
                  </div>
                  <p className="font-serif text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                    {selectedPolaroid.caption}
                  </p>
                </div>
              )}

              {allPolaroids.length > 1 && (
                <div className="flex items-center justify-between w-full mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800 text-xs text-gray-400">
                  <button
                    onClick={() => {
                      const currIdx = allPolaroids.findIndex(p => p.id === selectedPolaroid.id)
                      const prevIdx = (currIdx - 1 + allPolaroids.length) % allPolaroids.length
                      setSelectedPolaroid(allPolaroids[prevIdx])
                    }}
                    className="flex items-center gap-1 hover:text-rose-500 transition-colors py-1 px-2 rounded-lg hover:bg-rose-50 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <span className="text-[11px] font-mono">
                    {allPolaroids.findIndex(p => p.id === selectedPolaroid.id) + 1} / {allPolaroids.length}
                  </span>
                  <button
                    onClick={() => {
                      const currIdx = allPolaroids.findIndex(p => p.id === selectedPolaroid.id)
                      const nextIdx = (currIdx + 1) % allPolaroids.length
                      setSelectedPolaroid(allPolaroids[nextIdx])
                    }}
                    className="flex items-center gap-1 hover:text-rose-500 transition-colors py-1 px-2 rounded-lg hover:bg-rose-50 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
