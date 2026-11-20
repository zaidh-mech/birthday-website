'use client'

/**
 * Per-device game progress (best scores, play counts, unlocked things).
 * Everything lives in localStorage under one key and never throws.
 */

const KEY = 'birthday_games_v1'

export type GameId = 'memory-match' | 'puzzle' | 'heart-catcher' | 'love-coupons' | 'love-wheel' | 'secret-word' | (string & {})

interface GameRecord {
  best?: number
  plays?: number
  wins?: number
  lastPlayed?: string
  data?: Record<string, unknown>
}

type Store = Record<string, GameRecord>

function read(): Store {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Store) : {}
  } catch {
    return {}
  }
}

function write(store: Store): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    /* quota or blocked storage */
  }
}

export function getRecord(game: GameId): GameRecord {
  return read()[game] ?? {}
}

export function getBest(game: GameId): number | null {
  const best = read()[game]?.best
  return typeof best === 'number' ? best : null
}

/**
 * Saves `score` if it beats the stored best. Use `lowerIsBetter` for moves/time.
 * Returns true when it's a new personal best.
 */
export function submitScore(game: GameId, score: number, { lowerIsBetter = false } = {}): boolean {
  const store = read()
  const rec = store[game] ?? {}
  const prev = rec.best
  const isBest = typeof prev !== 'number' || (lowerIsBetter ? score < prev : score > prev)
  store[game] = {
    ...rec,
    best: isBest ? score : prev,
    plays: (rec.plays ?? 0) + 1,
    lastPlayed: new Date().toISOString(),
  }
  write(store)
  return isBest
}

export function recordWin(game: GameId): void {
  const store = read()
  const rec = store[game] ?? {}
  store[game] = { ...rec, wins: (rec.wins ?? 0) + 1, lastPlayed: new Date().toISOString() }
  write(store)
}

export function recordPlay(game: GameId): void {
  const store = read()
  const rec = store[game] ?? {}
  store[game] = { ...rec, plays: (rec.plays ?? 0) + 1, lastPlayed: new Date().toISOString() }
  write(store)
}

/** Arbitrary per-game data (e.g. which coupons were scratched). */
export function getGameData<T>(game: GameId, key: string, fallback: T): T {
  const value = read()[game]?.data?.[key]
  return value === undefined ? fallback : (value as T)
}

export function setGameData(game: GameId, key: string, value: unknown): void {
  const store = read()
  const rec = store[game] ?? {}
  store[game] = { ...rec, data: { ...(rec.data ?? {}), [key]: value } }
  write(store)
}

/** Everything, for the games hub. */
export function getAllRecords(): Store {
  return read()
}
