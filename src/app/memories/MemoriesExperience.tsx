'use client'

import { useCallback, useMemo, useState } from 'react'
import { motion, AnimatePresence, useMotionValueEvent, useReducedMotion, useScroll } from 'framer-motion'
import { ArrowUp, Lock } from 'lucide-react'
import { getAllMedia, pickRandom, seededRandom, todaySeed } from '@/lib/photos'
import { useSiteConfig } from '@/lib/siteConfig'
import { sfx } from '@/lib/sound'
import type { Memory } from '@/data/initialData'
import MemoriesHero from './MemoriesHero'
import ViewSwitcher, { panelId, tabId, VIEWS, type MemoriesView } from './ViewSwitcher'
import MemoryLane from './MemoryLane'
import MemoriesGallery from './MemoriesGallery'
import Slideshow from './Slideshow'
import Lightbox from './Lightbox'
import { fromLocalMedia, type ViewerItem } from './viewerItems'

const VIEW_KEY = 'birthday_memories_view'

const LANE_ITEMS: ViewerItem[] = getAllMedia().map(fromLocalMedia)
const SLIDES: ViewerItem[] = LANE_ITEMS.filter((i) => i.kind === 'image')

function readSavedView(): MemoriesView {
  try {
    const saved = window.localStorage.getItem(VIEW_KEY)
    if (saved && VIEWS.some((v) => v.id === saved)) return saved as MemoriesView
  } catch {
    /* ignore */
  }
  return 'lane'
}

interface MemoriesExperienceProps {
  /** Album uploads from the cloud; null while loading */
  album: Memory[] | null
  albumFailed: boolean
  /** Show "Lock the safe again" (hidden when the admin unlocked it for everyone) */
  canLock: boolean
  onLock: () => void
  /** true right after she solved the letter — plays the big reveal */
  cinematic: boolean
}

/** Everything behind the vault door: hero, view switcher, the three views and the shared lightbox. */
export default function MemoriesExperience({ album, albumFailed, canLock, onLock, cinematic }: MemoriesExperienceProps) {
  const reduceMotion = useReducedMotion() ?? false
  const { config } = useSiteConfig()
  // This component only mounts on the client (after the gate check), so reading storage here is safe.
  const [view, setView] = useState<MemoriesView>(readSavedView)
  const [lightbox, setLightbox] = useState<{ items: ViewerItem[]; index: number } | null>(null)
  const [showTop, setShowTop] = useState(false)
  const picks = useMemo(() => pickRandom(SLIDES, 5, seededRandom(todaySeed())), [])

  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, 'change', (y) => {
    const next = y > 1100
    if (next !== showTop) setShowTop(next)
  })

  const changeView = useCallback(
    (next: MemoriesView) => {
      if (next === view) return
      sfx.flip()
      setView(next)
      try {
        window.localStorage.setItem(VIEW_KEY, next)
      } catch {
        /* ignore */
      }
    },
    [view],
  )

  const openLightbox = useCallback((items: ViewerItem[], index: number) => {
    setLightbox({ items, index })
  }, [])
  const closeLightbox = useCallback(() => setLightbox(null), [])
  const setLightboxIndex = useCallback((index: number) => {
    setLightbox((lb) => (lb ? { ...lb, index } : lb))
  }, [])

  return (
    <div className="w-full px-4 pb-28 pt-24 sm:px-6 sm:pt-28 md:pb-16 lg:px-8">
      <MemoriesHero
        items={LANE_ITEMS}
        picks={picks}
        cinematic={cinematic && !reduceMotion}
        onOpenPick={(i) => {
          sfx.flip()
          openLightbox(picks, i)
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: cinematic && !reduceMotion ? 0.9 : 0.2, duration: 0.6 }}
        className="mt-10 flex justify-center sm:mt-12"
      >
        <ViewSwitcher value={view} onChange={changeView} />
      </motion.div>

      <div className="mx-auto mt-8 max-w-7xl sm:mt-10">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            role="tabpanel"
            id={panelId(view)}
            aria-labelledby={tabId(view)}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {view === 'lane' && <MemoryLane items={LANE_ITEMS} onOpen={openLightbox} />}
            {view === 'album' && (
              <MemoriesGallery
                memories={album}
                failed={albumFailed}
                onOpen={openLightbox}
                onGoToLane={() => changeView('lane')}
                laneCount={LANE_ITEMS.length}
              />
            )}
            {view === 'slideshow' && (
              <div className="mx-auto max-w-6xl">
                <Slideshow items={SLIDES} suspended={lightbox !== null} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="mx-auto mt-16 flex max-w-xl flex-col items-center gap-4 text-center sm:mt-24">
        <div className="h-px w-24 bg-gradient-to-r from-transparent via-rose-300 to-transparent dark:via-purple-400/50" />
        <p className="font-cursive text-2xl text-rose-500 dark:text-purple-200 sm:text-3xl">Made with all my love, just for you.</p>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400 dark:text-gray-500">{config.fromName}</p>
        {canLock && (
          <button
            type="button"
            onClick={onLock}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-gray-400 underline-offset-4 transition hover:text-rose-500 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 dark:text-gray-500 dark:hover:text-purple-200"
          >
            <Lock className="h-3 w-3" /> Lock the safe again
          </button>
        )}
      </footer>

      <AnimatePresence>
        {showTop && !lightbox && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            onClick={() => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })}
            aria-label="Back to the top"
            className="fixed bottom-4 left-4 z-40 rounded-full border border-rose-100 bg-white/80 p-3 text-rose-500 shadow-lg shadow-rose-200/40 backdrop-blur-md transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 dark:border-white/10 dark:bg-[#15161f]/80 dark:text-purple-200 dark:shadow-none md:bottom-6 md:left-auto md:right-6"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lightbox && (
          <Lightbox key="memories-lightbox" items={lightbox.items} index={lightbox.index} onIndexChange={setLightboxIndex} onClose={closeLightbox} />
        )}
      </AnimatePresence>
    </div>
  )
}
