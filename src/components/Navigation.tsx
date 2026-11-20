'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { clsx } from 'clsx'
import { Gamepad2, Gift, House, Images, Lock, Mail, MailOpen, type LucideIcon } from 'lucide-react'
import { normalizePath } from '@/lib/basePath'
import { sfx } from '@/lib/sound'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  /** Optional icon while the page is open (the envelope opens on Letters) */
  activeIcon?: LucideIcon
}

const LINKS: NavItem[] = [
  { href: '/', label: 'Home', icon: House },
  { href: '/letters', label: 'Letters', icon: Mail, activeIcon: MailOpen },
  { href: '/memories', label: 'Memories', icon: Images },
  { href: '/games', label: 'Games', icon: Gamepad2 },
  { href: '/gift', label: 'Gift', icon: Gift },
]

const PILL_SPRING = { type: 'spring', stiffness: 380, damping: 32 } as const
const HOVER_SPRING = { type: 'spring', stiffness: 520, damping: 40 } as const

function isActive(href: string, path: string): boolean {
  if (href === '/') return path === '/'
  return path === href || path.startsWith(`${href}/`)
}

/** Hide the bar while scrolling down, bring it back on any scroll up. */
function useHideOnScroll(resetKey: string): [boolean, (v: boolean) => void] {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    setHidden(false)
  }, [resetKey])

  useEffect(() => {
    let lastY = Math.max(0, window.scrollY)
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const y = Math.max(0, window.scrollY)
        const dy = y - lastY
        if (y < 96) {
          setHidden(false)
          lastY = y
        } else if (dy > 10) {
          setHidden(true)
          lastY = y
        } else if (dy < -10) {
          setHidden(false)
          lastY = y
        }
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  return [hidden, setHidden]
}

/**
 * The floating glass navigation pill.
 *  - sm+: icon + label for every page
 *  - phones: icons only, the current page expands to show its label
 *  - a spring-animated pill slides to the current page (and a softer one follows the mouse)
 *  - tucks itself away while scrolling down, comes back on scroll up / focus
 */
export default function Navigation() {
  const path = normalizePath(usePathname())
  const [hidden, setHidden] = useHideOnScroll(path)
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    setHovered(null)
  }, [path])

  if (path === '/admin' || path.startsWith('/admin/')) return null

  return (
    <motion.nav
      layoutRoot
      aria-label="Main"
      onFocus={() => setHidden(false)}
      className={clsx(
        'pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-[max(1rem,env(safe-area-inset-top,0px))] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:pt-6',
        hidden && '-translate-y-[140%]',
      )}
    >
      <motion.div
        layout
        style={{ borderRadius: 9999 }}
        className="pointer-events-auto flex max-w-full items-center border border-white/70 bg-white/70 p-1 shadow-[0_10px_34px_-14px_rgba(244,63,94,0.45)] backdrop-blur-xl transition-colors duration-700 sm:p-1.5 dark:border-white/10 dark:bg-[#11121a]/70 dark:shadow-[0_10px_34px_-14px_rgba(168,85,247,0.55)]"
      >
        <ul className="flex items-center" onPointerLeave={() => setHovered(null)}>
          {LINKS.map((link) => {
            const active = isActive(link.href, path)
            const Icon = active && link.activeIcon ? link.activeIcon : link.icon
            return (
              <motion.li key={link.href} layout="position" className="relative">
                <Link
                  href={link.href}
                  aria-label={link.label}
                  aria-current={active ? 'page' : undefined}
                  onPointerEnter={(e) => {
                    if (e.pointerType === 'mouse') setHovered(link.href)
                  }}
                  onClick={() => {
                    if (!active) sfx.tick()
                  }}
                  className={clsx(
                    'group relative flex h-10 items-center gap-1.5 rounded-full px-2 text-xs font-semibold outline-offset-2 transition-colors duration-300 min-[360px]:px-2.5 sm:px-3.5 lg:px-4',
                    active
                      ? 'text-rose-600 dark:text-purple-100'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
                  )}
                >
                  <AnimatePresence>
                    {hovered === link.href && !active && (
                      <motion.span
                        layoutId="nav-hover"
                        aria-hidden="true"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={HOVER_SPRING}
                        style={{ borderRadius: 9999 }}
                        className="absolute inset-0 bg-rose-100/60 dark:bg-white/[0.07]"
                      />
                    )}
                  </AnimatePresence>
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      aria-hidden="true"
                      transition={PILL_SPRING}
                      style={{ borderRadius: 9999 }}
                      className="absolute inset-0 border border-rose-200/80 bg-linear-to-b from-white to-rose-50 shadow-[0_4px_14px_-4px_rgba(244,63,94,0.45)] dark:border-purple-300/25 dark:from-purple-400/30 dark:to-purple-500/10 dark:shadow-[0_4px_18px_-4px_rgba(168,85,247,0.6)]"
                    />
                  )}
                  <Icon
                    aria-hidden="true"
                    className={clsx(
                      'relative h-4 w-4 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-0.5 group-hover:scale-110 group-active:scale-90',
                      active && 'scale-110',
                    )}
                  />
                  <span
                    className={clsx(
                      'relative whitespace-nowrap sm:uppercase sm:tracking-[0.14em]',
                      active ? 'max-sm:animate-slide-in-left' : 'max-sm:hidden',
                    )}
                  >
                    {link.label}
                  </span>
                </Link>
              </motion.li>
            )
          })}
        </ul>

        <span aria-hidden="true" className="mx-0.5 h-5 w-px shrink-0 bg-rose-200/70 sm:mx-1 dark:bg-white/10" />

        <motion.div layout="position">
          <Link
            href="/admin"
            title="Admin Studio"
            aria-label="Admin Studio"
            className="flex h-10 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-rose-500 sm:w-9 dark:text-gray-500 dark:hover:text-purple-300"
          >
            <Lock aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
      </motion.div>
    </motion.nav>
  )
}
