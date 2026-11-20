'use client'

import { useRef, type KeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import { Film, Images, Route } from 'lucide-react'

export type MemoriesView = 'lane' | 'album' | 'slideshow'

export const VIEWS: { id: MemoriesView; label: string; icon: typeof Route }[] = [
  { id: 'lane', label: 'Memory Lane', icon: Route },
  { id: 'album', label: 'Album', icon: Images },
  { id: 'slideshow', label: 'Slideshow', icon: Film },
]

export const tabId = (view: MemoriesView) => `memories-tab-${view}`
export const panelId = (view: MemoriesView) => `memories-panel-${view}`

/** Segmented control (an ARIA tablist) for the three ways of looking at our memories. */
export default function ViewSwitcher({ value, onChange }: { value: MemoriesView; onChange: (view: MemoriesView) => void }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const current = VIEWS.findIndex((v) => v.id === value)
    let next = -1
    if (e.key === 'ArrowRight') next = (current + 1) % VIEWS.length
    else if (e.key === 'ArrowLeft') next = (current - 1 + VIEWS.length) % VIEWS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = VIEWS.length - 1
    if (next < 0) return
    e.preventDefault()
    const view = VIEWS[next].id
    onChange(view)
    refs.current[view]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label="How to look at our memories"
      onKeyDown={onKeyDown}
      className="inline-flex max-w-full items-center rounded-full border border-rose-100 bg-white/70 p-1 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5"
    >
      {VIEWS.map(({ id, label, icon: Icon }) => {
        const active = id === value
        return (
          <button
            key={id}
            ref={(el) => {
              refs.current[id] = el
            }}
            id={tabId(id)}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={panelId(id)}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(id)}
            className={`relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 dark:focus-visible:ring-purple-400/60 min-[400px]:px-4 sm:px-5 sm:py-2.5 sm:text-sm ${
              active ? 'text-white' : 'text-gray-600 hover:text-rose-600 dark:text-gray-300 dark:hover:text-purple-200'
            }`}
          >
            {active && (
              <motion.span
                layoutId="memories-view-pill"
                className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 shadow-md shadow-rose-500/30 dark:from-purple-500 dark:to-fuchsia-500 dark:shadow-purple-900/40"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <Icon className="relative hidden h-4 w-4 min-[400px]:block" />
            <span className="relative">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
