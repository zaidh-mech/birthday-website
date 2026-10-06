'use client'

import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function Background() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [stars, setStars] = useState<{ id: number; x: number; y: number; size: number; delay: number }[]>([])

  useEffect(() => {
    setMounted(true)
    const generatedStars = Array.from({ length: 100 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      delay: Math.random() * 4
    }))
    setStars(generatedStars)
  }, [])

  if (!mounted) return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-50 bg-[#fdfbf7]" />
  )

  const isNightMode = theme === 'dark'

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-50 transition-colors duration-1000 bg-[#fdfbf7] dark:bg-[#0B0C10]">
      {/* Light Mode Elements */}
      <AnimatePresence>
        {!isNightMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
          >
            <div
              className="absolute top-[10%] left-[10%] w-[60vw] h-[60vw] rounded-full hidden md:block"
              style={{ background: 'radial-gradient(circle, rgba(255, 228, 230, 0.6) 0%, transparent 70%)' }}
            />
            <div
              className="absolute bottom-[0%] right-[0%] w-[50vw] h-[50vw] rounded-full hidden md:block"
              style={{ background: 'radial-gradient(circle, rgba(254, 243, 199, 0.6) 0%, transparent 70%)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Night Sky Background */}
      <AnimatePresence>
        {isNightMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            {/* Deep space radial glow (Milky Way base) */}
            <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full mix-blend-screen opacity-40 blur-[120px]" style={{ background: 'radial-gradient(circle, #2d1b6e 0%, transparent 70%)' }} />
            <div className="absolute bottom-[-10%] right-[-10%] w-[80vw] h-[80vw] rounded-full mix-blend-screen opacity-30 blur-[100px]" style={{ background: 'radial-gradient(circle, #1f4068 0%, transparent 70%)' }} />
            
            {/* Additional Milky Way streak */}
            <div className="absolute top-[20%] left-[20%] w-[120vw] h-[30vw] rounded-full mix-blend-screen opacity-20 blur-[100px] -rotate-45" style={{ background: 'radial-gradient(ellipse, #4c1d95 0%, transparent 60%)' }} />

            {/* Realistic Moon */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 0.9 }}
              transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
              className="absolute top-[12%] right-[12%] w-40 h-40 md:w-64 md:h-64 rounded-full overflow-hidden mix-blend-screen"
            >
              {/* We use a real photo of the moon on a black background, and mix-blend-screen makes the black completely invisible, leaving only a stunning, photorealistic moon! */}
              <div 
                className="w-full h-full bg-contain bg-center bg-no-repeat shadow-[0_0_100px_30px_rgba(255,255,255,0.15)] rounded-full"
                style={{ 
                  backgroundImage: 'url("https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/FullMoon2010.jpg/1024px-FullMoon2010.jpg")',
                }}
              />
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
                  x: [0, Math.random() * 20 - 10], 
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
    </div>
  )
}
