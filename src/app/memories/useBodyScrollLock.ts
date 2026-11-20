'use client'

import { useEffect } from 'react'

let locks = 0
let saved: { overflow: string; paddingRight: string } | null = null

/**
 * Locks page scrolling while `active` (nesting-safe). No scrollbar padding is
 * added: html has `scrollbar-gutter: stable`, so the gutter stays reserved and
 * nothing jumps.
 */
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return
    const body = document.body
    if (locks === 0) {
      saved = { overflow: body.style.overflow, paddingRight: body.style.paddingRight }
      body.style.overflow = 'hidden'
    }
    locks += 1
    return () => {
      locks = Math.max(0, locks - 1)
      if (locks === 0 && saved) {
        body.style.overflow = saved.overflow
        body.style.paddingRight = saved.paddingRight
        saved = null
      }
    }
  }, [active])
}
