'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Flame, Images } from 'lucide-react'
import GameShell, { type GameStat } from '@/components/games/GameShell'
import WinModal from '@/components/games/WinModal'
import { getGamePhotos, type LocalPhoto } from '@/lib/photos'
import { sfx, haptic } from '@/lib/sound'
import { getGameData, recordWin, setGameData, submitScore } from '@/lib/gameStorage'
import { formatClock, useCanHover, useLocalStorageState, usePrefersReducedMotion, useStopwatch } from '@/lib/hooks'
import { useSiteConfig } from '@/lib/siteConfig'
import type { Stage } from './PuzzleBoard'
import PuzzlePlay, { type PuzzleGameState } from './PuzzlePlay'
import PuzzleSetup from './PuzzleSetup'
import { countCorrect, isPuzzleSize, isSolved, shuffleBoard, slideFrom, solvedBoard, sourceForDirection, type Direction, type PuzzleSize } from './puzzleLogic'
import { WIN_MESSAGES, WIN_TITLES, photoDateLabel, pick } from './puzzleText'

const GAME_ID = 'puzzle'

interface SetupPrefs {
  photoId: string | null
  size: PuzzleSize
}

interface Records {
  best: Record<PuzzleSize, number | null>
  bestTime: Record<PuzzleSize, number | null>
  solved: string[]
}

interface WinResult {
  moves: number
  seconds: number
  isNewBest: boolean
  best: number
  title: string
  message: string
}

const DEFAULT_PREFS: SetupPrefs = { photoId: null, size: 3 }
const EMPTY_RECORDS: Records = { best: { 3: null, 4: null, 5: null }, bestTime: { 3: null, 4: null, 5: null }, solved: [] }

const KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function readRecords(): Records {
  const sizes: PuzzleSize[] = [3, 4, 5]
  const best = { ...EMPTY_RECORDS.best }
  const bestTime = { ...EMPTY_RECORDS.bestTime }
  for (const n of sizes) {
    best[n] = num(getGameData<unknown>(GAME_ID, `best-${n}`, null))
    bestTime[n] = num(getGameData<unknown>(GAME_ID, `bestTime-${n}`, null))
  }
  const rawSolved = getGameData<unknown>(GAME_ID, 'solved', [])
  const solved = Array.isArray(rawSolved) ? rawSolved.filter((v): v is string => typeof v === 'string') : []
  return { best, bestTime, solved }
}

export default function PuzzleGame() {
  const photos = useMemo(() => getGamePhotos(500), [])
  const reducedMotion = usePrefersReducedMotion()
  const canHover = useCanHover()
  const { config } = useSiteConfig()

  const [prefs, setPrefs] = useLocalStorageState<SetupPrefs>('puzzle_setup_v1', DEFAULT_PREFS)
  const [numbersPref, setNumbersPref] = useLocalStorageState<boolean>('puzzle_numbers_v1', false)
  const showNumbers = numbersPref === true
  const prefPhotoId = prefs && typeof prefs.photoId === 'string' ? prefs.photoId : null
  const selected: LocalPhoto | undefined = photos.find((p) => p.id === prefPhotoId) ?? photos[0]
  const selectedSize: PuzzleSize = prefs && isPuzzleSize(prefs.size) ? prefs.size : 3

  const [phase, setPhase] = useState<'setup' | 'game'>('setup')
  const [game, setGame] = useState<PuzzleGameState | null>(null)
  const [stage, setStage] = useState<Stage>('play')
  const [moves, setMoves] = useState(0)
  const [shuffling, setShuffling] = useState(false)
  const [peekHeld, setPeekHeld] = useState(false)
  const [peekSticky, setPeekSticky] = useState(false)
  const [winOpen, setWinOpen] = useState(false)
  const [result, setResult] = useState<WinResult | null>(null)
  const [records, setRecords] = useState<Records>(EMPTY_RECORDS)
  const [announcement, setAnnouncement] = useState('')
  const [seconds, resetSeconds] = useStopwatch(phase === 'game' && stage === 'play' && moves > 0)

  const peek = stage === 'play' && (peekHeld || peekSticky)
  const roundRef = useRef(0)
  const timers = useRef<number[]>([])

  useEffect(() => {
    setRecords(readRecords())
  }, [])

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }, [])

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  // ---- starting / restarting ------------------------------------------------------
  const resetRun = () => {
    clearTimers()
    setMoves(0)
    resetSeconds()
    setWinOpen(false)
    setResult(null)
    setPeekHeld(false)
    setPeekSticky(false)
  }

  const startGame = (photo: LocalPhoto, n: PuzzleSize) => {
    resetRun()
    roundRef.current += 1
    const scrambled = shuffleBoard(n)
    setPrefs({ photoId: photo.id, size: n })
    setPhase('game')
    setAnnouncement(`New ${n} by ${n} puzzle.`)

    if (reducedMotion) {
      setGame({ photo, n, board: scrambled, round: roundRef.current })
      setStage('play')
      setShuffling(false)
      return
    }

    // Show the whole picture, crack it into tiles, then scatter them.
    setGame({ photo, n, board: solvedBoard(n), round: roundRef.current })
    setStage('intro-whole')
    setShuffling(false)
    later(() => {
      setStage('intro-crack')
      sfx.flip()
    }, 1000)
    later(() => {
      setGame((g) => (g ? { ...g, board: scrambled } : g))
      setShuffling(true)
      setStage('play')
      sfx.whoosh()
    }, 1500)
    later(() => setShuffling(false), 2500)
  }

  const reshuffle = () => {
    if (!game) return
    resetRun()
    setGame({ ...game, board: shuffleBoard(game.n) })
    setStage('play')
    setAnnouncement('Shuffled.')
    if (!reducedMotion) {
      setShuffling(true)
      sfx.whoosh()
      later(() => setShuffling(false), 1100)
    }
  }

  const randomOtherPhoto = (exclude?: string): LocalPhoto | undefined => {
    const pool = photos.length > 1 ? photos.filter((p) => p.id !== exclude) : photos
    return pick(pool)
  }

  const backToSetup = () => {
    resetRun()
    setPhase('setup')
    setGame(null)
    setStage('play')
    sfx.whoosh()
  }

  // ---- moves ------------------------------------------------------------------------
  const handleSolved = (g: PuzzleGameState, totalMoves: number) => {
    const time = seconds
    const n = g.n
    const prevBest = num(getGameData<unknown>(GAME_ID, `best-${n}`, null))
    const isNewBest = prevBest === null || totalMoves < prevBest
    if (isNewBest) setGameData(GAME_ID, `best-${n}`, totalMoves)
    const prevTime = num(getGameData<unknown>(GAME_ID, `bestTime-${n}`, null))
    if (prevTime === null || time < prevTime) setGameData(GAME_ID, `bestTime-${n}`, time)
    submitScore(GAME_ID, totalMoves, { lowerIsBetter: true })
    recordWin(GAME_ID)
    const solvedNow = readRecords().solved
    if (!solvedNow.includes(g.photo.id)) setGameData(GAME_ID, 'solved', [...solvedNow, g.photo.id])
    setRecords(readRecords())

    const nick = config.herName || pick(config.nicknames.length ? config.nicknames : ['my love'])
    setResult({
      moves: totalMoves,
      seconds: time,
      isNewBest,
      best: isNewBest ? totalMoves : (prevBest ?? totalMoves),
      title: pick(WIN_TITLES),
      message: pick(WIN_MESSAGES)(nick),
    })
    setPeekHeld(false)
    setPeekSticky(false)
    setShuffling(false)
    setAnnouncement(`Solved in ${totalMoves} moves!`)
    haptic([20, 40, 30])

    if (reducedMotion) {
      setStage('win-fill')
      later(() => {
        setStage('win-done')
        setWinOpen(true)
      }, 600)
      return
    }
    setStage('win-merge')
    sfx.sparkle()
    later(() => {
      setStage('win-fill')
      sfx.chime()
    }, 700)
    later(() => setStage('win-shimmer'), 1250)
    later(() => {
      setStage('win-done')
      setWinOpen(true)
    }, 2450)
  }

  const onMove = (pos: number): boolean => {
    if (!game || stage !== 'play') return false
    const res = slideFrom(game.board, game.n, pos)
    if (!res) return false
    const totalMoves = moves + res.moved
    const next = { ...game, board: res.board }
    setGame(next)
    setMoves(totalMoves)
    if (shuffling) setShuffling(false)
    if (peekSticky) setPeekSticky(false)
    // A brighter note when a piece lands in its home spot.
    if (countCorrect(res.board) > countCorrect(game.board)) sfx.match()
    else sfx.tick()
    haptic(6)
    if (isSolved(res.board)) {
      handleSolved(next, totalMoves)
    } else {
      setAnnouncement(`${countCorrect(res.board)} of ${game.n * game.n - 1} pieces in place.`)
    }
    return true
  }

  const togglePeek = () => {
    if (stage !== 'play') return
    if (!peekSticky) sfx.flip()
    setPeekSticky(!peekSticky)
  }

  const toggleNumbers = () => {
    sfx.tick()
    setNumbersPref((v) => !(v === true))
  }

  // Keyboard: one window listener that always sees the latest state.
  const keyHandler = useRef<(e: KeyboardEvent) => void>(() => {})
  useEffect(() => {
    keyHandler.current = (e: KeyboardEvent) => {
      if (phase !== 'game' || !game || winOpen) return
      if (e.altKey || e.ctrlKey || e.metaKey || e.defaultPrevented) return
      const target = e.target as HTMLElement | null
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return

      const dir = KEY_DIRECTIONS[e.key.length === 1 ? e.key.toLowerCase() : e.key]
      if (dir) {
        if (stage !== 'play') return
        e.preventDefault()
        const src = sourceForDirection(game.board, game.n, dir)
        if (src !== null) onMove(src)
        return
      }
      if (e.repeat) return
      const k = e.key.toLowerCase()
      if (k === 'p') togglePeek()
      else if (k === 'n') toggleNumbers()
    }
  })
  useEffect(() => {
    const listener = (e: KeyboardEvent) => keyHandler.current(e)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])

  // ---- render -----------------------------------------------------------------------
  const help = (
    <ul className="list-disc space-y-1.5 pl-5">
      <li>Tap a tile in the same row or column as the empty heart space to slide it (and any tiles in between).</li>
      <li>Swipe on the board, or use the arrow keys / WASD: tiles move in the direction you press.</li>
      <li>
        <strong>Peek</strong> (hold or tap, or press P) shows the whole picture. <strong>Numbers</strong> (N) shows where each piece belongs.
      </li>
      <li>The timer starts with your first move. Fewest moves is your best score for each size.</li>
    </ul>
  )

  const n = game?.n ?? selectedSize
  const stats: GameStat[] =
    phase === 'game' && game
      ? [
          { label: 'Moves', value: moves },
          { label: 'Time', value: formatClock(seconds) },
          { label: `Best ${n}×${n}`, value: records.best[n] ?? '–' },
        ]
      : []

  if (!selected) {
    return (
      <GameShell title="Picture Puzzle" emoji="🧩" tagline="Slide the pieces until one of our memories is whole again.">
        <p className="mx-auto max-w-md rounded-3xl border border-rose-100 bg-white/60 p-6 text-center font-serif italic text-gray-600 backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
          Our photos are still on their way. Come back in a moment, my love.
        </p>
      </GameShell>
    )
  }

  return (
    <GameShell
      title="Picture Puzzle"
      emoji="🧩"
      tagline="Slide the pieces until one of our memories is whole again."
      stats={stats}
      onRestart={phase === 'game' && game ? reshuffle : undefined}
      restartLabel="Shuffle"
      help={help}
      wide
    >
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {phase === 'setup' || !game ? (
        <PuzzleSetup
          photos={photos}
          selected={selected}
          size={selectedSize}
          bests={records.best}
          solvedIds={records.solved}
          canHover={canHover}
          reducedMotion={reducedMotion}
          onSelectPhoto={(p) => setPrefs({ photoId: p.id, size: selectedSize })}
          onSelectSize={(s) => setPrefs({ photoId: selected.id, size: s })}
          onStart={() => {
            sfx.pop()
            startGame(selected, selectedSize)
          }}
          onSurprise={() => {
            const photo = randomOtherPhoto(selected.id)
            if (!photo) return
            sfx.sparkle()
            startGame(photo, selectedSize)
          }}
        />
      ) : (
        <div>
          <PuzzlePlay
            game={game}
            stage={stage}
            showNumbers={showNumbers}
            peek={peek}
            shuffling={shuffling}
            reducedMotion={reducedMotion}
            canHover={canHover}
            best={records.best[game.n]}
            bestTime={records.bestTime[game.n]}
            winOpen={winOpen}
            onMove={onMove}
            onPeekHold={(held) => {
              if (held && stage !== 'play') return
              setPeekHeld(held)
            }}
            onPeekToggle={togglePeek}
            onPeekDismiss={() => {
              setPeekHeld(false)
              setPeekSticky(false)
            }}
            onToggleNumbers={toggleNumbers}
            onChangePhoto={backToSetup}
            onReplay={reshuffle}
          />
        </div>
      )}

      <WinModal
        open={winOpen && result !== null && game !== null}
        title={result?.title}
        message={result?.message}
        isNewBest={result?.isNewBest}
        stats={
          result && game
            ? [
                { label: 'Moves', value: result.moves },
                { label: 'Time', value: formatClock(result.seconds) },
                { label: `Best ${game.n}×${game.n}`, value: result.best },
              ]
            : []
        }
        photo={game ? { src: game.photo.src, alt: 'The memory you just put back together', caption: photoDateLabel(game.photo) ?? undefined } : undefined}
        playAgainLabel="Next memory"
        onPlayAgain={() => {
          if (!game) return
          const photo = randomOtherPhoto(game.photo.id)
          if (photo) startGame(photo, game.n)
        }}
        onClose={() => setWinOpen(false)}
      >
        {game && (
          <div className="flex flex-wrap justify-center gap-2">
            {game.n < 5 && (
              <button
                type="button"
                onClick={() => startGame(game.photo, (game.n + 1) as PuzzleSize)}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 active:scale-95 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-200 dark:hover:bg-amber-400/20"
              >
                <Flame className="h-3.5 w-3.5" /> Same photo at {game.n + 1}×{game.n + 1}
              </button>
            )}
            <button
              type="button"
              onClick={backToSetup}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-100 bg-white px-3.5 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-purple-200 dark:hover:bg-white/10"
            >
              <Images className="h-3.5 w-3.5" /> Pick a photo
            </button>
          </div>
        )}
      </WinModal>
    </GameShell>
  )
}
