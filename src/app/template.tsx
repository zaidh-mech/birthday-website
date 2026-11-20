'use client'

import { motion, useReducedMotion } from 'framer-motion'

/**
 * Re-mounts on every top-level navigation, so each page gently fades and
 * rises in. With reduced motion only the fade remains: the root
 * <MotionConfig reducedMotion="user"> (ThemeProvider) makes the rise instant,
 * and the fade is shortened here. There is no exit animation: templates
 * unmount immediately, so an `exit` prop would never run.
 *
 * Only opacity/transform are animated, and framer-motion resets the
 * transform to `none` once it settles, so `position: fixed` modals inside
 * pages keep the viewport as their containing block.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0.25, ease: 'easeOut' } : { duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      className="flex w-full flex-1 flex-col"
    >
      {children}
    </motion.div>
  )
}
