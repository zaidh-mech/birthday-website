'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

const links = [
  { href: '/', label: 'Home' },
  { href: '/letters', label: 'Letters' },
  { href: '/memories', label: 'Memories' },
]

export default function Navigation() {
  const pathname = usePathname()

  if (pathname.startsWith('/admin')) return null // No nav in admin area

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center py-6 px-4 pointer-events-none">
      <div className="bg-white/70 dark:bg-[#0b0c10]/70 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-sm rounded-[2rem] p-2 flex pointer-events-auto items-center relative transition-colors duration-1000">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="relative px-3 sm:px-6 py-2.5 text-xs sm:text-sm font-medium tracking-wide uppercase transition-colors"
          >
            <span className={clsx("relative z-10 transition-colors duration-1000", pathname === link.href ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200")}>
              {link.label}
            </span>
            {pathname === link.href && (
              <motion.div
                layoutId="nav-pill"
                className="absolute inset-0 bg-[#fdfbf7] dark:bg-white/10 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-white/10"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </Link>
        ))}
      </div>
    </nav>
  )
}
