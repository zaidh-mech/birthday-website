'use client'

import { useRef, useState, type RefObject } from 'react'
import { motion, useTransform, type MotionValue } from 'framer-motion'
import type { ViewerPhoto } from './types'

export interface PolaroidSlot {
  /** Position classes (mobile first, then sm+) */
  className: string
  /** Resting tilt in degrees */
  rotate: number
  /** Parallax depth multiplier */
  depth: number
}

interface DraggablePolaroidProps {
  photo: ViewerPhoto
  slot: PolaroidSlot
  zIndex: number
  enterDelay: number
  constraintsRef: RefObject<HTMLElement | null>
  parallaxX: MotionValue<number>
  parallaxY: MotionValue<number>
  parallaxOn: boolean
  canHover: boolean
  eager: boolean
  dragging: boolean
  onOpen: () => void
  onPress: () => void
  onDragChange: (dragging: boolean) => void
  onHoverChange: (hovering: boolean) => void
}

/** Movement (px) below which a press counts as a tap rather than a drag. */
const TAP_SLOP = 6

/**
 * A polaroid you can pick up, throw around the hero, and tap to open.
 * The outer button handles drag; the inner frame carries the mouse parallax so
 * the two transforms never fight.
 */
export default function DraggablePolaroid({
  photo,
  slot,
  zIndex,
  enterDelay,
  constraintsRef,
  parallaxX,
  parallaxY,
  parallaxOn,
  canHover,
  eager,
  dragging,
  onOpen,
  onPress,
  onDragChange,
  onHoverChange,
}: DraggablePolaroidProps) {
  const start = useRef<{ x: number; y: number } | null>(null)
  const moved = useRef(false)
  // The entrance delay must not apply when settling back after hover/drag.
  const [entered, setEntered] = useState(false)
  const px = useTransform(parallaxX, (v) => v * -34 * slot.depth)
  const py = useTransform(parallaxY, (v) => v * -24 * slot.depth)

  return (
    <motion.button
      type="button"
      aria-label={photo.caption ? `Open photo: ${photo.caption}` : 'Open photo'}
      className={`pointer-events-auto absolute block w-[4.5rem] cursor-grab touch-none select-none rounded-[4px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300/70 active:cursor-grabbing sm:w-28 md:w-36 lg:w-40 xl:w-44 2xl:w-52 min-[2200px]:w-64 dark:focus-visible:ring-purple-400/60 ${slot.className}`}
      style={{ zIndex }}
      drag
      dragConstraints={constraintsRef}
      dragElastic={0.18}
      dragMomentum
      dragTransition={{ power: 0.28, timeConstant: 280, bounceStiffness: 240, bounceDamping: 18 }}
      initial={{ opacity: 0, scale: 0.6, rotate: slot.rotate * 2.2, y: 24 }}
      animate={{
        opacity: 1,
        scale: 1,
        rotate: slot.rotate,
        y: 0,
        transition: entered ? { type: 'spring', stiffness: 300, damping: 22 } : { type: 'spring', stiffness: 130, damping: 15, delay: enterDelay },
      }}
      onAnimationComplete={() => {
        if (!entered) setEntered(true)
      }}
      exit={{ opacity: 0, scale: 0.7, rotate: slot.rotate * 2.6, transition: { duration: 0.55, ease: 'easeIn' } }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      whileHover={canHover ? { scale: 1.08, rotate: 0 } : undefined}
      whileDrag={{ scale: 1.12, rotate: 0 }}
      onPointerDown={(e) => {
        start.current = { x: e.clientX, y: e.clientY }
        moved.current = false
        onPress()
      }}
      onDragStart={() => onDragChange(true)}
      onDrag={(_, info) => {
        if (Math.hypot(info.offset.x, info.offset.y) >= TAP_SLOP) moved.current = true
      }}
      onDragEnd={() => onDragChange(false)}
      onClick={(e) => {
        // Keyboard activation (Enter / Space) has no pointer position.
        if (e.detail === 0) {
          onOpen()
          return
        }
        if (moved.current) return
        const s = start.current
        if (s && Math.hypot(e.clientX - s.x, e.clientY - s.y) >= TAP_SLOP) return
        onOpen()
      }}
      onHoverStart={() => onHoverChange(true)}
      onHoverEnd={() => onHoverChange(false)}
    >
      <motion.span
        style={parallaxOn ? { x: px, y: py } : undefined}
        className={`block rounded-[3px] bg-white p-1 pb-3.5 ring-1 ring-black/5 transition-shadow duration-300 sm:p-2 sm:pb-1.5 ${
          dragging ? 'shadow-[0_28px_50px_-12px_rgba(0,0,0,0.45)]' : 'shadow-lg shadow-black/15'
        }`}
      >
        <span
          className="relative block aspect-[4/5] overflow-hidden rounded-[2px] bg-rose-50"
          style={photo.blur ? { backgroundImage: `url(${photo.blur})`, backgroundSize: 'cover', backgroundPosition: 'center 30%' } : undefined}
        >
          <img
            src={photo.thumb}
            alt=""
            draggable={false}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-[center_30%]"
          />
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/25" />
        </span>
        <span className="hidden pt-1.5 text-center font-cursive text-sm leading-tight text-gray-700 sm:line-clamp-1 md:text-base 2xl:text-lg">
          {photo.caption || '♥'}
        </span>
      </motion.span>
    </motion.button>
  )
}
