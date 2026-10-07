'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'
import { fetchPolaroids, Polaroid } from '@/lib/storage'

const polaroidPositions = [
  'top-[10%] left-[5%] md:left-[10%] -rotate-6',
  'top-[15%] right-[5%] md:right-[10%] rotate-12',
  'bottom-[15%] left-[5%] md:left-[15%] rotate-3',
  'bottom-[10%] right-[5%] md:right-[15%] -rotate-6',
  'top-[45%] left-[2%] md:left-[5%] -rotate-12',
  'top-[55%] right-[2%] md:right-[5%] rotate-6',
]

export default function Home() {
  const [polaroids, setPolaroids] = useState<Polaroid[]>([])

  useEffect(() => {
    fetchPolaroids().then(data => setPolaroids(data.slice(0, 6)))
  }, [])

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
    <main className="flex-1 flex flex-col items-center justify-center p-4 pt-20 pb-10 h-[100dvh] relative overflow-hidden transition-colors duration-1000">
      
      {/* Background Scattered Polaroids */}
      {polaroids.map((polaroid, index) => (
        <motion.div
          key={polaroid.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 + index * 0.2 }}
          className={`absolute z-0 w-28 md:w-40 bg-white p-2 md:p-3 pb-8 md:pb-12 rounded-sm shadow-xl border border-gray-100 transition-all duration-500 hover:z-50 hover:scale-125 hover:rotate-0 hover:shadow-2xl ${polaroidPositions[index % polaroidPositions.length]}`}
        >
          <div className="w-full aspect-[3/4] bg-gray-100 overflow-hidden relative">
            <img 
              src={polaroid.imagePath} 
              alt={polaroid.caption} 
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          {polaroid.caption && (
            <p className="absolute bottom-2 md:bottom-3 left-0 right-0 text-center font-serif text-[10px] md:text-xs text-gray-700 px-2 line-clamp-1">
              {polaroid.caption}
            </p>
          )}
        </motion.div>
      ))}

      <motion.div 
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="max-w-2xl text-center space-y-6 md:space-y-8 z-10 transition-colors duration-1000 bg-white/30 dark:bg-black/20 p-6 md:p-10 rounded-[3rem] backdrop-blur-md shadow-2xl border border-white/50 dark:border-white/10"
      >
        <motion.div variants={itemVars} className="flex justify-center">
          <div className="px-4 py-1.5 backdrop-blur-md rounded-full shadow-sm flex items-center gap-2 transition-colors duration-1000 bg-white/60 dark:bg-white/10 border border-rose-100 dark:border-white/20">
            <Sparkles className="w-3 h-3 text-rose-400 dark:text-purple-300" />
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase transition-colors duration-1000 text-rose-500 dark:text-purple-200">
              A little world, made for you
            </span>
          </div>
        </motion.div>

        <motion.h1 variants={itemVars} className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-none transition-colors duration-1000 text-gray-900 dark:text-gray-100">
          Happy 5 Years,<br />
          & Happy Birthday <br />
          <span className="font-cursive font-normal pr-4 transition-colors duration-1000 text-rose-400 dark:text-purple-300">my everything.</span>
        </motion.h1>
        
        <motion.p variants={itemVars} className="font-serif italic text-base md:text-xl leading-relaxed text-rose-900/80 dark:text-rose-100/80 max-w-xl mx-auto transition-colors duration-1000">
          &quot;A tiny universe holding my letters to you, our memories from the past 5 years, and all the quiet moments we share.&quot;
        </motion.p>

        <motion.div variants={itemVars} className="pt-4">
          <Link 
            href="/gift"
            className="inline-block px-8 py-3.5 md:px-10 md:py-4 text-white rounded-full font-medium transition-all shadow-sm hover:shadow-md hover:-translate-y-1 duration-700 bg-rose-400 hover:bg-rose-500 dark:bg-purple-500/80 dark:hover:bg-purple-500 dark:backdrop-blur-md dark:shadow-purple-500/20"
          >
            Explore your surprise gift
          </Link>
        </motion.div>
      </motion.div>
    </main>
  )
}
