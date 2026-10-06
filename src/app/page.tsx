'use client'

import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-100 rounded-full blur-[100px] opacity-50 mix-blend-multiply" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-100 rounded-full blur-[100px] opacity-50 mix-blend-multiply" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="max-w-2xl text-center space-y-8 z-10"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
          className="flex justify-center"
        >
          <div className="px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full shadow-sm border border-rose-100 flex items-center gap-2">
            <span className="text-rose-400">✦</span>
            <span className="text-sm font-medium text-gray-700 tracking-wide uppercase">A little world, made for you</span>
          </div>
        </motion.div>

        <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tight text-gray-900 leading-tight">
          Happy birthday,<br />
          <span className="text-rose-400 italic">my everything.</span>
        </h1>
        
        <p className="font-sans text-lg md:text-xl text-gray-600 leading-relaxed font-light">
          A little birthday universe holding my letters to you, our memories, and all the little moments we share. Just for you.
        </p>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="pt-8 text-sm text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <span>✦</span> Explore the chapters above <span>✦</span>
        </motion.div>
      </motion.div>
    </main>
  )
}
