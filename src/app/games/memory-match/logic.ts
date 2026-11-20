import { shuffle, type LocalPhoto } from '@/lib/photos'

export const GAME_ID = 'memory-match'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface DifficultyInfo {
  id: Difficulty
  label: string
  pairs: number
}

export const DIFFICULTIES: DifficultyInfo[] = [
  { id: 'easy', label: 'Easy', pairs: 6 },
  { id: 'medium', label: 'Medium', pairs: 8 },
  { id: 'hard', label: 'Hard', pairs: 12 },
]

export function isDifficulty(value: unknown): value is Difficulty {
  return value === 'easy' || value === 'medium' || value === 'hard'
}

export function difficultyInfo(id: Difficulty): DifficultyInfo {
  return DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES[0]
}

export interface MemoryCardData {
  /** Unique per card */
  key: string
  /** Shared by the two cards of a pair */
  pairId: string
  photo: LocalPhoto
}

const NEAR_DUPLICATE_MS = 5 * 60 * 1000

function timeOf(photo: LocalPhoto): number | null {
  if (!photo.date) return null
  const t = new Date(photo.date).getTime()
  return Number.isNaN(t) ? null : t
}

/**
 * Picks `count` photos, avoiding shots taken within a few minutes of each
 * other (burst photos look almost identical, which makes pairs unfair).
 */
export function pickDistinctPhotos(pool: readonly LocalPhoto[], count: number, random: () => number = Math.random): LocalPhoto[] {
  const shuffled = shuffle(pool, random)
  const chosen: LocalPhoto[] = []
  const skipped: LocalPhoto[] = []
  for (const photo of shuffled) {
    if (chosen.length >= count) break
    const t = timeOf(photo)
    const tooClose = t !== null && chosen.some((c) => {
      const ct = timeOf(c)
      return ct !== null && Math.abs(ct - t) < NEAR_DUPLICATE_MS
    })
    if (tooClose) skipped.push(photo)
    else chosen.push(photo)
  }
  // Not enough distinct ones: top up with whatever is left.
  for (const photo of skipped) {
    if (chosen.length >= count) break
    chosen.push(photo)
  }
  return chosen
}

export function buildDeck(pairs: number, pool: readonly LocalPhoto[], random: () => number = Math.random): MemoryCardData[] {
  const photos = pickDistinctPhotos(pool, pairs, random)
  const cards = photos.flatMap((photo) => [
    { key: `${photo.id}~a`, pairId: photo.id, photo },
    { key: `${photo.id}~b`, pairId: photo.id, photo },
  ])
  return shuffle(cards, random)
}

/** "Dec 31, 2023", or null for undated photos. */
export function shortDate(date: string | null): string | null {
  if (!date) return null
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export const MATCH_PHRASES = [
  'Found us!',
  "That's us ♥",
  'Perfect pair',
  'Just like us two',
  'You remembered!',
  'Made for each other',
  'Two of a kind',
  'My favourite match',
]

export const MISS_PHRASES = ['So close!', 'Not quite, cutie', 'Almost!', 'Try again, baby', 'Hmm, nope', 'Keep going!']

export const WIN_TITLES = ['You remembered us!', 'Every pair, found!', 'Perfect memory, my love', 'All of us, together']

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

// ---------------------------------------------------------------------------
// Image preloading (kept across rounds so replays start instantly)

const loaded = new Set<string>()
const pending = new Map<string, Promise<void>>()
const keepAlive: HTMLImageElement[] = []

function loadOne(url: string): Promise<void> {
  if (loaded.has(url)) return Promise.resolve()
  const existing = pending.get(url)
  if (existing) return existing
  const promise = new Promise<void>((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    const done = () => {
      loaded.add(url)
      pending.delete(url)
      resolve()
    }
    img.onload = () => {
      if (typeof img.decode === 'function') img.decode().then(done, done)
      else done()
    }
    img.onerror = () => {
      pending.delete(url)
      resolve()
    }
    img.src = url
    keepAlive.push(img)
  })
  pending.set(url, promise)
  return promise
}

/**
 * Loads and decodes every URL. Resolves when all are done or after
 * `timeoutMs` (a slow photo never blocks the game: it just appears late).
 */
export function preloadImages(urls: readonly string[], onProgress?: (done: number, total: number) => void, timeoutMs = 7000): Promise<void> {
  const unique = [...new Set(urls)]
  let done = 0
  onProgress?.(0, unique.length)
  const all = Promise.all(
    unique.map((url) =>
      loadOne(url).then(() => {
        done += 1
        onProgress?.(done, unique.length)
      }),
    ),
  ).then(() => undefined)
  const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, timeoutMs))
  return Promise.race([all, timeout])
}
