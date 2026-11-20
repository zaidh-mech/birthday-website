'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Cake, Flame, Mic, Music, RotateCcw, Square } from 'lucide-react'
import { useSiteConfig } from '@/lib/siteConfig'
import { celebrate } from '@/lib/celebrate'
import { haptic, playHappyBirthday, sfx, stopMelody, useSoundEnabled } from '@/lib/sound'
import { shuffle } from '@/lib/photos'
import CakeSvg from './CakeSvg'
import MelodyVisualizer from './MelodyVisualizer'
import Reveal from './Reveal'
import SectionHeading from './SectionHeading'
import { useMicBlow, type MicStatus } from './useMicBlow'
import { BUTTON_PRIMARY, BUTTON_SECONDARY, GLASS_CARD, petName } from './types'
import styles from './Cake.module.css'

const MIC_NOTES: Partial<Record<MicStatus, string>> = {
  denied: 'My mic trick needs permission, but no worries. Just tap each flame to blow it out 💨',
  unsupported: 'This browser can’t lend me its microphone. Tap the flames instead, my love 💨',
  error: 'The mic got shy. Tap each flame to blow it out instead 💨',
}

function allLit(n: number): boolean[] {
  return Array.from({ length: n }, () => true)
}

export default function WishCakeSection() {
  const { config } = useSiteConfig()
  const count = Math.min(10, Math.max(1, Math.round(config.yearsTogether) || 5))
  const name = petName(config.herName, config.nicknames)
  const [soundOn] = useSoundEnabled()

  const [lit, setLit] = useState<boolean[]>(() => allLit(count))
  const [smoke, setSmoke] = useState<number[]>(() => Array.from({ length: count }, () => 0))
  const litRef = useRef(lit)
  const [playing, setPlaying] = useState(false)
  const [note, setNote] = useState(-1)
  const [round, setRound] = useState(0)
  const playingRef = useRef(false)
  const songTimer = useRef<number | null>(null)
  const timers = useRef<number[]>([])
  const soundOnRef = useRef(soundOn)

  useEffect(() => {
    soundOnRef.current = soundOn
  }, [soundOn])

  // The candle count comes from the config, which may load after first paint.
  useEffect(() => {
    litRef.current = allLit(count)
    setLit(litRef.current)
    setSmoke(Array.from({ length: count }, () => 0))
  }, [count])

  const litCount = lit.filter(Boolean).length
  const allOut = litCount === 0

  const blowOut = useCallback((i: number) => {
    if (!litRef.current[i]) return
    const next = [...litRef.current]
    next[i] = false
    litRef.current = next
    setLit(next)
    setSmoke((prev) => {
      const s = [...prev]
      s[i] = (s[i] ?? 0) + 1
      return s
    })
    sfx.pop()
    haptic(12)
  }, [])

  const onPuff = useCallback(
    (strength: 1 | 2) => {
      const burning = litRef.current.map((on, i) => (on ? i : -1)).filter((i) => i >= 0)
      shuffle(burning)
        .slice(0, strength)
        .forEach((i, k) => {
          if (k === 0) blowOut(i)
          else timers.current.push(window.setTimeout(() => blowOut(i), 140 * k))
        })
    },
    [blowOut],
  )

  const { status: micStatus, start: startMic, stop: stopMic, meterRef } = useMicBlow(onPuff)

  const stopSong = useCallback(() => {
    if (songTimer.current !== null) window.clearTimeout(songTimer.current)
    songTimer.current = null
    if (playingRef.current) stopMelody()
    playingRef.current = false
    setPlaying(false)
    setNote(-1)
  }, [])

  const startSong = useCallback(() => {
    stopSong()
    const duration = playHappyBirthday((i) => setNote(i))
    if (!duration) return
    playingRef.current = true
    setPlaying(true)
    songTimer.current = window.setTimeout(() => {
      playingRef.current = false
      setPlaying(false)
      setNote(-1)
    }, duration + 700)
  }, [stopSong])

  // All candles out → the wish moment.
  useEffect(() => {
    if (!allOut) return
    stopMic()
    const t = window.setTimeout(() => {
      celebrate()
      if (soundOnRef.current) startSong()
    }, 350)
    return () => window.clearTimeout(t)
  }, [allOut])

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t))
      if (songTimer.current !== null) window.clearTimeout(songTimer.current)
      if (playingRef.current) stopMelody()
    },
    [],
  )

  const relight = () => {
    stopSong()
    litRef.current = allLit(count)
    setLit(litRef.current)
    setRound((r) => r + 1)
    sfx.sparkle()
  }

  const listening = micStatus === 'listening'
  const micNote = MIC_NOTES[micStatus]

  return (
    <section id="wish" className="relative scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24">
      <SectionHeading
        eyebrow="Make a wish"
        icon={<Cake className="h-3.5 w-3.5 text-rose-400 dark:text-purple-300" aria-hidden />}
        title="Blow out your candles"
        subtitle={`${count} ${count === 1 ? 'candle' : 'candles'}, one for every year of us. Tap the flames, or let me borrow your mic and blow.`}
      />

      <Reveal className="mx-auto grid w-full max-w-5xl items-center gap-8 md:grid-cols-[1.1fr_1fr] md:gap-12">
        <div className={`${GLASS_CARD} relative mx-auto w-full max-w-md overflow-hidden px-3 pb-4 pt-10 sm:px-6 md:max-w-none`}>
          {/* warm light from the candles; fades as they go out */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-[12%] top-[6%] h-[55%] rounded-full bg-amber-300/40 blur-3xl transition-opacity duration-700 dark:bg-amber-400/25"
            style={{ opacity: litCount / count }}
          />
          {allOut && (
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" key={`star-${round}`}>
              <span className={styles.shootingStar} />
            </div>
          )}
          <div className="relative">
            <CakeSvg lit={lit} smoke={smoke} label={`${config.yearsTogether} ${config.yearsTogether === 1 ? 'year' : 'years'} of us`} onBlow={blowOut} />
          </div>
        </div>

        <div className="text-center md:text-left" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            {!allOut ? (
              <motion.div key="burning" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <div className="flex items-center justify-center gap-1.5 md:justify-start" aria-hidden>
                  {lit.map((on, i) => (
                    <Flame
                      key={i}
                      className={`h-5 w-5 transition-all duration-500 ${
                        on ? 'fill-amber-300 text-orange-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]' : 'scale-75 fill-transparent text-gray-300 dark:text-white/20'
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-3 font-serif text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-100">
                  {litCount} of {count} {count === 1 ? 'candle' : 'candles'} still glowing
                </p>
                <p className="mt-2 text-pretty text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  Tap a flame to blow it out, or press the button and blow gently at your screen, {name}.
                </p>

                <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:justify-start">
                  {listening ? (
                    <button type="button" onClick={stopMic} className={BUTTON_SECONDARY}>
                      <Square className="h-4 w-4" aria-hidden /> Stop listening
                    </button>
                  ) : (
                    <button type="button" onClick={() => void startMic()} disabled={micStatus === 'requesting'} className={BUTTON_PRIMARY}>
                      <Mic className="h-4 w-4" aria-hidden />
                      {micStatus === 'requesting' ? 'Asking for your mic…' : 'Blow 🎤'}
                    </button>
                  )}
                  {listening && (
                    <div className="flex items-center gap-2 text-xs font-medium text-rose-500 dark:text-purple-200">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 motion-safe:animate-ping dark:bg-purple-300" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500 dark:bg-purple-400" />
                      </span>
                      Listening… blow! 🌬️
                    </div>
                  )}
                </div>

                {listening && (
                  <div className="mx-auto mt-4 h-2 w-full max-w-[16rem] overflow-hidden rounded-full bg-rose-100 md:mx-0 dark:bg-white/10" aria-hidden>
                    <div
                      ref={meterRef}
                      className="h-full w-full origin-left rounded-full bg-gradient-to-r from-amber-300 via-rose-400 to-rose-500 transition-transform duration-75 dark:from-amber-300 dark:via-fuchsia-400 dark:to-purple-400"
                      style={{ transform: 'scaleX(0)' }}
                    />
                  </div>
                )}
                {micNote && (
                  <p role="status" className="mx-auto mt-4 max-w-sm rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 md:mx-0 dark:bg-white/5 dark:text-purple-100">
                    {micNote}
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div key="wish" initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12 }}>
                <p className="font-cursive text-5xl leading-tight text-rose-500 sm:text-6xl dark:text-purple-200">Make a wish 🌠</p>
                <p className="mt-3 text-pretty font-serif text-base italic leading-relaxed text-rose-900/80 sm:text-lg dark:text-rose-100/80">
                  Close your eyes, {name}… I hope every single one comes true. And if it needs a little help, I&rsquo;m right here.
                </p>
                <div className="mt-5">
                  <MelodyVisualizer active={playing ? note : -1} />
                </div>
                <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:justify-start">
                  {playing ? (
                    <button type="button" onClick={stopSong} className={BUTTON_PRIMARY}>
                      <Square className="h-4 w-4" aria-hidden /> Stop the song
                    </button>
                  ) : (
                    <button type="button" onClick={startSong} className={BUTTON_PRIMARY}>
                      <Music className="h-4 w-4" aria-hidden /> Play our song
                    </button>
                  )}
                  <button type="button" onClick={relight} className={BUTTON_SECONDARY}>
                    <RotateCcw className="h-4 w-4" aria-hidden /> Light them again
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Reveal>
    </section>
  )
}
