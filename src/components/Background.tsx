'use client'

import { useEffect } from 'react'
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion'

export default function Background() {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springX = useSpring(mouseX, { damping: 50, stiffness: 200 })
  const springY = useSpring(mouseY, { damping: 50, stiffness: 200 })

  const inverseX = useTransform(springX, (v) => v * -0.5)
  const inverseY = useTransform(springY, (v) => v * -0.5)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate normalized mouse position from center (-1 to 1)
      const x = (e.clientX / window.innerWidth - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      mouseX.set(x * 100)
      mouseY.set(y * 100)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-50 bg-[#fdfbf7]">
      {/* Decorative interactive glowing orbs */}
      <motion.div
        style={{ x: springX, y: springY }}
        className="absolute top-[20%] left-[20%] w-[50vw] h-[50vw] bg-rose-100/40 rounded-full blur-[100px] mix-blend-multiply"
      />
      <motion.div
        style={{ x: inverseX, y: inverseY }}
        className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] bg-amber-100/40 rounded-full blur-[100px] mix-blend-multiply"
      />
      
      {/* Static noise/texture overlay for a premium feel */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
    </div>
  )
}
