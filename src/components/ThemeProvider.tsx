'use client'

import { useEffect } from 'react'
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes'
import { MotionConfig } from 'framer-motion'
import { usePathname } from 'next/navigation'

export const THEME_COLORS = { light: '#fdfbf7', dark: '#0b0c10' } as const

/**
 * React 19 warns when it creates a <script> on the client. next-themes'
 * anti-flash script only needs to run from the server HTML, so on the client
 * we give it a non-executable type (the element has suppressHydrationWarning).
 */
const scriptProps = typeof window === 'undefined' ? undefined : ({ type: 'application/json' } as const)

/** Keeps the browser UI colour (<meta name="theme-color">) in sync with the site theme. */
function ThemeColorSync() {
  const { resolvedTheme } = useTheme()
  const pathname = usePathname()

  useEffect(() => {
    if (!resolvedTheme) return
    const color = resolvedTheme === 'dark' ? THEME_COLORS.dark : THEME_COLORS.light
    let metas = Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'))
    if (metas.length === 0) {
      const meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
      metas = [meta]
    }
    metas.forEach((m) => m.setAttribute('content', color))
  }, [resolvedTheme, pathname])

  return null
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false} scriptProps={scriptProps}>
      {/* "user": framer-motion skips transform/layout animations when the OS asks for reduced motion. */}
      <MotionConfig reducedMotion="user">
        <ThemeColorSync />
        {children}
      </MotionConfig>
    </NextThemesProvider>
  )
}
