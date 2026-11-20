'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Feather, MailOpen, Shuffle } from 'lucide-react'
import type { Letter } from '@/data/initialData'
import { fetchLetters } from '@/lib/storage'
import { useSiteConfig } from '@/lib/siteConfig'
import { haptic, sfx } from '@/lib/sound'
import { useCanHover, useMounted, usePrefersReducedMotion } from '@/lib/hooks'
import Envelope, { type EnvelopePhase } from './Envelope'
import LetterReader, { type OriginRect } from './LetterReader'
import {
  envelopeTilt,
  envelopeTone,
  formatLetterDate,
  isSystemLetter,
  loadReadIds,
  normalizeLetter,
  saveReadIds,
} from './letterUtils'

/** How long the envelope's own opening animation plays before the letter takes over the screen. */
const ENVELOPE_OPEN_MS = 560
const ENVELOPE_CLOSE_MS = 950

interface ReaderState {
  index: number
  origin: OriginRect | null
}

function rectOf(el: Element | null | undefined): OriginRect | null {
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { left: r.left, top: r.top, width: r.width, height: r.height }
}

function isOnScreen(el: Element | null | undefined): boolean {
  if (!el) return false
  const r = el.getBoundingClientRect()
  return r.bottom > 80 && r.top < window.innerHeight - 40
}

export default function LettersClient() {
  const [rawLetters, setRawLetters] = useState<Letter[] | null>(null)
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set())
  const [openId, setOpenId] = useState<string | null>(null)
  const [closingId, setClosingId] = useState<string | null>(null)
  const [reader, setReader] = useState<ReaderState | null>(null)

  const { config } = useSiteConfig()
  const mounted = useMounted()
  const reduce = usePrefersReducedMotion()
  const canHover = useCanHover()

  const envelopeEls = useRef(new Map<string, HTMLButtonElement>())
  const openerRef = useRef<HTMLButtonElement | null>(null)
  const pendingCloseId = useRef<string | null>(null)
  const openTimer = useRef<number | null>(null)
  const closeTimer = useRef<number | null>(null)

  useEffect(() => {
    setReadIds(new Set(loadReadIds()))
    let alive = true
    fetchLetters()
      .then((data) => {
        if (alive) setRawLetters(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (alive) setRawLetters([])
      })
    return () => {
      alive = false
      if (openTimer.current) window.clearTimeout(openTimer.current)
      if (closeTimer.current) window.clearTimeout(closeTimer.current)
    }
  }, [])

  const letters = useMemo(
    () => (rawLetters ?? []).map(normalizeLetter).filter((l) => l.id && !isSystemLetter(l)),
    [rawLetters],
  )
  const unreadCount = letters.filter((l) => !readIds.has(l.id)).length

  const registerRef = useCallback((id: string, el: HTMLButtonElement | null) => {
    if (el) envelopeEls.current.set(id, el)
    else envelopeEls.current.delete(id)
  }, [])

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      saveReadIds(next)
      return next
    })
  }, [])

  const openLetter = useCallback(
    (index: number, options: { skipEnvelope?: boolean } = {}) => {
      const letter = letters[index]
      if (!letter || reader || openId) return
      const el = envelopeEls.current.get(letter.id) ?? null
      openerRef.current = el
      if (closeTimer.current) window.clearTimeout(closeTimer.current)
      setClosingId(null)
      sfx.whoosh()
      haptic(8)
      markRead(letter.id)
      setOpenId(letter.id)

      const delay = reduce || options.skipEnvelope ? 0 : ENVELOPE_OPEN_MS
      if (openTimer.current) window.clearTimeout(openTimer.current)
      openTimer.current = window.setTimeout(() => {
        openTimer.current = null
        setReader({ index, origin: rectOf(envelopeEls.current.get(letter.id)) })
      }, delay)
    },
    [letters, reader, openId, reduce, markRead],
  )

  const navigate = useCallback(
    (index: number) => {
      const letter = letters[index]
      if (!letter) return
      sfx.flip()
      markRead(letter.id)
      const el = envelopeEls.current.get(letter.id) ?? null
      openerRef.current = el
      setOpenId(letter.id)
      setReader({ index, origin: rectOf(el) })
    },
    [letters, markRead],
  )

  const closeReader = useCallback(() => {
    pendingCloseId.current = openId
    setReader(null)
  }, [openId])

  const handleExitComplete = useCallback(() => {
    const id = pendingCloseId.current
    pendingCloseId.current = null
    setOpenId(null)
    setClosingId(id)
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setClosingId(null), ENVELOPE_CLOSE_MS)
    openerRef.current?.focus({ preventScroll: true })
  }, [])

  const surpriseMe = () => {
    if (letters.length === 0) return
    const unread = letters.map((l, i) => ({ l, i })).filter(({ l }) => !readIds.has(l.id))
    const pool = unread.length > 0 ? unread : letters.map((l, i) => ({ l, i }))
    const pick = pool[Math.floor(Math.random() * pool.length)]
    sfx.sparkle()
    openLetter(pick.i, { skipEnvelope: !isOnScreen(envelopeEls.current.get(pick.l.id)) })
  }

  const phaseOf = (id: string): EnvelopePhase => (id === openId ? 'open' : id === closingId ? 'closing' : 'closed')
  const fancy = canHover && !reduce
  const loading = rawLetters === null

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-24 sm:px-6 sm:pt-28 md:pb-16">
      <header className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-rose-100 bg-white/60 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-500 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-purple-200"
        >
          <Feather className="h-3.5 w-3.5" aria-hidden="true" />
          Sealed with love
        </motion.div>
        <h1 className="font-serif text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl dark:text-gray-100">
          Letters for You
        </h1>
        <p className="mt-3 font-serif text-lg italic text-rose-900/80 dark:text-rose-100/80">
          Words I wrote when I was thinking of you.
        </p>

        {!loading && letters.length > 0 && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-2"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3.5 py-1.5 text-xs font-medium text-gray-600 shadow-sm ring-1 ring-rose-100 backdrop-blur-md dark:bg-white/5 dark:text-gray-300 dark:ring-white/10">
              <MailOpen className="h-3.5 w-3.5 text-rose-400 dark:text-purple-300" aria-hidden="true" />
              {letters.length} {letters.length === 1 ? 'letter' : 'letters'}
              {unreadCount > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-rose-500 dark:text-purple-200">{unreadCount} still sealed</span>
                </>
              )}
            </span>
            {letters.length > 1 && (
              <button
                type="button"
                onClick={surpriseMe}
                className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-rose-500/25 transition hover:-translate-y-0.5 hover:bg-rose-600 active:scale-95 dark:bg-purple-500 dark:shadow-purple-900/40 dark:hover:bg-purple-400"
              >
                <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
                {unreadCount > 0 ? 'Open a sealed one' : 'Surprise me'}
              </button>
            )}
          </motion.div>
        )}
      </header>

      {loading ? (
        <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-x-8 gap-y-12" aria-busy="true" aria-label="Loading letters">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-full max-w-sm sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)] ${i === 1 ? 'hidden sm:block' : i === 2 ? 'hidden lg:block' : ''}`}
            >
              <div className="aspect-[10/7] w-full animate-pulse rounded-2xl bg-rose-100/70 dark:bg-white/5" />
              <div className="mx-auto mt-4 h-3 w-32 animate-pulse rounded-full bg-rose-100/70 dark:bg-white/5" />
            </div>
          ))}
        </div>
      ) : letters.length === 0 ? (
        <div className="mx-auto max-w-md rounded-3xl border border-rose-100 bg-white/60 px-6 py-12 text-center shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
          <div className="mb-4 text-5xl motion-safe:animate-bounce" aria-hidden="true">
            💌
          </div>
          <p className="font-serif text-xl font-semibold text-gray-800 dark:text-gray-100">No letters yet…</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">…but one is being written for you right now, my love.</p>
        </div>
      ) : (
        <ul className="mx-auto flex max-w-5xl flex-wrap justify-center gap-x-8 gap-y-14 sm:gap-y-16">
          {letters.map((letter, i) => (
            <li key={letter.id} className="w-full max-w-sm sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)]">
              <Envelope
                letter={letter}
                index={i}
                tone={envelopeTone(letter.id, i)}
                tilt={envelopeTilt(letter.id, i)}
                unread={!readIds.has(letter.id)}
                phase={phaseOf(letter.id)}
                dateLabel={formatLetterDate(letter.date)}
                fancy={fancy}
                reduceMotion={reduce}
                onOpen={openLetter}
                registerRef={registerRef}
              />
            </li>
          ))}
        </ul>
      )}

      {mounted &&
        createPortal(
          <AnimatePresence onExitComplete={handleExitComplete}>
            {reader && (
              <LetterReader
                key="letter-reader"
                letters={letters}
                index={reader.index}
                origin={reader.origin}
                fromName={config.fromName}
                onClose={closeReader}
                onNavigate={navigate}
              />
            )}
          </AnimatePresence>,
          document.body,
        )}
    </main>
  )
}
