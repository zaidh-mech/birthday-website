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
      <div className="bg-white/70 backdrop-blur-md border border-white/20 shadow-sm rounded-[2rem] p-2 flex pointer-events-auto items-center relative">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="relative px-6 py-2.5 text-sm font-medium tracking-wide uppercase transition-colors"
          >
            <span className={clsx("relative z-10", pathname === link.href ? "text-gray-900" : "text-gray-500 hover:text-gray-900")}>
              {link.label}
            </span>
            {pathname === link.href && (
              <motion.div
                layoutId="nav-pill"
                className="absolute inset-0 bg-[#fdfbf7] rounded-[1.5rem] shadow-sm border border-gray-100"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </Link>
        ))}
      </div>
    </nav>
  )
}
