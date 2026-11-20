'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { motion, AnimatePresence, animate, useMotionValue, useReducedMotion } from 'framer-motion'
import { Check, Lightbulb, LockOpen, Sparkles, KeyRound } from 'lucide-react'
import { sfx, haptic } from '@/lib/sound'
import { celebrate } from '@/lib/celebrate'
import { getAllMedia, getPhotos, pickRandom, seededRandom, todaySeed } from '@/lib/photos'
import VaultDial from './VaultDial'
import { getBlanks, isAnswerCorrect, type BlankPart, type LetterPart } from './lockLetter'
import styles from './memories.module.css'

type BlankStatus = 'idle' | 'correct' | 'wrong'
type VaultPhase = 'idle' | 'spinning' | 'opening' | 'open'

interface VaultGateProps {
  parts: LetterPart[]
  onUnlocked: () => void
}

const SPARKLES = [
  { left: '4%', top: '12%', size: 14, delay: 0, duration: 6 },
  { left: '92%', top: '8%', size: 18, delay: 1.2, duration: 7 },
  { left: '-2%', top: '58%', size: 12, delay: 2.1, duration: 5.5 },
  { left: '97%', top: '46%', size: 14, delay: 0.6, duration: 6.5 },
  { left: '8%', top: '90%', size: 16, delay: 1.7, duration: 7.5 },
  { left: '88%', top: '86%', size: 12, delay: 2.6, duration: 6 },
]

export default function VaultGate({ parts, onUnlocked }: VaultGateProps) {
  const reduceMotion = useReducedMotion() ?? false
  const blanks = useMemo(() => getBlanks(parts), [parts])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<Record<string, BlankStatus>>({})
  const [hints, setHints] = useState<Record<string, number>>({})
  const [attempts, setAttempts] = useState(0)
  const [message, setMessage] = useState<{ tone: 'error' | 'success' | 'hint'; text: string } | null>(null)
  const [phase, setPhase] = useState<VaultPhase>('idle')

  const dial = useMotionValue(0)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const wrapRefs = useRef<Record<string, HTMLSpanElement | null>>({})
  const timers = useRef<number[]>([])
  const lastTick = useRef(0)
  const mounted = useRef(true)

  const media = useMemo(() => getAllMedia(), [])
  const photoCount = media.filter((m) => m.kind === 'image').length
  const videoCount = media.length - photoCount
  const interiorPhotos = useMemo(() => pickRandom(getPhotos(), 3, seededRandom(todaySeed() + 7)), [])

  useEffect(() => {
    mounted.current = true
    const list = timers.current
    return () => {
      mounted.current = false
      list.forEach((t) => {
        window.clearTimeout(t)
        window.clearInterval(t)
      })
    }
  }, [])

  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      timers.current.push(window.setTimeout(resolve, ms))
    })

  const solvedCount = blanks.filter((b) => status[b.id] === 'correct').length
  const busy = phase !== 'idle'

  function nudgeDial(char: string) {
    const code = char ? char.charCodeAt(char.length - 1) : 0
    const delta = (code % 2 === 0 ? 1 : -1) * (8 + (code % 5) * 4)
    if (reduceMotion) dial.set(dial.get() + delta)
    else animate(dial, dial.get() + delta, { type: 'spring', stiffness: 320, damping: 18 })
    const now = performance.now()
    if (now - lastTick.current > 55) {
      lastTick.current = now
      sfx.tick()
    }
  }

  function handleChange(blank: BlankPart, value: string) {
    if (busy || status[blank.id] === 'correct') return
    setAnswers((prev) => ({ ...prev, [blank.id]: value }))
    if (status[blank.id] === 'wrong') setStatus((prev) => ({ ...prev, [blank.id]: 'idle' }))
    if (message?.tone === 'error') setMessage(null)
    nudgeDial(value)
  }

  function shake(ids: string[]) {
    if (reduceMotion) return
    ids.forEach((id) => {
      const el = wrapRefs.current[id]
      if (el) animate(el, { x: [0, -7, 7, -5, 5, -2, 0] }, { duration: 0.45 })
    })
  }

  async function runUnlock() {
    setPhase('spinning')
    setMessage({ tone: 'success', text: 'You remembered everything 💖 Opening our vault…' })
    sfx.match()
    haptic([15, 40, 15])

    if (reduceMotion) {
      setPhase('open')
      sfx.chime()
      celebrate()
      await wait(1100)
      if (mounted.current) onUnlocked()
      return
    }

    const ticker = window.setInterval(() => sfx.tick(), 85)
    timers.current.push(ticker)
    await animate(dial, dial.get() + 900, { duration: 1.3, ease: [0.45, 0, 0.15, 1] })
    window.clearInterval(ticker)
    if (!mounted.current) return

    setPhase('opening')
    sfx.whoosh()
    await wait(480)
    if (!mounted.current) return

    setPhase('open')
    sfx.chime()
    celebrate()
    await wait(1900)
    if (mounted.current) onUnlocked()
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (busy) return

    const next: Record<string, BlankStatus> = {}
    const wrongIds: string[] = []
    let newlyCorrect = 0
    let empty = 0
    for (const b of blanks) {
      if (status[b.id] === 'correct') {
        next[b.id] = 'correct'
        continue
      }
      const value = answers[b.id] ?? ''
      if (isAnswerCorrect(value, b.answer)) {
        next[b.id] = 'correct'
        newlyCorrect += 1
      } else {
        next[b.id] = 'wrong'
        wrongIds.push(b.id)
        if (!value.trim()) empty += 1
      }
    }
    setStatus(next)
    setAttempts((a) => a + 1)

    if (wrongIds.length === 0) {
      void runUnlock()
      return
    }

    const correctTotal = blanks.length - wrongIds.length
    if (newlyCorrect > 0) sfx.match()
    else sfx.miss()
    haptic([30, 50, 30])
    shake(wrongIds)

    if (empty === wrongIds.length && correctTotal === 0) {
      setMessage({ tone: 'error', text: 'The blanks are still empty, my love. Fill them in first ✨' })
    } else if (correctTotal > 0) {
      setMessage({
        tone: 'error',
        text: `${correctTotal} of ${blanks.length} are perfect! The pink ${wrongIds.length === 1 ? 'one needs' : `${wrongIds.length} need`} another try, baby.`,
      })
    } else {
      setMessage({ tone: 'error', text: 'Hmm, not quite, sweetheart. Think about us… 💭' })
    }

    // Spin the dial back a little, like a wrong combination.
    if (!reduceMotion) animate(dial, dial.get() - 40, { type: 'spring', stiffness: 200, damping: 12 })

    const firstWrong = inputRefs.current[wrongIds[0]]
    firstWrong?.focus()
    firstWrong?.select()
  }

  function giveHint() {
    if (busy) return
    const target = blanks.find((b) => status[b.id] !== 'correct')
    if (!target) return
    const current = hints[target.id] ?? 0
    const max = Math.max(1, target.answer.length - 1)
    const nextCount = Math.min(max, current + 1)
    setHints((prev) => ({ ...prev, [target.id]: nextCount }))
    sfx.sparkle()
    const revealed = target.answer.slice(0, nextCount)
    setMessage({
      tone: 'hint',
      text:
        nextCount >= max && current >= max
          ? `That's all the hint I can give for "${target.placeholder}" 😉`
          : `Psst… "${target.placeholder}" starts with "${revealed}"`,
    })
    const el = inputRefs.current[target.id]
    el?.focus()
  }

  const isOpen = phase === 'open'
  const boltsOut = phase === 'idle' || phase === 'spinning'

  return (
    <div className="flex w-full flex-1 flex-col items-center px-4 pb-28 pt-24 sm:px-6 sm:pt-28 md:pb-20">
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-16 text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-rose-400 dark:text-purple-300 sm:mb-20 sm:text-xs"
      >
        Our memory vault
      </motion.p>

      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-2xl"
      >
        {/* ambient glow + floating sparkles */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(251,113,133,0.22),transparent_65%)] blur-2xl dark:bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.22),transparent_65%)]"
        />
        {SPARKLES.map((s, i) => (
          <Sparkles
            key={i}
            aria-hidden="true"
            className={`pointer-events-none absolute hidden text-rose-300 dark:text-purple-300/70 sm:block ${styles.floaty}`}
            style={
              {
                left: s.left,
                top: s.top,
                width: s.size,
                height: s.size,
                '--float-delay': `${s.delay}s`,
                '--float-duration': `${s.duration}s`,
              } as CSSProperties
            }
          />
        ))}

        {/* metal frame */}
        <div className="relative rounded-[2.4rem] bg-gradient-to-br from-[#f7ddd3] via-[#e4ad9f] to-[#b87567] p-2 shadow-[0_30px_80px_-30px_rgba(159,18,57,0.55)] dark:from-[#4b4268] dark:via-[#2b2642] dark:to-[#15131f] dark:shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] sm:p-3">
          <div className="relative" style={{ perspective: 1800 }}>
            {/* the inside of the vault, revealed when the door swings open */}
            <VaultInterior visible={phase !== 'idle'} open={isOpen} photos={interiorPhotos.map((p) => p.thumb)} />

            {/* the door */}
            <motion.div
              animate={isOpen && !reduceMotion ? { rotateY: -108 } : { rotateY: 0 }}
              transition={{ duration: 1.25, ease: [0.65, 0, 0.25, 1] }}
              style={{ transformOrigin: 'left center', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
              className={`relative rounded-[2rem] bg-[#fdfbf7] shadow-[inset_0_2px_0_rgba(255,255,255,0.9),inset_0_-3px_8px_rgba(159,18,57,0.08)] transition-opacity duration-700 dark:bg-[#14151d] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${
                isOpen && reduceMotion ? 'opacity-0' : ''
              }`}
            >
              <div className={`pointer-events-none absolute inset-0 rounded-[2rem] opacity-60 dark:opacity-20 ${styles.brushed}`} aria-hidden="true" />

              {/* hinges */}
              {['top-20', 'bottom-20'].map((pos) => (
                <div
                  key={pos}
                  aria-hidden="true"
                  className={`absolute -left-2.5 ${pos} h-12 w-3.5 rounded-full bg-gradient-to-r from-[#c98d7f] via-[#f3d3c8] to-[#b87567] shadow-md dark:from-[#3a3355] dark:via-[#6a5f8f] dark:to-[#2b2642] sm:-left-3.5 sm:w-4`}
                />
              ))}

              {/* locking bolts */}
              {['top-[22%]', 'top-1/2', 'top-[78%]'].map((pos) => (
                <motion.div
                  key={pos}
                  aria-hidden="true"
                  animate={{ x: boltsOut ? 0 : -14, opacity: boltsOut ? 1 : 0.5 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  className={`absolute -right-2.5 ${pos} h-3 w-5 -translate-y-1/2 rounded-full bg-gradient-to-b from-[#f3d3c8] to-[#b87567] shadow dark:from-[#7d72a6] dark:to-[#3a3355] sm:-right-3.5 sm:h-3.5 sm:w-7`}
                />
              ))}

              {/* dial */}
              <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2">
                <VaultDial rotate={dial} unlocked={phase !== 'idle'} />
              </div>

              <div className="relative px-4 pb-6 pt-16 sm:px-8 sm:pb-9 sm:pt-[5.5rem] md:px-12">
                <div className="text-center">
                  <h1 className="font-serif text-[1.7rem] font-bold leading-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
                    A Letter for You
                  </h1>
                  <p className="mx-auto mt-2 max-w-md text-xs font-medium uppercase tracking-[0.18em] text-rose-400 dark:text-purple-300 sm:text-[13px]">
                    Fill in the blanks to open our memories
                  </p>

                  {/* tumblers: one light per blank */}
                  {blanks.length > 0 && (
                    <div
                      className="mt-4 flex flex-wrap items-center justify-center gap-1.5"
                      role="img"
                      aria-label={`${solvedCount} of ${blanks.length} blanks solved`}
                    >
                      {blanks.map((b) => {
                        const ok = status[b.id] === 'correct'
                        return (
                          <motion.span
                            key={b.id}
                            animate={ok && !reduceMotion ? { scale: [1, 1.5, 1] } : { scale: 1 }}
                            transition={{ duration: 0.4 }}
                            className={`h-2.5 w-2.5 rounded-full border transition-colors duration-500 ${
                              ok
                                ? 'border-emerald-400 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]'
                                : 'border-rose-300 bg-rose-100 dark:border-purple-300/50 dark:bg-white/10'
                            }`}
                          />
                        )
                      })}
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmit} noValidate className="mt-6 sm:mt-8" aria-describedby="vault-feedback">
                  <div
                    className={`rounded-2xl border border-rose-100 bg-white/80 px-4 py-4 text-left font-serif text-[15px] leading-[2.15rem] text-gray-800 shadow-sm [--line:2.15rem] dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-200 sm:px-7 sm:py-6 sm:text-lg sm:leading-[2.5rem] sm:[--line:2.5rem] ${styles.paper}`}
                  >
                    {parts.map((part) =>
                      part.type === 'text' ? (
                        <span key={part.key} className="whitespace-pre-wrap">
                          {part.content}
                        </span>
                      ) : (
                        <BlankField
                          key={part.key}
                          blank={part}
                          value={answers[part.id] ?? ''}
                          status={status[part.id] ?? 'idle'}
                          hint={hints[part.id] ?? 0}
                          disabled={busy}
                          onChange={(v) => handleChange(part, v)}
                          inputRef={(el) => {
                            inputRefs.current[part.id] = el
                          }}
                          wrapRef={(el) => {
                            wrapRefs.current[part.id] = el
                          }}
                          isLast={part.index === blanks.length - 1}
                        />
                      ),
                    )}
                  </div>

                  <div id="vault-feedback" aria-live="polite" className="min-h-[1.5rem]">
                    <AnimatePresence mode="wait">
                      {message && (
                        <motion.p
                          key={message.text}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className={`mt-4 text-center text-sm font-medium ${
                            message.tone === 'error'
                              ? 'text-rose-600 dark:text-rose-300'
                              : message.tone === 'success'
                                ? 'text-emerald-600 dark:text-emerald-300'
                                : 'text-amber-600 dark:text-amber-300'
                          }`}
                        >
                          {message.text}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="mt-5 flex flex-col items-center gap-3 sm:mt-6">
                    <motion.button
                      type="submit"
                      disabled={busy}
                      whileHover={busy || reduceMotion ? undefined : { scale: 1.04 }}
                      whileTap={busy ? undefined : { scale: 0.96 }}
                      className={`group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition-shadow hover:shadow-xl hover:shadow-rose-500/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300 disabled:cursor-default disabled:opacity-80 dark:from-purple-500 dark:via-fuchsia-500 dark:to-rose-500 dark:shadow-purple-900/40 dark:focus-visible:ring-purple-400/50 sm:px-9 sm:py-4 sm:text-base ${styles.sheenHost}`}
                    >
                      <span className={styles.sheen} aria-hidden="true" />
                      {busy ? (
                        <>
                          Opening <LockOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                        </>
                      ) : (
                        <>
                          Open the safe <KeyRound className="h-4 w-4 transition-transform group-hover:rotate-12 sm:h-5 sm:w-5" />
                        </>
                      )}
                    </motion.button>

                    <AnimatePresence>
                      {attempts > 0 && !busy && blanks.length > 0 && (
                        <motion.button
                          type="button"
                          onClick={giveHint}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-amber-600 transition hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 dark:text-amber-300 dark:hover:bg-amber-400/10"
                        >
                          <Lightbulb className="h-3.5 w-3.5" /> Need a little hint?
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </form>

                <p className="mt-6 text-center font-cursive text-lg text-rose-400/90 dark:text-purple-200/70 sm:text-xl">
                  {photoCount} photos{videoCount > 0 ? ` & ${videoCount} video${videoCount > 1 ? 's' : ''}` : ''} are waiting inside…
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

interface BlankFieldProps {
  blank: BlankPart
  value: string
  status: BlankStatus
  hint: number
  disabled: boolean
  isLast: boolean
  onChange: (value: string) => void
  inputRef: (el: HTMLInputElement | null) => void
  wrapRef: (el: HTMLSpanElement | null) => void
}

function BlankField({ blank, value, status, hint, disabled, isLast, onChange, inputRef, wrapRef }: BlankFieldProps) {
  const placeholder = hint > 0 ? `${blank.answer.slice(0, hint)}…` : blank.placeholder
  const width = Math.min(Math.max(placeholder.length, value.length, 4) + 2, 22)
  const correct = status === 'correct'
  const wrong = status === 'wrong'

  return (
    <span ref={wrapRef} className="relative mx-1 inline-block max-w-full align-baseline">
      <input
        ref={inputRef}
        type="text"
        value={value}
        placeholder={placeholder}
        title={blank.placeholder}
        aria-label={`Blank ${blank.index + 1}: ${blank.placeholder}`}
        aria-invalid={wrong || undefined}
        readOnly={correct}
        disabled={disabled && !correct}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint={isLast ? 'go' : 'next'}
        style={{ width: `${width}ch` }}
        className={`max-w-full rounded-t-lg border-b-2 px-2 py-0.5 text-center font-sans text-base font-semibold leading-tight transition-colors duration-300 placeholder:font-normal placeholder:text-gray-400 focus:outline-none dark:placeholder:text-gray-500 ${
          correct
            ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-400/70 dark:bg-emerald-400/10 dark:text-emerald-300'
            : wrong
              ? 'border-rose-500 bg-rose-100/80 text-rose-700 dark:border-rose-400 dark:bg-rose-500/15 dark:text-rose-200'
              : 'border-rose-300 bg-rose-50/70 text-rose-600 focus:border-rose-500 focus:bg-rose-100/70 dark:border-purple-400/70 dark:bg-white/10 dark:text-purple-200 dark:focus:border-purple-300 dark:focus:bg-white/15'
        }`}
      />
      <AnimatePresence>
        {correct && (
          <motion.span
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 16 }}
            className="absolute -right-1.5 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow"
            aria-hidden="true"
          >
            <Check className="h-3 w-3" strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

function VaultInterior({ visible, open, photos }: { visible: boolean; open: boolean; photos: string[] }) {
  const rotations = [-10, 4, 13]
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden rounded-[2rem] bg-[radial-gradient(ellipse_at_50%_40%,#5b1830_0%,#2a0c18_55%,#14060c_100%)] transition-opacity duration-500 dark:bg-[radial-gradient(ellipse_at_50%_40%,#3b1d6e_0%,#1a0f33_55%,#0a0614_100%)] ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className={`absolute left-1/2 top-1/2 h-[70%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-400/30 blur-3xl dark:bg-purple-400/30 ${styles.pulseGlow}`} />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6">
        <div className="relative h-40 w-56 sm:h-52 sm:w-72">
          {photos.map((src, i) => (
            <motion.div
              key={src}
              initial={false}
              animate={open ? { y: 0, rotate: rotations[i], opacity: 1, scale: 1 } : { y: 40, rotate: 0, opacity: 0, scale: 0.8 }}
              transition={{ delay: open ? 0.35 + i * 0.12 : 0, type: 'spring', stiffness: 160, damping: 16 }}
              className="absolute left-1/2 top-1/2 w-24 -translate-x-1/2 -translate-y-1/2 bg-white p-1.5 pb-5 shadow-2xl sm:w-32 sm:p-2 sm:pb-7"
              style={{ marginLeft: `${(i - 1) * 34}%` }}
            >
              <img src={src} alt="" loading="lazy" decoding="async" className="aspect-[3/4] w-full object-cover" style={{ objectPosition: 'center 30%' }} />
            </motion.div>
          ))}
        </div>
        <motion.p
          initial={false}
          animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ delay: open ? 0.8 : 0, duration: 0.6 }}
          className="text-center font-cursive text-3xl text-rose-100 drop-shadow-[0_0_12px_rgba(251,113,133,0.8)] sm:text-4xl"
        >
          Welcome in, my love
        </motion.p>
      </div>
    </div>
  )
}
