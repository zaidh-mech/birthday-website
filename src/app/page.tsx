'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export default function Home() {
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      }
    }
  }

  const itemVars = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } }
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <motion.div 
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="max-w-3xl text-center space-y-10 z-10"
      >
        <motion.div variants={itemVars} className="flex justify-center">
          <div className="px-5 py-2 bg-white/40 backdrop-blur-md rounded-full shadow-sm border border-rose-100 flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-semibold text-rose-500 tracking-[0.2em] uppercase">A little world, made for you</span>
          </div>
        </motion.div>

        <motion.h1 variants={itemVars} className="font-serif text-6xl md:text-8xl font-bold tracking-tight text-gray-900 leading-none">
          Happy birthday,<br />
          <span className="font-dancing text-rose-400 font-normal pr-4">my everything.</span>
        </motion.h1>
        
        <motion.p variants={itemVars} className="font-sans text-xl md:text-2xl text-gray-600 leading-relaxed font-light max-w-2xl mx-auto">
          A tiny universe holding my letters to you, our memories, and all the quiet moments we share. Just for you.
        </motion.p>

        <motion.div variants={itemVars} className="pt-6">
          <a 
            href="/gift"
            className="inline-block px-10 py-5 bg-rose-400 text-white rounded-full font-medium hover:bg-rose-500 transition-all shadow-sm hover:shadow-md hover:-translate-y-1"
          >
            Explore your birthday gift
          </a>
        </motion.div>

        <motion.div 
          variants={itemVars}
          className="pt-8 text-xs text-gray-400 uppercase tracking-[0.3em] flex items-center justify-center gap-4"
        >
          <span className="w-12 h-px bg-gray-200" />
          Explore the chapters above
          <span className="w-12 h-px bg-gray-200" />
        </motion.div>
      </motion.div>
    </main>
  )
}
