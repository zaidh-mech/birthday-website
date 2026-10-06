'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Moon, Sun } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const [isNightMode, setIsNightMode] = useState(false)
  const [stars, setStars] = useState<{ id: number; x: number; y: number; size: number; delay: number }[]>([])

  // Generate random stars on mount
  useEffect(() => {
    const generatedStars = Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      delay: Math.random() * 4
    }))
    setStars(generatedStars)
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
    <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-1000">
      
      {/* Night Mode Toggle */}
      <button 
        onClick={() => setIsNightMode(!isNightMode)}
        className={`absolute top-6 right-6 z-50 p-3 rounded-full backdrop-blur-md transition-all duration-700 shadow-sm ${
          isNightMode ? 'bg-white/10 text-yellow-100 hover:bg-white/20' : 'bg-white/50 text-indigo-900 hover:bg-white/80'
        }`}
      >
        {isNightMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Night Sky Background */}
      <AnimatePresence>
        {isNightMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="fixed inset-0 z-[-10] bg-[#0B0C10] overflow-hidden"
          >
            {/* Deep space radial glow (Milky Way base) */}
            <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full mix-blend-screen opacity-40 blur-[120px]" style={{ background: 'radial-gradient(circle, #2d1b6e 0%, transparent 70%)' }} />
            <div className="absolute bottom-[-10%] right-[-10%] w-[80vw] h-[80vw] rounded-full mix-blend-screen opacity-30 blur-[100px]" style={{ background: 'radial-gradient(circle, #1f4068 0%, transparent 70%)' }} />

            {/* The Moon */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
              className="absolute top-[15%] right-[15%] w-32 h-32 md:w-48 md:h-48 rounded-full shadow-[0_0_80px_20px_rgba(253,244,255,0.2)]"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #fff, #fdf4ff 40%, #e0c8eb 80%, #b294c4)',
              }}
            >
              {/* Moon craters */}
              <div className="absolute top-[20%] left-[20%] w-[20%] h-[20%] rounded-full bg-black/10 blur-[2px]" />
              <div className="absolute bottom-[30%] right-[25%] w-[30%] h-[25%] rounded-full bg-black/10 blur-[3px]" />
              <div className="absolute top-[40%] right-[15%] w-[15%] h-[15%] rounded-full bg-black/10 blur-[1px]" />
            </motion.div>

            {/* Stars */}
            {stars.map((star) => (
              <motion.div
                key={star.id}
                className="absolute bg-white rounded-full"
                style={{
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  boxShadow: `0 0 ${star.size * 2}px rgba(255, 255, 255, 0.8)`
                }}
                animate={{
                  opacity: [0.2, 1, 0.2],
                  scale: [1, 1.2, 1],
                  x: [0, Math.random() * 20 - 10], // Slight drifting motion
                  y: [0, Math.random() * 20 - 10]
                }}
                transition={{
                  duration: Math.random() * 5 + 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: star.delay
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="max-w-3xl text-center space-y-10 z-10 transition-colors duration-1000"
      >
        <motion.div variants={itemVars} className="flex justify-center">
          <div className={`px-5 py-2 backdrop-blur-md rounded-full shadow-sm flex items-center gap-3 transition-colors duration-1000 ${
            isNightMode ? 'bg-white/10 border-white/20' : 'bg-white/40 border-rose-100'
          }`}>
            <Sparkles className={`w-4 h-4 ${isNightMode ? 'text-purple-300' : 'text-rose-400'}`} />
            <span className={`text-xs font-semibold tracking-[0.2em] uppercase transition-colors duration-1000 ${
              isNightMode ? 'text-purple-200' : 'text-rose-500'
            }`}>
              A little world, made for you
            </span>
          </div>
        </motion.div>

        <motion.h1 variants={itemVars} className={`font-serif text-6xl md:text-8xl font-bold tracking-tight leading-none transition-colors duration-1000 ${
          isNightMode ? 'text-gray-100' : 'text-gray-900'
        }`}>
          Happy birthday,<br />
          <span className={`font-dancing font-normal pr-4 transition-colors duration-1000 ${
            isNightMode ? 'text-purple-300' : 'text-rose-400'
          }`}>my everything.</span>
        </motion.h1>
        
        <motion.p variants={itemVars} className={`font-sans text-xl md:text-2xl leading-relaxed font-light max-w-2xl mx-auto transition-colors duration-1000 ${
          isNightMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          A tiny universe holding my letters to you, our memories, and all the quiet moments we share. Just for you.
        </motion.p>

        <motion.div variants={itemVars} className="pt-6">
          <Link 
            href="/gift"
            className={`inline-block px-10 py-5 text-white rounded-full font-medium transition-all shadow-sm hover:shadow-md hover:-translate-y-1 duration-700 ${
              isNightMode ? 'bg-purple-500/80 hover:bg-purple-500 backdrop-blur-md shadow-purple-500/20' : 'bg-rose-400 hover:bg-rose-500'
            }`}
          >
            Explore your birthday gift
          </Link>
        </motion.div>

        <motion.div 
          variants={itemVars}
          className={`pt-8 text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-colors duration-1000 ${
            isNightMode ? 'text-gray-500' : 'text-gray-400'
          }`}
        >
          <span className={`w-12 h-px transition-colors duration-1000 ${isNightMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
          Explore the chapters above
          <span className={`w-12 h-px transition-colors duration-1000 ${isNightMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        </motion.div>
      </motion.div>
    </main>
  )
}
