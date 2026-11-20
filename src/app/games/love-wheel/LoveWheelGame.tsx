'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Hand, Sparkles } from 'lucide-react'
import GameShell from '@/components/games/GameShell'
import { useSiteConfig, type WheelPrize } from '@/lib/siteConfig'
import { getGamePhotos, type LocalPhoto } from '@/lib/photos'
import { burstFromElement } from '@/lib/celebrate'
import { sfx } from '@/lib/sound'
import { getRecord, recordPlay } from '@/lib/gameStorage'
import { usePrefersReducedMotion } from '@/lib/hooks'
import Wheel, { type WheelHandle } from './Wheel'
import PrizeReveal from './PrizeReveal'
import { PrizeList, Winnings } from './Winnings'
import { HISTORY_LIMIT, makeEntry, readHistory, saveHistory, type WinEntry } from './history'
import { MAX_SEGMENTS, randomInt } from './wheelMath'
import styles from './wheel.module.css'

const REWARD_PHOTOS: LocalPhoto[] = getGamePhotos(480)

function pickPhoto(avoidId?: string): LocalPhoto | null {
  if (REWARD_PHOTOS.length === 0) return null
  let photo = REWARD_PHOTOS[randomInt(REWARD_PHOTOS.length)]
  for (let i = 0; i < 4 && photo.id === avoidId && REWARD_PHOTOS.length > 1; i++) {
    photo = REWARD_PHOTOS[randomInt(REWARD_PHOTOS.length)]
  }
  return photo
}

export default function LoveWheelGame() {
  const { config } = useSiteConfig()
  const reducedMotion = usePrefersReducedMotion()
  const wheelRef = useRef<WheelHandle>(null)
  const spinButtonRef = useRef<HTMLButtonElement>(null)
  const revealTimer = useRef<number | null>(null)
  const nextPhoto = useRef<LocalPhoto | null>(null)

  const [spinning, setSpinning] = useState(false)
  // Freeze the prize list while the wheel is turning so a late config load can't swap segments mid-spin.
  const [prizes, setPrizes] = useState<WheelPrize[]>(() => config.wheelPrizes.slice(0, MAX_SEGMENTS))
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null)
  const [result, setResult] = useState<{ prize: WheelPrize; photo: LocalPhoto | null } | null>(null)
  const [history, setHistory] = useState<WinEntry[]>([])
  const [spins, setSpins] = useState(0)
  const [announcement, setAnnouncement] = useState('')

  const appliedPrizes = useRef(config.wheelPrizes)
  useEffect(() => {
    if (spinning || appliedPrizes.current === config.wheelPrizes) return
    appliedPrizes.current = config.wheelPrizes
    setPrizes(config.wheelPrizes.slice(0, MAX_SEGMENTS))
    setWinnerIndex(null)
  }, [config.wheelPrizes, spinning])

  useEffect(() => {
    setHistory(readHistory())
    setSpins(getRecord('love-wheel').plays ?? 0)
    return () => {
      if (revealTimer.current !== null) window.clearTimeout(revealTimer.current)
    }
  }, [])

  const nickname = config.herName || config.nicknames[0] || 'my love'

  const handleSpinStart = useCallback(() => {
    if (revealTimer.current !== null) window.clearTimeout(revealTimer.current)
    setSpinning(true)
    setResult(null)
    setWinnerIndex(null)
    recordPlay('love-wheel')
    setSpins((s) => s + 1)
    setAnnouncement('Spinning the wheel…')
    sfx.whoosh()
    // Warm the reward photo up while the wheel turns.
    const photo = pickPhoto(nextPhoto.current?.id)
    nextPhoto.current = photo
    if (photo) {
      const img = new Image()
      img.decoding = 'async'
      img.src = photo.thumb
    }
  }, [])

  const handleSpinEnd = useCallback(
    (index: number) => {
      setSpinning(false)
      const prize = prizes[index]
      if (!prize) return
      setWinnerIndex(index)
      sfx.win()
      burstFromElement(wheelRef.current?.getElement() ?? null, { hearts: true, particleCount: 110, spread: 110 })
      const entry = makeEntry(prize)
      setHistory((prev) => {
        const next = [entry, ...prev].slice(0, HISTORY_LIMIT)
        saveHistory(next)
        return next
      })
      setAnnouncement(`You won ${prize.label}! ${prize.detail}`)
      const photo = nextPhoto.current
      revealTimer.current = window.setTimeout(() => {
        revealTimer.current = null
        setResult({ prize, photo })
      }, reducedMotion ? 200 : 700)
    },
    [prizes, reducedMotion],
  )

  const spin = () => {
    if (!spinning) wheelRef.current?.spin()
  }

  const closeResult = useCallback(() => setResult(null), [])
  const fallbackFocus = useCallback(() => spinButtonRef.current, [])

  const spinAgain = useCallback(() => {
    setResult(null)
    // Let the dialog start closing first.
    window.setTimeout(() => wheelRef.current?.spin(), reducedMotion ? 0 : 220)
  }, [reducedMotion])

  const clearHistory = useCallback(() => {
    setHistory([])
    saveHistory([])
    sfx.whoosh()
  }, [])

  const stats = useMemo(
    () => [
      { label: 'Spins', value: spins },
      { label: 'Prizes', value: prizes.length },
    ],
    [spins, prizes.length],
  )

  return (
    <GameShell
      title="Wheel of Love"
      emoji="🎡"
      tagline={`Spin it and see what I owe you, ${nickname}. Every prize is real and never expires.`}
      stats={stats}
      wide
      help={
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Press <strong>Spin</strong>, or grab the wheel and flick it. The harder you flick, the longer it spins.</li>
          <li>Wherever the little heart pointer stops, that's your prize. Every prize has exactly the same chance.</li>
          <li>Tap <strong>Claim it</strong> to send it to me on WhatsApp, and I have to pay up. 😘</li>
          <li>Keyboard: focus the wheel and press <kbd>Enter</kbd> or <kbd>Space</kbd>.</li>
        </ul>
      }
    >
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] lg:gap-10">
        <section aria-label="The wheel" className="-mx-4 flex flex-col items-center overflow-x-clip px-4 pb-2 pt-3 sm:mx-0 sm:px-0">
          <Wheel
            ref={wheelRef}
            prizes={prizes}
            reducedMotion={reducedMotion}
            winnerIndex={winnerIndex}
            onSpinStart={handleSpinStart}
            onSpinEnd={handleSpinEnd}
          />

          <button
            ref={spinButtonRef}
            type="button"
            onClick={spin}
            aria-disabled={spinning}
            className="group relative isolate mt-6 inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 px-10 py-4 font-serif text-xl font-bold uppercase tracking-[0.22em] text-white shadow-lg shadow-rose-500/30 outline-none transition hover:scale-[1.03] hover:brightness-110 focus-visible:ring-4 focus-visible:ring-rose-300 active:scale-95 aria-disabled:cursor-not-allowed aria-disabled:opacity-75 aria-disabled:hover:scale-100 aria-disabled:active:scale-100 dark:from-purple-500 dark:via-fuchsia-500 dark:to-pink-500 dark:shadow-purple-500/30 dark:focus-visible:ring-purple-400/60"
          >
            {!spinning && (
              <span aria-hidden="true" className={`${styles.spinGlow} absolute -inset-1.5 -z-10 rounded-full bg-rose-400/50 blur-md dark:bg-purple-400/40`} />
            )}
            <Sparkles className={`h-5 w-5 ${spinning ? 'animate-spin motion-reduce:animate-none' : ''}`} />
            {spinning ? 'Spinning…' : 'Spin'}
          </button>

          <p className="mt-3 flex items-center gap-1.5 text-center text-xs text-gray-500 dark:text-gray-400">
            <Hand className="h-3.5 w-3.5 shrink-0" />
            or grab the wheel and give it a flick
          </p>

          <p className="sr-only" aria-live="polite">
            {announcement}
          </p>
        </section>

        <aside className="space-y-5">
          <Winnings history={history} whatsappNumber={config.whatsappNumber} onClear={clearHistory} reducedMotion={reducedMotion} />
          <PrizeList prizes={prizes} />
        </aside>
      </div>

      <PrizeReveal
        prize={result?.prize ?? null}
        photo={result?.photo ?? null}
        whatsappNumber={config.whatsappNumber}
        fromName={config.fromName}
        reducedMotion={reducedMotion}
        onClose={closeResult}
        onSpinAgain={spinAgain}
        fallbackFocus={fallbackFocus}
      />
    </GameShell>
  )
}
