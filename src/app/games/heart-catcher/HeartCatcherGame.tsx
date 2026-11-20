'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Heart, Pause } from 'lucide-react'
import GameShell, { type GameStat } from '@/components/games/GameShell'
import WinModal from '@/components/games/WinModal'
import { getBest, submitScore } from '@/lib/gameStorage'
import { formatPhotoDate, getGamePhotos, pickRandom, type LocalPhoto } from '@/lib/photos'
import { useSiteConfig } from '@/lib/siteConfig'
import { useIsCoarsePointer, usePrefersReducedMotion } from '@/lib/hooks'
import { HeartCatcherEngine, type EngineStatus, type GameResult, type HudState } from './engine'
import { MAX_LIVES } from './entities'
import { OverOverlay, PauseOverlay, StartOverlay } from './Overlays'
import styles from './HeartCatcher.module.css'

const GAME_ID = 'heart-catcher'
const PHOTO_COUNT = 14
/** Fixed nav pill at the top of every page. */
const NAV_CLEARANCE = 92

interface FinishedGame {
  result: GameResult
  isNewBest: boolean
  photo: LocalPhoto | null
  nickname: string
  /** confetti already fired once; reopening the results stays quiet */
  celebrated: boolean
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest('button, a, input, textarea, select, summary, [role="button"], [contenteditable="true"]'))
}

/** Scrolls so the whole board sits between the nav and the bottom of the screen. */
function bringIntoView(el: HTMLElement, reduced: boolean) {
  const rect = el.getBoundingClientRect()
  const vh = window.innerHeight
  const bottomSafe = window.innerWidth < 768 ? 72 : 12
  const avail = vh - NAV_CLEARANCE - bottomSafe
  const targetTop = rect.height <= avail ? NAV_CLEARANCE + (avail - rect.height) / 2 : Math.max(8, Math.min(NAV_CLEARANCE, vh - rect.height))
  const delta = rect.top - targetTop
  if (Math.abs(delta) > 6) window.scrollBy({ top: delta, behavior: reduced ? 'auto' : 'smooth' })
}

function resultMessage(score: number, nick: string): string {
  if (score === 0) return `Not a single heart? That's okay, ${nick}. You already have all of mine.`
  if (score < 25) return `A little jar full of love. Every heart you missed, I'll catch for you.`
  if (score < 75) return `That's a lot of love in one little jar, ${nick}.`
  if (score < 200) return `Look at you go! My heart is basically all yours now.`
  if (score < 500) return `Okay, show-off. You caught every single piece of my heart, ${nick}.`
  return `${score}?! You're unreal, ${nick}. Marry… I mean, play again?`
}

function Lives({ lives }: { lives: number }) {
  return (
    <span className="flex items-center gap-0.5 py-0.5" role="img" aria-label={`${lives} of ${MAX_LIVES} lives left`}>
      {Array.from({ length: MAX_LIVES }, (_, i) => (
        <Heart
          key={i}
          aria-hidden="true"
          className={`h-4 w-4 transition-transform duration-300 ${
            i < lives ? 'scale-100 fill-rose-500 text-rose-500 dark:fill-pink-400 dark:text-pink-400' : 'scale-90 text-rose-200 dark:text-white/20'
          }`}
        />
      ))}
    </span>
  )
}

export default function HeartCatcherGame() {
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<HeartCatcherEngine | null>(null)
  const photosRef = useRef<LocalPhoto[]>([])

  const [status, setStatus] = useState<EngineStatus>('ready')
  const [hud, setHud] = useState<HudState>({ score: 0, lives: MAX_LIVES, combo: 0, mult: 1 })
  const [best, setBest] = useState<number | null>(null)
  const [finished, setFinished] = useState<FinishedGame | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [unsupported, setUnsupported] = useState(false)

  const coarse = useIsCoarsePointer()
  const reduced = usePrefersReducedMotion()
  const { config } = useSiteConfig()
  const nicknames = config.nicknames
  const nickname = config.herName || nicknames[0] || 'my love'

  // Latest nicknames for the game-over message (read inside the engine callback).
  const nicknamesRef = useRef<string[]>(nicknames)
  useEffect(() => {
    nicknamesRef.current = nicknames.length > 0 ? nicknames : ['my love']
  }, [nicknames])

  // Create the engine once; wire size, theme and auto-pause.
  useEffect(() => {
    const canvas = canvasRef.current
    const stage = stageRef.current
    if (!canvas || !stage) return

    setBest(getBest(GAME_ID))

    let engine: HeartCatcherEngine
    try {
      engine = new HeartCatcherEngine(canvas, {
        onHud: (h) => setHud(h),
        onStatus: (s) => setStatus(s),
        onGameOver: (result) => {
          const isBest = submitScore(GAME_ID, result.score)
          setBest(getBest(GAME_ID))
          const lastPhoto = result.photos.length > 0 ? result.photos[result.photos.length - 1] : -1
          const names = nicknamesRef.current
          setFinished({
            result,
            isNewBest: isBest && result.score > 0,
            photo: lastPhoto >= 0 ? (photosRef.current[lastPhoto] ?? null) : null,
            nickname: names[Math.floor(Math.random() * names.length)] ?? 'my love',
            celebrated: false,
          })
          setModalOpen(true)
        },
      })
    } catch {
      setUnsupported(true)
      return
    }
    engineRef.current = engine

    const isDark = () => document.documentElement.classList.contains('dark')
    engine.setTheme(isDark())
    const initial = stage.getBoundingClientRect()
    engine.resize(initial.width, initial.height)

    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect
      if (rect) engine.resize(rect.width, rect.height)
    })
    ro.observe(stage)

    const mo = new MutationObserver(() => engine.setTheme(isDark()))
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    const onVisibility = () => {
      if (document.hidden) engine.pause()
    }
    const onBlur = () => engine.pause()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onBlur)

    // Pause when the board is scrolled mostly out of view (only on the way out, so
    // scrolling it *into* view at the start of a game never pauses it).
    let lastRatio = 1
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1]
        if (!entry) return
        const ratio = entry.intersectionRatio
        if (ratio < 0.35 && lastRatio >= 0.35) engine.pause()
        lastRatio = ratio
      },
      { threshold: [0, 0.35, 0.7] },
    )
    io.observe(stage)

    const photos = pickRandom(getGamePhotos(360), PHOTO_COUNT)
    photosRef.current = photos
    engine.loadPhotos(photos.map((p) => p.thumb))

    return () => {
      ro.disconnect()
      mo.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onBlur)
      engine.destroy()
      engineRef.current = null
    }
  }, [])

  useEffect(() => {
    engineRef.current?.setReducedMotion(reduced)
  }, [reduced])

  // Personal milestone banners.
  useEffect(() => {
    const list = nicknames.length > 0 ? nicknames : ['my love']
    const nick = (i: number) => list[i % list.length]
    engineRef.current?.setMessages(
      [
        `Nice catch, ${nick(0)}!`,
        'You are on fire!',
        `That's my ${nick(2)}!`,
        'My heart is all yours',
        `Look at you go, ${nick(1)}!`,
        'Unstoppable!',
        `Show-off! I love it, ${nick(3)}`,
        'Every heart is yours anyway',
      ],
      coarse ? 'drag anywhere to slide the jar' : 'mouse, or ← → keys to move',
    )
  }, [nicknames, coarse])

  const startGame = useCallback(() => {
    const engine = engineRef.current
    const stage = stageRef.current
    if (!engine) return
    setModalOpen(false)
    if (stage) bringIntoView(stage, reduced)
    engine.start()
  }, [reduced])

  const pauseGame = useCallback(() => engineRef.current?.pause(), [])
  const resumeGame = useCallback(() => engineRef.current?.resume(), [])

  // Esc / P pause and resume; Space / Enter start from the overlays.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const engine = engineRef.current
      if (!engine || e.ctrlKey || e.metaKey || e.altKey) return
      const s = engine.getStatus()
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (s !== 'playing' && s !== 'paused') return
        if (e.key !== 'Escape' && isInteractiveTarget(e.target) && (e.target as Element).tagName !== 'BUTTON') return
        e.preventDefault()
        engine.togglePause()
        return
      }
      if ((e.key === ' ' || e.key === 'Enter') && (s === 'ready' || s === 'over') && !modalOpen) {
        if (isInteractiveTarget(e.target)) return
        e.preventDefault()
        startGame()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen, startGame])

  const stats: GameStat[] = useMemo(
    () => [
      { label: 'Score', value: hud.score },
      { label: 'Lives', value: <Lives lives={hud.lives} /> },
      { label: 'Best', value: best !== null && best > 0 ? best : '—' },
    ],
    [hud.score, hud.lives, best],
  )

  const result = finished?.result
  const modalStats = result
    ? [
        { label: 'Score', value: result.score },
        { label: 'Best', value: best ?? result.score },
        { label: 'Top combo', value: result.bestCombo },
        ...(result.photos.length > 0 ? [{ label: 'Memories', value: result.photos.length }] : []),
      ]
    : []

  const announcement =
    status === 'playing' ? 'Game running' : status === 'paused' ? 'Game paused' : status === 'over' && result ? `Game over. You scored ${result.score}.` : ''

  return (
    <GameShell
      title="Heart Catcher"
      emoji="💘"
      tagline="Catch all my love before it hits the ground."
      stats={stats}
      onRestart={startGame}
      restartLabel={status === 'ready' ? 'Start' : 'Restart'}
      help={
        <ul className="space-y-1.5">
          <li>
            <strong>Move the jar:</strong> drag anywhere on the board (phones), move your mouse over it, or use{' '}
            <kbd className="rounded bg-rose-100 px-1 text-xs dark:bg-white/10">←</kbd>{' '}
            <kbd className="rounded bg-rose-100 px-1 text-xs dark:bg-white/10">→</kbd> /{' '}
            <kbd className="rounded bg-rose-100 px-1 text-xs dark:bg-white/10">A</kbd>{' '}
            <kbd className="rounded bg-rose-100 px-1 text-xs dark:bg-white/10">D</kbd>.
          </li>
          <li>💗 Pink hearts +1 · 💛 golden hearts +5 · 📸 bubbles with our photos +3.</li>
          <li>Catch 5 in a row for ×2, 10 for ×3… all the way to ×5. Letting a heart fall breaks the streak (no other penalty).</li>
          <li>⭐ Star bubble: a magnet for 6 seconds. ⏱️ Clock bubble: slow motion for 5 seconds. 💚 Heart bubble: an extra life.</li>
          <li>💔 Broken hearts and 🌧️ little rain clouds cost a life. You have three.</li>
          <li>
            Pause anytime with the button, <kbd className="rounded bg-rose-100 px-1 text-xs dark:bg-white/10">Esc</kbd> or{' '}
            <kbd className="rounded bg-rose-100 px-1 text-xs dark:bg-white/10">P</kbd>.
          </li>
        </ul>
      }
    >
      <div className="relative mx-auto w-full max-w-[720px]">
        <div
          ref={stageRef}
          className={`${styles.stage} relative w-full overflow-hidden rounded-[1.75rem] border border-rose-100 bg-[#fff1f2] shadow-xl shadow-rose-200/50 ring-1 ring-white/60 dark:border-white/10 dark:bg-[#120f22] dark:shadow-black/50 dark:ring-white/5`}
        >
          <canvas
            ref={canvasRef}
            className={`${styles.canvas} absolute inset-0 block h-full w-full ${status === 'playing' && !coarse ? 'cursor-none' : ''}`}
            role="img"
            aria-label={`Heart Catcher board. Score ${hud.score}, ${hud.lives} ${hud.lives === 1 ? 'life' : 'lives'} left.`}
          />

          {status === 'playing' && (
            <button
              type="button"
              onClick={pauseGame}
              aria-label="Pause game"
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-rose-100 bg-white/80 text-rose-500 shadow-sm backdrop-blur-md transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300/60 active:scale-90 dark:border-white/10 dark:bg-white/10 dark:text-purple-200 dark:hover:bg-white/20"
            >
              <Pause className="h-4 w-4 fill-current" />
            </button>
          )}

          <AnimatePresence>
            {status === 'ready' && !unsupported && (
              <StartOverlay key="start" best={best} coarse={coarse} nickname={nickname} onStart={startGame} />
            )}
            {status === 'paused' && <PauseOverlay key="pause" score={hud.score} onResume={resumeGame} onRestart={startGame} />}
            {status === 'over' && !modalOpen && (
              <OverOverlay
                key="over"
                score={result?.score ?? hud.score}
                best={best}
                onPlayAgain={startGame}
                onShowResults={() => setModalOpen(true)}
              />
            )}
          </AnimatePresence>

          {unsupported && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-gray-600 dark:text-gray-300">
              This browser can't draw the game board, sorry my love. Try another browser?
            </div>
          )}
        </div>

        <p className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
          {coarse ? 'Tip: drag from anywhere, your finger never has to cover the jar.' : 'Tip: arrow keys or A / D work too. Esc pauses.'}
        </p>
        <p className="sr-only" aria-live="polite">
          {announcement}
        </p>
      </div>

      <WinModal
        open={modalOpen && finished !== null}
        title={finished?.isNewBest ? 'New high score!' : 'Game over'}
        quiet={!finished?.isNewBest || finished.celebrated}
        isNewBest={finished?.isNewBest ?? false}
        message={
          finished ? (
            <>
              <p>{resultMessage(finished.result.score, finished.nickname)}</p>
              {finished.result.photos.length > 0 && (
                <p className="mt-1 text-rose-500 dark:text-pink-200">
                  You caught {finished.result.photos.length} of our {finished.result.photos.length === 1 ? 'memory' : 'memories'} along the way.
                </p>
              )}
            </>
          ) : undefined
        }
        stats={modalStats}
        photo={
          finished?.photo
            ? {
                src: finished.photo.thumb,
                alt: 'One of our memories you caught',
                caption: formatPhotoDate(finished.photo.date) ?? 'one of our memories',
              }
            : undefined
        }
        onPlayAgain={startGame}
        onClose={() => {
          setModalOpen(false)
          setFinished((f) => (f && !f.celebrated ? { ...f, celebrated: true } : f))
        }}
      />
    </GameShell>
  )
}
