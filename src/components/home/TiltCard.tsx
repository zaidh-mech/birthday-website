'use client'

import type { PointerEvent, ReactNode } from 'react'
import Link from 'next/link'
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion'
import { useCanHover, usePrefersReducedMotion } from '@/lib/hooks'

interface TiltCardProps {
  href: string
  children: ReactNode
  className?: string
}

/**
 * A link card that tilts toward the mouse with a soft glare (desktop), and
 * presses in on touch.
 */
export default function TiltCard({ href, children, className = '' }: TiltCardProps) {
  const canHover = useCanHover()
  const reduce = usePrefersReducedMotion()
  const enabled = canHover && !reduce

  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const gx = useMotionValue(50)
  const gy = useMotionValue(50)
  const glare = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 180, damping: 18 })
  const sry = useSpring(ry, { stiffness: 180, damping: 18 })
  const sglare = useSpring(glare, { stiffness: 120, damping: 20 })
  const background = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.5), rgba(255,255,255,0) 55%)`

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!enabled || e.pointerType !== 'mouse') return
    const rect = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    ry.set((px - 0.5) * 14)
    rx.set((0.5 - py) * 12)
    gx.set(px * 100)
    gy.set(py * 100)
    glare.set(1)
  }
  const onLeave = () => {
    rx.set(0)
    ry.set(0)
    glare.set(0)
  }

  return (
    <motion.div
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={enabled ? { rotateX: srx, rotateY: sry, transformPerspective: 1000 } : undefined}
      whileTap={{ scale: 0.97 }}
      className={`h-full ${className}`}
    >
      <Link
        href={href}
        className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-rose-100 bg-white/60 p-3 shadow-xl shadow-rose-200/20 backdrop-blur-md transition-[box-shadow,border-color] duration-500 hover:border-rose-200 hover:shadow-2xl hover:shadow-rose-300/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300/60 sm:p-4 dark:border-white/10 dark:bg-white/5 dark:shadow-black/30 dark:hover:border-white/20 dark:hover:shadow-purple-900/30 dark:focus-visible:ring-purple-400/50"
      >
        {children}
        {enabled && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-3xl mix-blend-overlay"
            style={{ background, opacity: sglare }}
          />
        )}
      </Link>
    </motion.div>
  )
}
