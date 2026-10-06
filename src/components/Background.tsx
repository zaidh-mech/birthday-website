'use client'

import { useEffect } from 'react'
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion'

export default function Background() {
  const mouseX = useMotionValue(-1000)
  const mouseY = useMotionValue(-1000)

  // Parallax background springs (smooth and loose)
  const parallaxX = useSpring(mouseX, { damping: 50, stiffness: 200 })
  const parallaxY = useSpring(mouseY, { damping: 50, stiffness: 200 })
  
  const inverseX = useTransform(parallaxX, (v) => v * -0.05)
  const inverseY = useTransform(parallaxY, (v) => v * -0.05)

  // Glow light springs (fast trailing effect)
  const glowX = useSpring(mouseX, { damping: 40, stiffness: 300 })
  const glowY = useSpring(mouseY, { damping: 40, stiffness: 300 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-50 bg-[#fdfbf7]">
      {/* Decorative interactive glowing orbs (parallax background) */}
      <motion.div
        style={{ x: inverseX, y: inverseY }}
        className="absolute top-[20%] left-[20%] w-[50vw] h-[50vw] bg-rose-100/40 rounded-full blur-[100px] mix-blend-multiply hidden md:block"
      />
      <motion.div
        style={{ x: useTransform(inverseX, v => -v), y: useTransform(inverseY, v => -v) }}
        className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] bg-amber-100/40 rounded-full blur-[100px] mix-blend-multiply hidden md:block"
      />
      
      {/* The trailing color effect light (follows the exact cursor) */}
      <motion.div
        style={{ x: glowX, y: glowY, translateX: '-50%', translateY: '-50%' }}
        className="absolute top-0 left-0 w-[400px] h-[400px] bg-rose-200/30 rounded-full blur-[100px] mix-blend-multiply hidden md:block"
      />

      {/* Static noise/texture overlay for a premium feel */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
    </div>
  )
}
