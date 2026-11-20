'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Images, RotateCcw } from 'lucide-react'
import GameShell, { type GameStat } from '@/components/games/GameShell'
import WinModal from '@/components/games/WinModal'
import { getGamePhotos, pickRandom, type LocalPhoto } from '@/lib/photos'
import { burstFromElement } from '@/lib/celebrate'
import { sfx, haptic } from '@/lib/sound'
import { getGameData, recordWin, setGameData, submitScore } from '@/lib/gameStorage'
import { formatClock, usePrefersReducedMotion, useStopwatch } from '@/lib/hooks'
import { useSiteConfig } from '@/lib/siteConfig'
import {
  GAME_ID,
  MATCH_PHRASES,
  MISS_PHRASES,
  WIN_TITLES,
  buildDeck,
  difficultyInfo,
  isDifficulty,
  pick,
  preloadImages,
  shortDate,
  type Difficulty,
  type MemoryCardData,
} from './logic'
import { NAV_CLEARANCE, bottomReserve, useBoardLayout } from './useBoardLayout'
import MemoryCard, { type FloatLabel, type LabelAlign } from './MemoryCard'
import BoardHud, { type HudMessage } from './BoardHud'
import DifficultyPicker from './DifficultyPicker'
import StartOverlay from './StartOverlay'
import PhotoLightbox from './PhotoLightbox'

type Phase = 'loading' | 'playing' | 'won'

interface GameState {
  round: number
  difficulty: Difficulty
  deck: MemoryCardData[]
  /** Indices of revealed, not-yet-resolved cards (0–2) */
  faceUp: number[]
  /** pairIds found so far */
  matched: string[]
  /** Indices currently shaking after a miss */
  missed: number[]
  moves: number
  streak: number
  bestStreak: number
  started: boolean
  phase: Phase
  label: (FloatLabel & { index: number }) | null
  message: HudMessage | null
}

interface RoundResult {
  title: string
  difficulty: Difficulty
  moves: number
  seconds: number
  isNewBest: boolean
  bestMoves: number
  bestTime: number
  bestStreak: number
  perfect: boolean
  photo: LocalPhoto
}

const INITIAL: GameState = {
  round: 0,
  difficulty: 'easy',
  deck: [],
  faceUp: [],
  matched: [],
  missed: [],
  moves: 0,
  streak: 0,
  bestStreak: 0,
  started: false,
  phase: 'loading',
  label: null,
  message: null,
}

/** Seconds between cards landing during the deal. */
function dealStep(total: number): number {
  return Math.min(0.045, 0.9 / Math.max(1, total))
}

/** The round's photos, oldest first (undated last): a tiny timeline for the lightbox. */
function roundPhotos(deck: MemoryCardData[]): LocalPhoto[] {
  const seen = new Set<string>()
  const photos: LocalPhoto[] = []
  for (const card of deck) {
    if (seen.has(card.pairId)) continue
    seen.add(card.pairId)
    photos.push(card.photo)
  }
  const time = (p: LocalPhoto) => (p.date ? new Date(p.date).getTime() : Number.POSITIVE_INFINITY)
  return photos.sort((a, b) => time(a) - time(b))
}

const HELP = (
  <ul className="space-y-1.5">
    <li>💞 Tap a card to flip it, then flip a second one. If it's the same photo, the pair stays face up.</li>
    <li>🙈 Not a pair? Both flip back over, so try to remember where they were.</li>
    <li>⏱️ The clock starts on your first flip. Fewer moves is a better score.</li>
    <li>⌨️ Keyboard: Tab or the arrow keys to move around, Enter or Space to flip.</li>
    <li>🖼️ When you finish, tap any photo to see it big.</li>
  </ul>
)

export default function MemoryMatch() {
  const reduceMotion = usePrefersReducedMotion()
  const { config } = useSiteConfig()
  const pool = useMemo(() => getGamePhotos(400), [])

  // ---- Core game state (mirrored in a ref so handlers and timers always see the latest) ----
  const [game, setGame] = useState<GameState>(INITIAL)
  const gameRef = useRef<GameState>(INITIAL)
  const commit = useCallback((next: GameState) => {
    gameRef.current = next
    setGame(next)
  }, [])

  const [introOpen, setIntroOpen] = useState(true)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [wave, setWave] = useState(false)
  const [result, setResult] = useState<RoundResult | null>(null)
  const [showWin, setShowWin] = useState(false)
  const [viewIndex, setViewIndex] = useState<number | null>(null)
  const [announce, setAnnounce] = useState('')
  const [nickname, setNickname] = useState('my love')
  const name = config.herName || nickname

  // ---- Timers ----
  const timers = useRef<number[]>([])
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.current = timers.current.filter((t) => t !== id)
      fn()
    }, ms)
    timers.current.push(id)
  }
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  useEffect(() => () => clearTimers(), [])

  const idCounter = useRef(0)
  const nextId = () => {
    idCounter.current += 1
    return idCounter.current
  }

  // ---- Clock: runs from the first flip until the last pair, paused while the tab is hidden ----
  const [tabVisible, setTabVisible] = useState(true)
  useEffect(() => {
    const onChange = () => setTabVisible(document.visibilityState === 'visible')
    onChange()
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])
  const [seconds, resetClock] = useStopwatch(game.started && game.phase === 'playing' && tabVisible)
  const secondsRef = useRef(0)
  const resetClockRef = useRef(resetClock)
  useEffect(() => {
    secondsRef.current = seconds
    resetClockRef.current = resetClock
  })

  // ---- Board layout ----
  const containerRef = useRef<HTMLDivElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const pairs = difficultyInfo(game.difficulty).pairs
  const layout = useBoardLayout(containerRef, game.deck.length || pairs * 2)
  const cardEls = useRef<(HTMLButtonElement | null)[]>([])

  const ensureBoardVisible = () => {
    const el = boardRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const top = NAV_CLEARANCE
    const bottom = window.innerHeight - bottomReserve(window.innerWidth)
    let delta = 0
    if (r.bottom > bottom) delta = r.bottom - bottom
    if (r.top - delta < top) delta = r.top - top
    if (Math.abs(delta) < 4) return
    window.scrollTo({ top: window.scrollY + delta, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  // ---- Rounds ----
  const startRound = (difficulty: Difficulty) => {
    clearTimers()
    const round = gameRef.current.round + 1
    const count = difficultyInfo(difficulty).pairs
    const deck = buildDeck(count, pool)
    commit({ ...INITIAL, round, difficulty, deck, phase: 'loading' })
    resetClockRef.current()
    setResult(null)
    setShowWin(false)
    setViewIndex(null)
    setWave(false)
    setProgress({ done: 0, total: count })
    cardEls.current = []

    preloadImages(
      deck.map((c) => c.photo.thumb),
      (done, total) => {
        if (gameRef.current.round === round) setProgress({ done, total })
      },
    ).then(() => {
      const cur = gameRef.current
      if (cur.round !== round || cur.phase !== 'loading') return
      commit({ ...cur, phase: 'playing' })
    })
  }

  useEffect(() => {
    const saved = getGameData<unknown>(GAME_ID, 'difficulty', 'easy')
    startRound(isDifficulty(saved) ? saved : 'easy')
    if (config.nicknames.length > 0) setNickname(pick(config.nicknames))
  }, [])

  const changeDifficulty = (d: Difficulty) => {
    setGameData(GAME_ID, 'difficulty', d)
    sfx.tick()
    startRound(d)
  }

  const restart = () => {
    sfx.whoosh()
    startRound(gameRef.current.difficulty)
  }

  const playAgain = () => {
    startRound(gameRef.current.difficulty)
    window.setTimeout(ensureBoardVisible, 80)
  }

  const handleStart = () => {
    setIntroOpen(false)
    sfx.sparkle()
    haptic(10)
    // Wait for the board to render, then bring all of it on screen.
    later(ensureBoardVisible, 60)
    if (!reduceMotion) {
      // A shimmer runs across the backs once the deal has landed.
      const n = gameRef.current.deck.length
      const dealMs = (0.05 + n * dealStep(n)) * 1000 + 250
      later(() => setWave(true), dealMs)
      later(() => setWave(false), dealMs + 1800)
    }
    // Keyboard users land on the first card.
    if (window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) {
      later(() => cardEls.current[0]?.focus({ preventScroll: true }), 80)
    }
  }

  // ---- HUD messages and floating labels clear themselves ----
  const showMessage = (round: number, text: string, tone: HudMessage['tone']) => {
    const id = nextId()
    const cur = gameRef.current
    if (cur.round !== round) return
    commit({ ...cur, message: { id, text, tone } })
    later(() => {
      const now = gameRef.current
      if (now.round === round && now.message?.id === id) commit({ ...now, message: null })
    }, 1700)
  }

  // ---- Playing ----
  const finish = (round: number) => {
    const cur = gameRef.current
    if (cur.round !== round) return
    const secs = secondsRef.current
    const d = cur.difficulty

    const prevBest = getGameData<unknown>(GAME_ID, `best-${d}`, null)
    const isNewBest = typeof prevBest !== 'number' || cur.moves < prevBest
    if (isNewBest) setGameData(GAME_ID, `best-${d}`, cur.moves)
    const prevTime = getGameData<unknown>(GAME_ID, `bestTime-${d}`, null)
    const isNewTime = typeof prevTime !== 'number' || secs < prevTime
    if (isNewTime) setGameData(GAME_ID, `bestTime-${d}`, secs)
    submitScore(GAME_ID, cur.moves, { lowerIsBetter: true })
    recordWin(GAME_ID)

    const photos = roundPhotos(cur.deck)
    const total = cur.deck.length / 2
    setResult({
      title: cur.moves === total ? 'Perfect memory!' : pick(WIN_TITLES),
      difficulty: d,
      moves: cur.moves,
      seconds: secs,
      isNewBest,
      bestMoves: isNewBest ? cur.moves : (prevBest as number),
      bestTime: isNewTime ? secs : (prevTime as number),
      bestStreak: cur.bestStreak,
      perfect: cur.moves === total,
      photo: pickRandom(photos, 1)[0] ?? cur.deck[0].photo,
    })
    setShowWin(true)
    setAnnounce(`You found all ${total} pairs in ${cur.moves} moves!`)
  }

  const resolveMatch = (round: number, index: number) => {
    const cur = gameRef.current
    if (cur.round !== round) return
    const card = cur.deck[index]
    const matched = [...cur.matched, card.pairId]
    const total = cur.deck.length / 2
    const done = matched.length === total
    const streak = cur.streak + 1
    const date = shortDate(card.photo.date)
    const labelId = nextId()

    commit({
      ...cur,
      matched,
      faceUp: [],
      streak,
      bestStreak: Math.max(cur.bestStreak, streak),
      phase: done ? 'won' : 'playing',
      label: { index, id: labelId, text: date ?? pick(MATCH_PHRASES) },
    })
    sfx.match()
    haptic(14)
    burstFromElement(cardEls.current[index], {
      hearts: true,
      particleCount: reduceMotion ? 8 : 22,
      spread: 70,
      scalar: 0.9,
    })
    setAnnounce(`Match! ${matched.length} of ${total} pairs found.`)

    if (!done) {
      if (streak >= 3) showMessage(round, `🔥 ${streak} in a row, ${name}!`, 'match')
      else if (streak === 2) showMessage(round, '✨ Two in a row!', 'match')
      else if (date) showMessage(round, pick(MATCH_PHRASES), 'match')
    } else {
      showMessage(round, 'Every single one ♥', 'match')
      later(() => finish(round), reduceMotion ? 450 : 1000)
    }

    later(() => {
      const now = gameRef.current
      if (now.round === round && now.label?.id === labelId) commit({ ...now, label: null })
    }, 1800)
  }

  const flip = (index: number) => {
    const g = gameRef.current
    const card = g.deck[index]
    if (!card) return
    const isMatched = g.matched.includes(card.pairId)

    if (g.phase === 'won') {
      // Once the win dialog has been seen and closed, the board becomes a little photo album.
      if (isMatched && result !== null && !showWin) {
        const photos = roundPhotos(g.deck)
        const i = photos.findIndex((p) => p.id === card.pairId)
        if (i >= 0) {
          sfx.whoosh()
          setViewIndex(i)
        }
      }
      return
    }
    if (g.phase !== 'playing' || introOpen) return
    if (isMatched || g.faceUp.includes(index) || g.faceUp.length >= 2) return

    sfx.flip()
    haptic(6)
    const faceUp = [...g.faceUp, index]
    if (faceUp.length === 1) {
      commit({ ...g, faceUp, started: true })
      return
    }

    const [a, b] = faceUp
    const round = g.round
    commit({ ...g, faceUp, moves: g.moves + 1, started: true })

    if (g.deck[a].pairId === g.deck[b].pairId) {
      later(() => resolveMatch(round, b), reduceMotion ? 150 : 420)
      return
    }

    // Miss: let her see the photo, shake, then flip both back.
    later(() => {
      const cur = gameRef.current
      if (cur.round !== round) return
      commit({ ...cur, missed: [a, b], streak: 0 })
      showMessage(round, pick(MISS_PHRASES), 'miss')
      sfx.miss()
      haptic([8, 50, 8])
      setAnnounce('Not a match.')
    }, reduceMotion ? 250 : 450)
    later(() => {
      const cur = gameRef.current
      if (cur.round !== round) return
      commit({ ...cur, faceUp: [], missed: [] })
    }, reduceMotion ? 1000 : 1250)
  }

  const navigate = (index: number, key: string) => {
    const n = gameRef.current.deck.length
    const cols = layout?.cols ?? 4
    let next = index
    if (key === 'ArrowRight') next = Math.min(n - 1, index + 1)
    else if (key === 'ArrowLeft') next = Math.max(0, index - 1)
    else if (key === 'ArrowDown') next = index + cols < n ? index + cols : index
    else if (key === 'ArrowUp') next = index - cols >= 0 ? index - cols : index
    else if (key === 'Home') next = 0
    else if (key === 'End') next = n - 1
    cardEls.current[next]?.focus()
  }

  // Stable callbacks for the memoised cards, always calling the latest handlers.
  const handlers = useRef({ flip, navigate })
  useLayoutEffect(() => {
    handlers.current = { flip, navigate }
  })
  const onActivate = useCallback((i: number) => handlers.current.flip(i), [])
  const onNavigate = useCallback((i: number, key: string) => handlers.current.navigate(i, key), [])
  const registerRef = useCallback((i: number, el: HTMLButtonElement | null) => {
    cardEls.current[i] = el
  }, [])

  // ---- Render ----
  const matchedSet = useMemo(() => new Set(game.matched), [game.matched])
  const photosForViewer = useMemo(() => roundPhotos(game.deck), [game.deck])
  const loading = game.phase === 'loading'
  const won = game.phase === 'won'
  const total = game.deck.length

  const stats: GameStat[] = [
    { label: 'Moves', value: game.moves },
    { label: 'Time', value: formatClock(seconds) },
    { label: 'Pairs', value: `${game.matched.length}/${pairs}` },
  ]

  const hudWidth = layout ? Math.min(layout.availW, Math.max(layout.boardW, 272)) : 0
  const hudMessage: HudMessage | null = loading && !introOpen ? { id: -1, text: 'Shuffling our photos…', tone: 'info' } : game.message

  return (
    <GameShell
      title="Memory Match"
      emoji="🃏"
      tagline="Flip two at a time and find every pair of us."
      stats={stats}
      onRestart={restart}
      restartLabel="New deck"
      help={HELP}
      actions={<DifficultyPicker value={game.difficulty} onChange={changeDifficulty} reduceMotion={reduceMotion} />}
    >
      <div ref={containerRef} className="relative w-full">
        {introOpen ? (
          <StartOverlay
            name={name}
            pairs={pairs}
            loading={loading}
            progress={progress}
            onStart={handleStart}
            reduceMotion={reduceMotion}
          />
        ) : (
          <div ref={boardRef} className="relative mx-auto max-w-full" style={{ width: layout ? hudWidth : undefined }}>
            {layout ? (
              <>
                <BoardHud
                  width={hudWidth}
                  pairs={pairs}
                  found={game.matched.length}
                  moves={game.moves}
                  seconds={seconds}
                  message={hudMessage}
                  reduceMotion={reduceMotion}
                />
                <div
                  role="group"
                  aria-label={`Memory cards, ${pairs} pairs`}
                  aria-busy={loading}
                  className="mx-auto grid"
                  style={{
                    width: layout.boardW,
                    gridTemplateColumns: `repeat(${layout.cols}, ${layout.cardW}px)`,
                    gap: layout.gap,
                  }}
                >
                  {game.deck.map((card, i) => {
                    const col = i % layout.cols
                    const row = Math.floor(i / layout.cols)
                    const align: LabelAlign = col === 0 ? 'left' : col === layout.cols - 1 ? 'right' : 'center'
                    const isMatched = matchedSet.has(card.pairId)
                    return (
                      <MemoryCard
                        key={`${game.round}-${card.key}`}
                        index={i}
                        card={card}
                        width={layout.cardW}
                        height={layout.cardH}
                        faceUp={game.faceUp.includes(i)}
                        matched={isMatched}
                        missed={game.missed.includes(i)}
                        viewable={won && result !== null && !showWin && isMatched}
                        dealDelay={reduceMotion ? 0 : 0.05 + i * dealStep(total)}
                        reduceMotion={reduceMotion}
                        label={game.label && game.label.index === i ? game.label : null}
                        labelAlign={align}
                        wave={wave}
                        waveDelay={(row + col) * 0.07}
                        registerRef={registerRef}
                        onActivate={onActivate}
                        onNavigate={onNavigate}
                      />
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="h-[55vh] min-h-[320px]" aria-hidden />
            )}
          </div>
        )}

        {won && !showWin && result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mt-6 flex max-w-md flex-col items-center gap-3 rounded-3xl border border-rose-100 bg-white/70 p-4 text-center shadow-sm backdrop-blur-md sm:flex-row sm:justify-between sm:p-5 sm:text-left dark:border-white/10 dark:bg-white/5"
          >
            <div>
              <p className="font-serif text-lg font-bold text-gray-900 dark:text-gray-100">
                All {pairs} pairs found <span className="text-rose-500 dark:text-pink-300">♥</span>
              </p>
              <p className="mt-0.5 flex items-center justify-center gap-1.5 text-xs text-gray-500 sm:justify-start dark:text-gray-400">
                <Images className="h-3.5 w-3.5" aria-hidden /> Tap any photo to see it big.
              </p>
            </div>
            <button
              type="button"
              onClick={playAgain}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-500/25 transition hover:bg-rose-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300 active:scale-95 dark:bg-purple-500 dark:hover:bg-purple-400 dark:focus-visible:ring-purple-400/60"
            >
              <RotateCcw className="h-4 w-4" aria-hidden /> Play again
            </button>
          </motion.div>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      <WinModal
        open={showWin && result !== null}
        title={result?.title}
        message={
          result ? (
            <>
              You found all {difficultyInfo(result.difficulty).pairs} pairs of us, {name}.{' '}
              {result.perfect ? 'Not a single miss. You really do remember everything.' : 'Every one of these is a moment I would live again with you.'}
            </>
          ) : null
        }
        stats={
          result
            ? [
                { label: 'Moves', value: result.moves },
                { label: 'Time', value: formatClock(result.seconds) },
                { label: 'Streak', value: `${result.bestStreak}×` },
              ]
            : []
        }
        isNewBest={result?.isNewBest ?? false}
        photo={
          result
            ? {
                src: result.photo.thumb,
                alt: result.photo.caption || 'One of our photos',
                caption: result.photo.caption,
              }
            : undefined
        }
        onPlayAgain={playAgain}
        onClose={() => setShowWin(false)}
      >
        {result && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Your best on {difficultyInfo(result.difficulty).label}: <strong className="text-gray-700 dark:text-gray-200">{result.bestMoves} moves</strong>
            {' · '}fastest <strong className="text-gray-700 dark:text-gray-200">{formatClock(result.bestTime)}</strong>
          </p>
        )}
      </WinModal>

      <PhotoLightbox
        photos={photosForViewer}
        index={viewIndex}
        onClose={() => setViewIndex(null)}
        onIndexChange={setViewIndex}
        reduceMotion={reduceMotion}
      />
    </GameShell>
  )
}
