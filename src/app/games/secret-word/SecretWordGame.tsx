'use client'

import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { Clock } from 'lucide-react'
import GameShell from '@/components/games/GameShell'
import WinModal from '@/components/games/WinModal'
import { getGame } from '@/data/games'
import { getGameData, recordPlay, recordWin, setGameData, submitScore } from '@/lib/gameStorage'
import { useCanHover, useInterval, useMediaQuery, usePrefersReducedMotion } from '@/lib/hooks'
import { formatPhotoDate, getGamePhotos, getPhotos, seededRandom, todaySeed, type LocalPhoto } from '@/lib/photos'
import { useSiteConfig } from '@/lib/siteConfig'
import { haptic, sfx } from '@/lib/sound'
import Board, { FLIP_MS, FLIP_STAGGER_MS } from './Board'
import FinishedPanel from './FinishedPanel'
import Keyboard from './Keyboard'
import LoseDialog from './LoseDialog'
import StatsDialog from './StatsDialog'
import Toolbar from './Toolbar'
import {
  EMPTY_STATS,
  GAME_ID,
  MAX_GUESSES,
  WORD_LENGTH,
  applyResult,
  chooseHintIndex,
  dateKey,
  describeGuess,
  keyToDate,
  keyboardStates,
  newGame,
  parseGame,
  parseStats,
  pickDailyWord,
  pickPracticeWord,
  type GameData,
  type Mode,
  type Stats,
} from './logic'
import { getWordMessage, pickName, winTitle } from './messages'
import { cx } from './tileStyles'
import { Countdown, MiniWord } from './ui'
import { useBoardLayout } from './useBoardLayout'

interface ResultInfo {
  kind: 'win' | 'lose'
  mode: Mode
  word: string
  tries: number
  isNewBest: boolean
  streak: number
  hintUsed: boolean
  name: string
  photo: LocalPhoto | null
  seed: number
}

interface Games {
  daily: GameData | null
  practice: GameData | null
}

let rewardPool: LocalPhoto[] | null = null

/**
 * A photo of us as a little reward: the same one all day for the daily word,
 * and a stable one per practice word (so the modal and the panel agree).
 */
function rewardPhoto(game: Pick<GameData, 'word' | 'date'>): LocalPhoto | null {
  if (!rewardPool) {
    const good = getGamePhotos(480)
    rewardPool = good.length > 0 ? good : getPhotos()
  }
  if (rewardPool.length === 0) return null
  const seed = game.date
    ? todaySeed(keyToDate(game.date)) * 7 + 11
    : game.word.split('').reduce((acc, ch, i) => acc * 31 + ch.charCodeAt(0) * (i + 7), 17)
  const r = seededRandom(seed)()
  return rewardPool[Math.floor(r * rewardPool.length) % rewardPool.length]
}

function preload(src: string) {
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = src
  } catch {
    /* ignore */
  }
}

/** Is a keyboard user deliberately on this control (rather than it just having been clicked)? */
function isFocusVisible(el: Element): boolean {
  try {
    return el.matches(':focus-visible')
  } catch {
    return true
  }
}

const GAME_INFO = getGame(GAME_ID)

export default function SecretWordGame() {
  const { config, loaded } = useSiteConfig()
  const reduce = usePrefersReducedMotion()
  const canHover = useCanHover()
  const tall = useMediaQuery('(min-height: 820px)')

  const rootRef = useRef<HTMLDivElement>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const layout = useBoardLayout(rootRef, anchorRef, { reducedMotion: reduce })

  const [ready, setReady] = useState(false)
  const [configReady, setConfigReady] = useState(loaded)
  const [today, setToday] = useState('')
  const [mode, setMode] = useState<Mode>('daily')
  const [games, setGames] = useState<Games>({ daily: null, practice: null })
  const [stats, setStats] = useState<Stats>(EMPTY_STATS)
  const [revealing, setRevealing] = useState<{ mode: Mode; row: number } | null>(null)
  const [shakeNonce, setShakeNonce] = useState(0)
  const [bounce, setBounce] = useState<{ mode: Mode; row: number; nonce: number } | null>(null)
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null)
  const [pressed, setPressed] = useState<string | null>(null)
  const [result, setResult] = useState<ResultInfo | null>(null)
  const [resultOpen, setResultOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [announcement, setAnnouncement] = useState('')

  const timers = useRef<number[]>([])
  const toastTimer = useRef<number | null>(null)
  const pressTimer = useRef<number | null>(null)
  const toastId = useRef(0)

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }

  /* ---------------- loading ---------------- */

  // Today's word waits for the cloud config (so it can't change under her
  // feet), but never longer than a few seconds.
  useEffect(() => {
    if (loaded) {
      setConfigReady(true)
      return
    }
    const t = window.setTimeout(() => setConfigReady(true), 3500)
    return () => window.clearTimeout(t)
  }, [loaded])

  useEffect(() => {
    const todayKey = dateKey()
    const storedDaily = parseGame(getGameData<unknown>(GAME_ID, 'daily', null))
    const storedPractice = parseGame(getGameData<unknown>(GAME_ID, 'practice', null))
    const lastMode = getGameData<unknown>(GAME_ID, 'mode', 'daily')
    const daily = storedDaily && storedDaily.date === todayKey ? storedDaily : null
    setToday(todayKey)
    setGames({ daily, practice: storedPractice })
    setStats(parseStats(getGameData<unknown>(GAME_ID, 'stats', null)))
    // A brand-new daily word always gets her attention first.
    setMode(lastMode === 'practice' && daily !== null && daily.status !== 'playing' ? 'practice' : 'daily')
    setReady(true)

    return () => {
      timers.current.forEach((t) => window.clearTimeout(t))
      if (toastTimer.current) window.clearTimeout(toastTimer.current)
      if (pressTimer.current) window.clearTimeout(pressTimer.current)
    }
  }, [])

  // Lock in today's word (persisted, so refreshing keeps the same board).
  useEffect(() => {
    if (!ready || !configReady || !today) return
    if (games.daily && games.daily.date === today) return
    if (revealing?.mode === 'daily') return
    const fresh = newGame(pickDailyWord(config.secretWords, keyToDate(today)), today)
    setGames((g) => ({ ...g, daily: fresh }))
    setGameData(GAME_ID, 'daily', fresh)
  }, [ready, configReady, today, games.daily, revealing, config.secretWords])

  // Practice mode gets a word the first time it's opened.
  useEffect(() => {
    if (!ready || !configReady || mode !== 'practice' || games.practice) return
    const fresh = newGame(pickPracticeWord(config.secretWords, [games.daily?.word]), null)
    setGames((g) => ({ ...g, practice: fresh }))
    setGameData(GAME_ID, 'practice', fresh)
  }, [ready, configReady, mode, games.practice, games.daily?.word, config.secretWords])

  // Midnight rollover while the page stays open.
  const checkDay = useCallback(() => {
    const key = dateKey()
    setToday((prev) => (prev && prev !== key ? key : prev))
  }, [])
  useInterval(checkDay, ready ? 30000 : null)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkDay()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [checkDay])

  /* ---------------- derived ---------------- */

  const game = mode === 'daily' ? games.daily : games.practice
  const revealingRow = revealing && revealing.mode === mode ? revealing.row : null
  const revealedCount = game ? (revealingRow !== null ? revealingRow : game.guesses.length) : 0
  const keyStates = useMemo(() => (game ? keyboardStates(game.guesses.slice(0, revealedCount), game.word) : {}), [game, revealedCount])
  const finished = Boolean(ready && game && game.status !== 'playing' && revealingRow === null)
  const hintState: 'available' | 'used' | 'off' = !game || game.status !== 'playing' ? 'off' : game.hint !== null ? 'used' : 'available'
  const hintLetter = game && game.status === 'playing' && game.hint !== null ? game.word[game.hint] : null
  const dailyDone = Boolean(games.daily && games.daily.status !== 'playing')
  const busy = revealing !== null
  const side = layout?.side ?? false
  const kbHeight = layout ? 3 * layout.keyH + 2 * layout.keyGap : null

  const reason = useMemo(() => {
    if (!today || config.reasons.length === 0) return null
    const r = seededRandom(todaySeed(keyToDate(today)) + 2024)()
    return config.reasons[Math.floor(r * config.reasons.length) % config.reasons.length]
  }, [today, config.reasons])

  /* ---------------- helpers ---------------- */

  const showToast = (text: string, ms = 1700) => {
    const id = ++toastId.current
    setToast({ id, text })
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast((t) => (t?.id === id ? null : t)), ms)
  }

  const flashKey = (key: string) => {
    setPressed(key)
    if (pressTimer.current) window.clearTimeout(pressTimer.current)
    pressTimer.current = window.setTimeout(() => setPressed(null), 140)
  }

  const updateGame = (m: Mode, next: GameData, persist: boolean) => {
    setGames((g) => ({ ...g, [m]: next }))
    if (persist) setGameData(GAME_ID, m, next)
  }

  /* ---------------- input ---------------- */

  const notReady = () => {
    if (!toast) showToast('One sec, your word is on its way…', 1400)
  }

  const typeLetter = (letter: string) => {
    if (!game) return notReady()
    if (game.status !== 'playing' || busy || game.current.length >= WORD_LENGTH) return
    updateGame(mode, { ...game, current: game.current + letter }, false)
    sfx.tick()
  }

  const backspace = () => {
    if (!game || game.status !== 'playing' || busy || !game.current) return
    updateGame(mode, { ...game, current: game.current.slice(0, -1) }, false)
  }

  const runReveal = (m: Mode, row: number, guess: string, word: string, info: ResultInfo | null) => {
    setRevealing({ mode: m, row })
    const stagger = reduce ? 0 : FLIP_STAGGER_MS
    const flip = reduce ? 0 : FLIP_MS
    if (reduce) sfx.flip()
    else for (let i = 0; i < WORD_LENGTH; i++) later(() => sfx.flip(), i * stagger + flip * 0.2)

    later(() => {
      setRevealing(null)
      setAnnouncement(`${describeGuess(guess, word)}.`)
      if (!info) return
      if (info.kind === 'win') {
        setBounce({ mode: m, row, nonce: Date.now() })
        sfx.sparkle()
        haptic([20, 40, 20])
        later(() => {
          setResult(info)
          setResultOpen(true)
        }, reduce ? 450 : 1250)
        // Forget the bounce so switching modes and back doesn't replay it.
        later(() => setBounce(null), 1600)
      } else {
        later(() => {
          setResult(info)
          setResultOpen(true)
        }, reduce ? 250 : 650)
      }
    }, (WORD_LENGTH - 1) * stagger + flip + 60)
  }

  const submit = () => {
    if (!game) return notReady()
    if (game.status !== 'playing' || busy) return
    if (game.current.length < WORD_LENGTH) {
      setShakeNonce((n) => n + 1)
      showToast('Not enough letters')
      setAnnouncement('Not enough letters')
      sfx.miss()
      haptic(30)
      return
    }

    const guess = game.current
    const guesses = [...game.guesses, guess]
    const won = guess === game.word
    const lost = !won && guesses.length >= MAX_GUESSES
    const m = mode
    updateGame(m, { ...game, guesses, current: '', status: won ? 'won' : lost ? 'lost' : 'playing' }, true)

    let info: ResultInfo | null = null
    if (won || lost) {
      const nextStats = applyResult(stats, { won, tries: guesses.length, mode: m, date: game.date })
      setStats(nextStats)
      setGameData(GAME_ID, 'stats', nextStats)
      let isNewBest = false
      if (won) {
        isNewBest = submitScore(GAME_ID, guesses.length, { lowerIsBetter: true })
        recordWin(GAME_ID)
      } else {
        recordPlay(GAME_ID)
      }
      const photo = rewardPhoto(game)
      if (photo) preload(photo.thumb)
      info = {
        kind: won ? 'win' : 'lose',
        mode: m,
        word: game.word,
        tries: guesses.length,
        isNewBest,
        streak: nextStats.currentStreak,
        hintUsed: game.hint !== null,
        name: pickName(config.herName, config.nicknames),
        photo,
        seed: Date.now(),
      }
    }
    runReveal(m, guesses.length - 1, guess, game.word, info)
  }

  const onScreenKey = (key: string) => {
    if (resultOpen || statsOpen) return
    haptic(8)
    if (key === 'ENTER') submit()
    else if (key === 'BACKSPACE') backspace()
    else typeLetter(key)
  }

  const onKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return
    if (resultOpen || statsOpen) return
    const target = e.target instanceof HTMLElement ? e.target : null
    if (target && (target.isContentEditable || target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])'))) return
    // Some other dialog on the page (e.g. a site-wide one) owns the keyboard.
    if (target?.closest('[role="dialog"]')) return

    const accepting = Boolean(game && game.status === 'playing')
    const key = e.key

    if (key === 'Enter') {
      const control = target && target !== document.body ? target.closest<HTMLElement>('button, a[href], [role="button"], summary') : null
      // A keyboard user tabbed onto a button: let Enter press that button.
      if (control && isFocusVisible(control)) return
      if (!accepting) return
      e.preventDefault()
      // A mouse-clicked button still has focus: drop it so Enter is the guess.
      control?.blur()
      if (e.repeat) return
      flashKey('ENTER')
      submit()
      return
    }
    if (key === 'Backspace') {
      if (!accepting) return
      e.preventDefault()
      flashKey('BACKSPACE')
      backspace()
      return
    }
    if (/^[a-z]$/i.test(key)) {
      if (accepting) e.preventDefault()
      flashKey(key.toUpperCase())
      typeLetter(key.toUpperCase())
    }
  })

  useEffect(() => {
    const handler = (e: KeyboardEvent) => onKeyDown(e)
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  /* ---------------- actions ---------------- */

  const revealHint = () => {
    if (!game || game.status !== 'playing' || busy) return
    if (game.hint !== null) {
      showToast('Only one hint per word 😉')
      return
    }
    const index = chooseHintIndex(game)
    if (index === null) {
      showToast('You already know where every letter goes!')
      return
    }
    updateGame(mode, { ...game, hint: index }, true)
    sfx.sparkle()
    const ordinal = ['1st', '2nd', '3rd', '4th', '5th'][index]
    showToast(`Psst… the ${ordinal} letter is “${game.word[index]}” ✨`, 2800)
    setAnnouncement(`Hint: the ${ordinal} letter is ${game.word[index]}`)
  }

  const switchMode = (next: Mode) => {
    if (next === mode || busy) return
    setMode(next)
    setGameData(GAME_ID, 'mode', next)
    setToast(null)
    sfx.flip()
  }

  const newPracticeWord = () => {
    clearTimers()
    setRevealing(null)
    setBounce(null)
    setResultOpen(false)
    const fresh = newGame(pickPracticeWord(config.secretWords, [games.daily?.word, games.practice?.word]), null)
    updateGame('practice', fresh, true)
    setMode('practice')
    setGameData(GAME_ID, 'mode', 'practice')
    setToast(null)
    sfx.whoosh()
  }

  /** Continue an unfinished practice word, or start a new one. */
  const goPractice = () => {
    setResultOpen(false)
    if (games.practice && games.practice.status === 'playing') {
      setMode('practice')
      setGameData(GAME_ID, 'mode', 'practice')
      sfx.flip()
    } else {
      newPracticeWord()
    }
  }

  const handleRestart = (e?: { detail?: number }) => {
    // GameShell's restart button keeps focus after a click; drop it so a
    // physical Enter submits a guess instead of restarting again.
    if (!e || (e.detail ?? 1) > 0) {
      const active = document.activeElement
      if (active instanceof HTMLElement && active !== document.body) active.blur()
    }
    newPracticeWord()
  }

  const openStats = () => {
    setResultOpen(false)
    setStatsOpen(true)
    sfx.pop()
  }

  /* ---------------- render ---------------- */

  const help = (
    <div className="space-y-3">
      <p>
        Guess my secret love word in <strong>six tries</strong>. Type any five letters, with your keyboard or the keys under the board, then press{' '}
        <strong>Enter</strong>. After each guess the tiles turn to show how close you were:
      </p>
      <ul className="space-y-2">
        <li className="flex items-center gap-3">
          <MiniWord word="H" states="correct" size={26} /> right letter, right spot
        </li>
        <li className="flex items-center gap-3">
          <MiniWord word="E" states="present" size={26} /> in the word, but somewhere else
        </li>
        <li className="flex items-center gap-3">
          <MiniWord word="Y" states="absent" size={26} /> not in the word at all
        </li>
      </ul>
      <p>
        <strong>Today’s word</strong> is the same all day and changes at midnight. <strong>Practice</strong> gives you as many new words as you like. Stuck? The
        lightbulb reveals one letter, once per word.
      </p>
    </div>
  )

  const winResult = result?.kind === 'win' ? result : null
  const loseResult = result?.kind === 'lose' ? result : null

  return (
    <GameShell
      title="Secret Word"
      emoji={GAME_INFO?.emoji ?? '🔤'}
      help={help}
      onRestart={mode === 'practice' ? handleRestart : undefined}
      restartLabel="New word"
      actions={
        <Toolbar
          mode={mode}
          onMode={switchMode}
          locked={busy}
          hint={hintState}
          onHint={revealHint}
          onStats={openStats}
          streak={stats.currentStreak}
          anchorRef={anchorRef}
        />
      }
    >
      <div
        ref={rootRef}
        className={cx('relative mx-auto flex w-full', side ? 'flex-row items-center justify-center gap-5' : 'flex-col items-center gap-3 sm:gap-[18px]')}
      >
        <div className={cx('flex justify-center', side && 'min-w-0 flex-1')}>
          <Board
            game={ready ? game : null}
            tile={layout?.tile ?? null}
            gap={layout?.gap ?? null}
            revealingRow={revealingRow}
            shakeNonce={shakeNonce}
            bounce={bounce && bounce.mode === mode ? bounce : null}
            toast={toast}
            reducedMotion={reduce}
            canHover={canHover}
          />
        </div>

        <div className={cx(side ? 'flex-none' : 'w-full')} style={side && layout ? { width: layout.kbWidth } : undefined}>
          {finished && game ? (
            <FinishedPanel
              game={game}
              daily={mode === 'daily'}
              compact={(layout?.keyH ?? 48) <= 42}
              minHeight={kbHeight}
              reason={reason}
              photo={rewardPhoto(game)}
              onPractice={goPractice}
              onNewWord={newPracticeWord}
              onStats={openStats}
              onDayChange={checkDay}
            />
          ) : (
            <Keyboard
              states={keyStates}
              onKey={onScreenKey}
              pressed={pressed}
              hintLetter={hintLetter}
              keyH={layout?.keyH ?? null}
              keyGap={layout?.keyGap ?? null}
            />
          )}
        </div>

        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>
      </div>

      <WinModal
        open={resultOpen && winResult !== null}
        title={winResult ? winTitle(winResult.tries, winResult.name) : 'You did it!'}
        message={
          winResult ? (
            <div className="flex flex-col items-center gap-2.5">
              <MiniWord word={winResult.word} states="correct" size={34} animate delayMs={200} />
              <p className="font-cursive text-xl leading-snug text-rose-500 sm:text-2xl dark:text-purple-300">“{getWordMessage(winResult.word)}”</p>
              {winResult.hintUsed && <p className="text-xs text-gray-500 dark:text-gray-400">(with a tiny hint from me 💡)</p>}
            </div>
          ) : null
        }
        stats={
          winResult
            ? [
                { label: 'Tries', value: `${winResult.tries}/${MAX_GUESSES}` },
                { label: 'Streak', value: `${winResult.streak} 🔥` },
              ]
            : []
        }
        isNewBest={winResult?.isNewBest ?? false}
        photo={
          winResult?.photo && tall
            ? { src: winResult.photo.thumb, alt: 'A photo of us', caption: formatPhotoDate(winResult.photo.date) ?? 'us ♡' }
            : undefined
        }
        onPlayAgain={winResult?.mode === 'daily' ? goPractice : newPracticeWord}
        playAgainLabel={winResult?.mode === 'daily' ? 'Play practice words' : 'New word'}
        onClose={() => setResultOpen(false)}
      >
        {winResult?.mode === 'daily' && (
          <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            New word in <Countdown onExpire={checkDay} className="font-semibold text-gray-800 dark:text-gray-200" />
          </p>
        )}
      </WinModal>

      <LoseDialog
        open={resultOpen && loseResult !== null}
        onClose={() => setResultOpen(false)}
        word={loseResult?.word ?? ''}
        name={loseResult?.name ?? 'my love'}
        daily={loseResult?.mode === 'daily'}
        seed={loseResult?.seed ?? 0}
        photo={loseResult?.photo ?? null}
        onPractice={loseResult?.mode === 'daily' ? goPractice : newPracticeWord}
        onStats={openStats}
        onDayChange={checkDay}
      />

      <StatsDialog open={statsOpen} onClose={() => setStatsOpen(false)} stats={stats} today={today} dailyDone={dailyDone} onDayChange={checkDay} />
    </GameShell>
  )
}
