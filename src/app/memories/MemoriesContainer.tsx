'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  fetchLetters,
  fetchMemories,
  fetchSafeUnlockedOverride,
  isSessionAuthorized,
  setSessionAuthorized,
} from '@/lib/storage'
import type { Memory } from '@/data/initialData'
import MemoriesSkeleton from './MemoriesSkeleton'
import VaultGate from './VaultGate'
import MemoriesExperience from './MemoriesExperience'
import { DEFAULT_LETTER_TEXT, LOCK_LETTER_TITLE, parseLockLetter, type LetterPart } from './lockLetter'

/** Remembers that she already opened the safe on this device. */
const UNLOCK_KEY = 'birthday_memories_unlocked'

type Phase = 'loading' | 'locked' | 'open'

function readRemembered(): boolean {
  try {
    if (window.localStorage.getItem(UNLOCK_KEY) === 'true') return true
  } catch {
    /* storage blocked */
  }
  return isSessionAuthorized('viewer')
}

function rememberUnlock(value: boolean) {
  try {
    if (value) window.localStorage.setItem(UNLOCK_KEY, 'true')
    else window.localStorage.removeItem(UNLOCK_KEY)
  } catch {
    /* storage blocked */
  }
  setSessionAuthorized('viewer', value)
}

/** The built-in placeholder memories (stock photos) aren't ours — hide them from the album. */
function isPlaceholder(memory: Memory): boolean {
  return /^memory-\d+$/.test(memory.id) && memory.imagePath.includes('images.unsplash.com')
}

async function loadLetterParts(): Promise<LetterPart[]> {
  try {
    const letters = await fetchLetters()
    const lockLetter = letters.find((l) => l.title === LOCK_LETTER_TITLE)
    return parseLockLetter(lockLetter?.content || DEFAULT_LETTER_TEXT)
  } catch {
    return parseLockLetter(DEFAULT_LETTER_TEXT)
  }
}

export default function MemoriesContainer() {
  const reduceMotion = useReducedMotion() ?? false
  const [phase, setPhase] = useState<Phase>('loading')
  const [parts, setParts] = useState<LetterPart[] | null>(null)
  const [globallyUnlocked, setGloballyUnlocked] = useState(false)
  const [cinematic, setCinematic] = useState(false)
  const [flash, setFlash] = useState(false)
  const [album, setAlbum] = useState<Memory[] | null>(null)
  const [albumFailed, setAlbumFailed] = useState(false)
  const albumRequested = useRef(false)

  // Decide between the vault and the memories.
  useEffect(() => {
    let cancelled = false
    const remembered = readRemembered()
    if (remembered) setPhase('open')

    ;(async () => {
      let override = false
      try {
        override = await fetchSafeUnlockedOverride()
      } catch {
        override = false
      }
      if (cancelled) return
      setGloballyUnlocked(override)
      if (override || remembered) {
        setPhase('open')
        return
      }
      const letterParts = await loadLetterParts()
      if (cancelled) return
      setParts(letterParts)
      setPhase('locked')
    })()

    return () => {
      cancelled = true
    }
  }, [])

  // Album uploads load once the vault is open.
  useEffect(() => {
    if (phase !== 'open' || albumRequested.current) return
    albumRequested.current = true
    fetchMemories()
      .then((data) => {
        setAlbum(data.filter((m) => m.title !== '[GIFT_PHOTO]' && !isPlaceholder(m)))
      })
      .catch(() => {
        setAlbum([])
        setAlbumFailed(true)
      })
  }, [phase])

  const handleUnlocked = useCallback(() => {
    rememberUnlock(true)
    setCinematic(true)
    setFlash(true)
    setPhase('open')
    window.scrollTo({ top: 0 })
  }, [])

  const handleLock = useCallback(async () => {
    rememberUnlock(false)
    setCinematic(false)
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
    if (!parts) setParts(await loadLetterParts())
    setPhase('locked')
  }, [parts, reduceMotion])

  return (
    <div className="relative flex w-full flex-1 flex-col overflow-x-clip">
      <AnimatePresence mode="wait">
        {phase === 'loading' && (
          <motion.div key="loading" className="flex flex-1 flex-col" exit={{ opacity: 0, transition: { duration: 0.2 } }}>
            <MemoriesSkeleton />
          </motion.div>
        )}

        {phase === 'locked' && parts && (
          <motion.div
            key="vault"
            className="flex flex-1 flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={
              reduceMotion
                ? { opacity: 0, transition: { duration: 0.3 } }
                : { opacity: 0, scale: 1.08, filter: 'blur(14px)', transition: { duration: 0.7, ease: [0.65, 0, 0.35, 1] } }
            }
          >
            <VaultGate parts={parts} onUnlocked={handleUnlocked} />
          </motion.div>
        )}

        {phase === 'open' && (
          <motion.div
            key="memories"
            className="flex flex-1 flex-col"
            initial={cinematic && !reduceMotion ? { opacity: 0, scale: 0.97 } : { opacity: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: cinematic ? 0.9 : 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <MemoriesExperience album={album} albumFailed={albumFailed} canLock={!globallyUnlocked} onLock={handleLock} cinematic={cinematic} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* a soft flash of light as the vault opens */}
      <AnimatePresence>
        {flash && phase === 'open' && !reduceMotion && (
          <motion.div
            key="flash"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.9, 0] }}
            transition={{ duration: 1.8, times: [0, 0.25, 1], ease: 'easeOut' }}
            onAnimationComplete={() => setFlash(false)}
            className="pointer-events-none fixed inset-0 z-[55]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.95),rgba(251,113,133,0.45)_40%,transparent_75%)] dark:hidden" />
            <div className="absolute inset-0 hidden bg-[radial-gradient(circle_at_50%_40%,rgba(237,233,254,0.85),rgba(168,85,247,0.45)_40%,transparent_75%)] dark:block" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
