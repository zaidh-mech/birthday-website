'use client'

import type { ReactNode } from 'react'
import { MotionConfig } from 'framer-motion'

/**
 * Page frame for the home page. `reducedMotion="user"` makes every
 * framer-motion transform animation inside respect prefers-reduced-motion.
 */
export default function HomeShell({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <main className="relative flex w-full flex-1 flex-col overflow-x-clip pb-28 md:pb-16">{children}</main>
    </MotionConfig>
  )
}
