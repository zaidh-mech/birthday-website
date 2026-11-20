'use client'

import { usePathname } from 'next/navigation'
import { normalizePath } from '@/lib/basePath'
import MagicLayer from './MagicLayer'
import EasterEggs from './EasterEggs'

/** Site-wide delight (cursor trail, tap hearts, easter eggs). Off in Admin Studio. */
export default function SiteEffects() {
  const path = normalizePath(usePathname())
  if (path === '/admin' || path.startsWith('/admin/')) return null
  const inGame = path.startsWith('/games/')

  return (
    <>
      <MagicLayer inGame={inGame} />
      <EasterEggs inGame={inGame} />
    </>
  )
}
