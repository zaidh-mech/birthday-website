'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useTheme } from 'next-themes'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    setMounted(true)
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

  // Prevent hydration mismatch
  if (!mounted) {
    return <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-1000" />
  }

  const isNightMode = theme === 'dark'

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-1000">
      
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
