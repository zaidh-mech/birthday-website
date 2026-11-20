/**
 * Pure game logic for Secret Word: scoring guesses, picking words, stats and
 * validation of whatever comes back out of localStorage. No React in here.
 */
import { seededRandom, todaySeed } from '@/lib/photos'
import { DEFAULT_SECRET_WORDS } from '@/data/love'

export const GAME_ID = 'secret-word'
export const WORD_LENGTH = 5
export const MAX_GUESSES = 6

export type LetterState = 'correct' | 'present' | 'absent'
export type GameStatus = 'playing' | 'won' | 'lost'
export type Mode = 'daily' | 'practice'

export interface GameData {
  word: string
  /** Submitted guesses, oldest first */
  guesses: string[]
  /** Letters typed into the current row (not yet submitted) */
  current: string
  /** Index of the letter revealed by the hint, if one was used */
  hint: number | null
  status: GameStatus
  /** Local date key (YYYY-MM-DD) for the daily game; null for practice */
  date: string | null
}

export interface Stats {
  played: number
  wins: number
  /** Consecutive wins in any mode */
  currentStreak: number
  maxStreak: number
  /** distribution[i] = wins in i + 1 tries */
  distribution: number[]
  /** Consecutive days the daily word was solved */
  dailyStreak: number
  maxDailyStreak: number
  lastDailyWin: string | null
  /** Tries of the most recent win (highlighted in the distribution) */
  lastWinTries: number | null
}

export const EMPTY_STATS: Stats = {
  played: 0,
  wins: 0,
  currentStreak: 0,
  maxStreak: 0,
  distribution: [0, 0, 0, 0, 0, 0],
  dailyStreak: 0,
  maxDailyStreak: 0,
  lastDailyWin: null,
  lastWinTries: null,
}

/* ------------------------------------------------------------------ */
/* Scoring                                                             */
/* ------------------------------------------------------------------ */

/**
 * Colours for one guess. Exact matches are claimed first, then the
 * remaining letters of the answer are handed out left to right, so a
 * repeated letter is only marked "present" as many times as it is
 * actually still unaccounted for in the answer.
 */
export function evaluateGuess(guess: string, answer: string): LetterState[] {
  const result: LetterState[] = Array.from({ length: WORD_LENGTH }, () => 'absent')
  const remaining = new Map<string, number>()
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === answer[i]) result[i] = 'correct'
    else remaining.set(answer[i], (remaining.get(answer[i]) ?? 0) + 1)
  }
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === 'correct') continue
    const left = remaining.get(guess[i]) ?? 0
    if (left > 0) {
      result[i] = 'present'
      remaining.set(guess[i], left - 1)
    }
  }
  return result
}

const RANK: Record<LetterState, number> = { absent: 1, present: 2, correct: 3 }

/** Best known state of every letter that has been guessed (for the on-screen keyboard). */
export function keyboardStates(guesses: readonly string[], answer: string): Record<string, LetterState> {
  const states: Record<string, LetterState> = {}
  for (const guess of guesses) {
    const evaluation = evaluateGuess(guess, answer)
    for (let i = 0; i < WORD_LENGTH; i++) {
      const letter = guess[i]
      const prev = states[letter]
      if (!prev || RANK[evaluation[i]] > RANK[prev]) states[letter] = evaluation[i]
    }
  }
  return states
}

/** Positions already solved by an earlier guess. */
export function solvedPositions(guesses: readonly string[], answer: string): boolean[] {
  const solved = Array.from({ length: WORD_LENGTH }, () => false)
  for (const guess of guesses) {
    for (let i = 0; i < WORD_LENGTH; i++) if (guess[i] === answer[i]) solved[i] = true
  }
  return solved
}

/** Picks a position for the hint that isn't solved yet (null when every spot is known). */
export function chooseHintIndex(game: GameData, random: () => number = Math.random): number | null {
  const solved = solvedPositions(game.guesses, game.word)
  const open = solved.flatMap((isSolved, i) => (isSolved ? [] : [i]))
  if (open.length === 0) return null
  return open[Math.floor(random() * open.length)]
}

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

/** Local calendar date as YYYY-MM-DD. */
export function dateKey(date = new Date()): string {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}

function parseKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key)
  if (!match) return null
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

/** Local midnight of a YYYY-MM-DD key (today if the key is malformed). */
export function keyToDate(key: string): Date {
  return parseKey(key) ?? new Date()
}

/** The key of the day before `key`. */
export function previousDayKey(key: string): string {
  const date = keyToDate(key)
  date.setDate(date.getDate() - 1)
  return dateKey(date)
}

/** Milliseconds until the next local midnight. */
export function msUntilMidnight(now = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return Math.max(0, next.getTime() - now.getTime())
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

/* ------------------------------------------------------------------ */
/* Words                                                               */
/* ------------------------------------------------------------------ */

export function cleanWords(words: readonly string[]): string[] {
  const list = words.map((w) => w.toUpperCase().replace(/[^A-Z]/g, '')).filter((w) => w.length === WORD_LENGTH)
  const unique = [...new Set(list)]
  return unique.length > 0 ? unique : [...DEFAULT_SECRET_WORDS]
}

/** Daily words are chained from this day, so "never the same word twice in a row" holds exactly. */
const DAILY_EPOCH = new Date(2025, 0, 1)

/**
 * Today's word: deterministic for the calendar day (everyone opening the
 * site on the same day gets the same word). If the pick happens to equal
 * yesterday's, the next word in the list is used instead so it never
 * repeats two days running.
 */
export function pickDailyWord(words: readonly string[], date = new Date()): string {
  const list = cleanWords(words)
  if (list.length < 2) return list[0]
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const indexFor = (daysAgo: number) =>
    Math.floor(seededRandom(todaySeed(new Date(day.getFullYear(), day.getMonth(), day.getDate() - daysAgo)))() * list.length) % list.length
  // Compare with the word yesterday actually got (after its own bump), not just
  // its raw pick: replay the rule forward from a fixed day (cheap, a few
  // thousand PRNG calls at most).
  const replay = Math.max(14, Math.round((day.getTime() - DAILY_EPOCH.getTime()) / 86400000))
  let index = indexFor(replay)
  for (let daysAgo = replay - 1; daysAgo >= 0; daysAgo--) {
    const raw = indexFor(daysAgo)
    index = raw === index ? (raw + 1) % list.length : raw
  }
  return list[index]
}

/** A random practice word, avoiding the given words when possible. */
export function pickPracticeWord(words: readonly string[], avoid: readonly (string | null | undefined)[], random: () => number = Math.random): string {
  const list = cleanWords(words)
  const pool = list.filter((w) => !avoid.includes(w))
  const from = pool.length > 0 ? pool : list
  return from[Math.floor(random() * from.length)]
}

export function newGame(word: string, date: string | null): GameData {
  return { word, guesses: [], current: '', hint: null, status: 'playing', date }
}

/* ------------------------------------------------------------------ */
/* Stats                                                               */
/* ------------------------------------------------------------------ */

export function applyResult(stats: Stats, result: { won: boolean; tries: number; mode: Mode; date: string | null }): Stats {
  const next: Stats = { ...stats, distribution: [...stats.distribution] }
  next.played += 1
  if (result.won) {
    next.wins += 1
    const slot = Math.min(MAX_GUESSES, Math.max(1, result.tries)) - 1
    next.distribution[slot] = (next.distribution[slot] ?? 0) + 1
    next.currentStreak += 1
    next.maxStreak = Math.max(next.maxStreak, next.currentStreak)
    next.lastWinTries = result.tries
  } else {
    next.currentStreak = 0
    next.lastWinTries = null
  }

  if (result.mode === 'daily' && result.date) {
    if (result.won) {
      if (next.lastDailyWin === result.date) {
        /* already counted today (shouldn't happen) */
      } else if (next.lastDailyWin === previousDayKey(result.date)) {
        next.dailyStreak += 1
      } else {
        next.dailyStreak = 1
      }
      next.lastDailyWin = result.date
      next.maxDailyStreak = Math.max(next.maxDailyStreak, next.dailyStreak)
    } else {
      next.dailyStreak = 0
    }
  }
  return next
}

/** The daily streak that is still alive today (it lapses after a missed day). */
export function liveDailyStreak(stats: Stats, today = dateKey()): number {
  if (!stats.lastDailyWin) return 0
  if (stats.lastDailyWin === today || stats.lastDailyWin === previousDayKey(today)) return stats.dailyStreak
  return 0
}

/* ------------------------------------------------------------------ */
/* Storage validation                                                  */
/* ------------------------------------------------------------------ */

const isWord = (v: unknown): v is string => typeof v === 'string' && /^[A-Z]{5}$/.test(v)

export function parseGame(raw: unknown): GameData | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Partial<Record<keyof GameData, unknown>>
  if (!isWord(r.word)) return null
  const guesses = Array.isArray(r.guesses) ? r.guesses.filter(isWord).slice(0, MAX_GUESSES) : []
  const current = typeof r.current === 'string' ? r.current.toUpperCase().replace(/[^A-Z]/g, '').slice(0, WORD_LENGTH) : ''
  const hint = typeof r.hint === 'number' && Number.isInteger(r.hint) && r.hint >= 0 && r.hint < WORD_LENGTH ? r.hint : null
  const date = typeof r.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.date) ? r.date : null
  // Status is derived from the guesses so a corrupted value can't lock the board.
  const won = guesses.includes(r.word)
  const status: GameStatus = won ? 'won' : guesses.length >= MAX_GUESSES ? 'lost' : 'playing'
  const trimmed = won ? guesses.slice(0, guesses.indexOf(r.word) + 1) : guesses
  return { word: r.word, guesses: trimmed, current: status === 'playing' ? current : '', hint, status, date }
}

export function parseStats(raw: unknown): Stats {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_STATS, distribution: [...EMPTY_STATS.distribution] }
  const r = raw as Partial<Record<keyof Stats, unknown>>
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0)
  const distribution = Array.from({ length: MAX_GUESSES }, (_, i) => num(Array.isArray(r.distribution) ? r.distribution[i] : 0))
  const lastDailyWin = typeof r.lastDailyWin === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.lastDailyWin) ? r.lastDailyWin : null
  const lastWinTries = typeof r.lastWinTries === 'number' && r.lastWinTries >= 1 && r.lastWinTries <= MAX_GUESSES ? Math.floor(r.lastWinTries) : null
  return {
    played: num(r.played),
    wins: num(r.wins),
    currentStreak: num(r.currentStreak),
    maxStreak: num(r.maxStreak),
    distribution,
    dailyStreak: num(r.dailyStreak),
    maxDailyStreak: num(r.maxDailyStreak),
    lastDailyWin,
    lastWinTries,
  }
}

/** Screen-reader friendly description of a scored guess. */
export function describeGuess(guess: string, answer: string): string {
  const evaluation = evaluateGuess(guess, answer)
  const words: Record<LetterState, string> = { correct: 'correct', present: 'in the word', absent: 'not in the word' }
  return guess
    .split('')
    .map((letter, i) => `${letter} ${words[evaluation[i]]}`)
    .join(', ')
}
