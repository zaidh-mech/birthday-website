'use client'

import { useRef, type PointerEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useCanHover, usePrefersReducedMotion } from '@/lib/hooks'

interface MagneticLinkProps {
  href: string
  children: ReactNode
  className?: string
  wrapperClassName?: string
  /** 0–1: how far the button follows the cursor */
  strength?: number
}

/** A link that leans toward the mouse cursor (desktop only; plain link on touch). */
export default function MagneticLink({ href, children, className, wrapperClassName = 'inline-flex', strength = 0.28 }: MagneticLinkProps) {
  const ref = useRef<HTMLAnchorElement>(null)
  const canHover = useCanHover()
  const reduce = usePrefersReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 16, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 220, damping: 16, mass: 0.4 })

  const onMove = (e: PointerEvent<HTMLAnchorElement>) => {
    if (!canHover || reduce || e.pointerType !== 'mouse' || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * strength)
    y.set((e.clientY - (r.top + r.height / 2)) * strength)
  }
  const reset = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.span style={{ x: sx, y: sy }} className={wrapperClassName}>
      <Link ref={ref} href={href} onPointerMove={onMove} onPointerLeave={reset} className={className}>
        {children}
      </Link>
    </motion.span>
  )
}
