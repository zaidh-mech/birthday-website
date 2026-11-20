'use client'

import { useId, useRef } from 'react'
import { flushSync } from 'react-dom'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Volume2, VolumeX } from 'lucide-react'
import { normalizePath } from '@/lib/basePath'
import { useMounted } from '@/lib/hooks'
import { haptic, sfx, toggleSound, useSoundEnabled } from '@/lib/sound'
import { sparklesFromElement } from '@/components/effects/magic'
import { toast } from '@/components/effects/Toast'

const RAYS = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4
  return {
    x1: 12 + Math.cos(a) * 7.6,
    y1: 12 + Math.sin(a) * 7.6,
    x2: 12 + Math.cos(a) * 10.2,
    y2: 12 + Math.sin(a) * 10.2,
  }
})

/** A sun that melts into a crescent moon (and back). Shows the CURRENT theme. */
function SunMoon({ dark, reduce }: { dark: boolean; reduce: boolean }) {
  const maskId = `sun-moon-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const spring = reduce ? { duration: 0 } : ({ type: 'spring', stiffness: 210, damping: 19 } as const)

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 overflow-visible" aria-hidden="true">
      <mask id={maskId}>
        <rect x="-2" y="-2" width="28" height="28" fill="white" />
        <motion.circle
          r="8"
          fill="black"
          initial={false}
          animate={dark ? { cx: 17, cy: 7 } : { cx: 31, cy: -6 }}
          transition={spring}
        />
      </mask>
      <motion.circle
        cx="12"
        cy="12"
        fill="currentColor"
        mask={`url(#${maskId})`}
        initial={false}
        animate={{ r: dark ? 8.6 : 4.6 }}
        transition={spring}
      />
      <motion.g
        initial={false}
        animate={{ rotate: dark ? 90 : 0, scale: dark ? 0.4 : 1, opacity: dark ? 0 : 1 }}
        transition={reduce ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        {RAYS.map((r, i) => (
          <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} />
        ))}
      </motion.g>
      {/* two tiny stars keep the moon company */}
      <motion.path
        d="M20 2.6 L20.55 4.05 L22 4.6 L20.55 5.15 L20 6.6 L19.45 5.15 L18 4.6 L19.45 4.05 Z"
        fill="currentColor"
        initial={false}
        animate={{ opacity: dark ? 1 : 0, scale: dark ? 1 : 0 }}
        transition={reduce ? { duration: 0 } : { delay: dark ? 0.25 : 0, duration: 0.35 }}
      />
      <motion.circle
        cx="21.6"
        cy="10.2"
        r="0.9"
        fill="currentColor"
        initial={false}
        animate={{ opacity: dark ? 0.85 : 0, scale: dark ? 1 : 0 }}
        transition={reduce ? { duration: 0 } : { delay: dark ? 0.4 : 0, duration: 0.3 }}
      />
    </svg>
  )
}

const buttonClass =
  'relative grid h-10 w-10 place-items-center rounded-full transition-[color,background-color,scale] duration-300 hover:bg-white/80 active:scale-90 dark:hover:bg-white/10'

/**
 * Floating controls: theme (sun ↔ moon) + sound on/off.
 * Bottom-right on phones (thumb reach), top-right on md+.
 */
export default function ThemeToggle() {
  const path = normalizePath(usePathname())
  const mounted = useMounted()
  const { resolvedTheme, setTheme } = useTheme()
  const [soundOn] = useSoundEnabled()
  const reduce = useReducedMotion() ?? false
  const themeButton = useRef<HTMLButtonElement>(null)
  const switching = useRef(false)

  if (path === '/admin' || path.startsWith('/admin/')) return null

  const dark = mounted && resolvedTheme === 'dark'
  // On short landscape phones the cluster would sit on top of a game board or its keyboard;
  // games have their own sound button, so step aside there.
  const inGame = path.startsWith('/games/')

  const switchTheme = () => {
    if (switching.current) return
    const next = dark ? 'light' : 'dark'
    const root = document.documentElement
    const button = themeButton.current

    const apply = () => {
      flushSync(() => setTheme(next))
      // next-themes applies the class in an effect; make sure the new snapshot already has it
      root.classList.toggle('dark', next === 'dark')
      root.style.colorScheme = next
    }

    haptic(10)
    if (next === 'dark') sfx.sparkle()
    else sfx.chime()

    if (!button || reduce || typeof document.startViewTransition !== 'function') {
      setTheme(next)
      sparklesFromElement(button, 10)
      return
    }

    // Circular reveal of the new theme, growing out of the button.
    const rect = button.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))

    root.classList.add('theme-switching')
    switching.current = true
    try {
      const transition = document.startViewTransition(apply)
      transition.ready
        .then(() => {
          root.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
            { duration: 750, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' },
          )
        })
        .catch(() => {})
      transition.finished
        .catch(() => {})
        .finally(() => {
          switching.current = false
          root.classList.remove('theme-switching')
          sparklesFromElement(themeButton.current, 10)
        })
    } catch {
      switching.current = false
      root.classList.remove('theme-switching')
      setTheme(next)
    }
  }

  const switchSound = () => {
    const enabled = toggleSound()
    haptic(8)
    toast(enabled ? 'Sound effects on' : 'Shh… sound effects off', {
      id: 'sound-toggle',
      emoji: enabled ? '🎶' : '🤫',
      duration: 1800,
    })
  }

  return (
    <div
      role="group"
      aria-label="Theme and sound"
      className={`${inGame ? 'max-md:[@media(max-height:500px)]:hidden ' : ''}fixed bottom-[max(1rem,env(safe-area-inset-bottom,0px))] right-4 z-50 flex items-center gap-1 rounded-full border border-white/70 bg-white/70 p-1 shadow-[0_10px_30px_-12px_rgba(244,63,94,0.45)] backdrop-blur-xl transition-colors duration-700 md:bottom-auto md:right-4 md:top-6 md:flex-col lg:right-6 dark:border-white/10 dark:bg-[#11121a]/70 dark:shadow-[0_10px_30px_-12px_rgba(168,85,247,0.55)]`}
    >
      <button
        ref={themeButton}
        type="button"
        onClick={switchTheme}
        aria-label={dark ? 'Switch to daylight' : 'Switch to the night sky'}
        title={dark ? 'Daylight' : 'Night sky'}
        className={`${buttonClass} ${dark ? 'text-amber-100' : 'text-amber-500'}`}
      >
        {mounted ? <SunMoon dark={dark} reduce={reduce} /> : <span className="h-5 w-5" />}
      </button>

      <button
        type="button"
        onClick={switchSound}
        aria-pressed={soundOn}
        aria-label="Sound effects"
        title={soundOn ? 'Mute sounds' : 'Turn sounds on'}
        className={`${buttonClass} ${soundOn ? 'text-rose-500 dark:text-purple-200' : 'text-gray-400 dark:text-gray-500'}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={soundOn ? 'on' : 'off'}
            initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.6, rotate: 20 }}
            transition={{ duration: 0.18 }}
            className="grid place-items-center"
          >
            {soundOn ? <Volume2 aria-hidden="true" className="h-[18px] w-[18px]" /> : <VolumeX aria-hidden="true" className="h-[18px] w-[18px]" />}
          </motion.span>
        </AnimatePresence>
      </button>
    </div>
  )
}
