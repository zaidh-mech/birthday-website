import manifest from '@/data/photos.generated.json'
import { asset } from './basePath'

/**
 * Our photos, generated from assets/photos by `npm run photos`.
 * Paths in the manifest are site-relative; the helpers below return them
 * already prefixed with the deploy base path, ready for <img src>.
 */
export interface LocalPhoto {
  id: string
  kind: 'image'
  /** Original file name in assets/photos */
  file: string
  caption: string
  story: string
  /** ISO-ish local date string (no timezone), or null when unknown */
  date: string | null
  year: number | null
  /** Full-size webp, max 1600px long edge */
  src: string
  /** Thumbnail webp, max 640px long edge */
  thumb: string
  width: number
  height: number
  thumbWidth: number
  thumbHeight: number
  /** Tiny base64 webp for blur-up placeholders */
  blur: string
  /** Dominant colour, e.g. "#a0522d" — handy for glows and backgrounds */
  color: string
}

export interface LocalVideo {
  id: string
  kind: 'video'
  file: string
  caption: string
  story: string
  date: string | null
  year: number | null
  src: string
  mime: string
}

export type LocalMedia = LocalPhoto | LocalVideo

type RawEntry = Record<string, unknown> & { kind: string; src: string; thumb?: string }

const ALL: LocalMedia[] = (manifest as RawEntry[]).map((entry) => {
  if (entry.kind === 'video') {
    return { ...(entry as unknown as LocalVideo), src: asset(entry.src) }
  }
  return {
    ...(entry as unknown as LocalPhoto),
    src: asset(entry.src),
    thumb: asset(entry.thumb as string),
  }
})

/** Every photo and video, oldest first (undated ones at the end). */
export function getAllMedia(): LocalMedia[] {
  return ALL
}

/** Images only, oldest first. */
export function getPhotos(): LocalPhoto[] {
  return ALL.filter((m): m is LocalPhoto => m.kind === 'image')
}

export function getVideos(): LocalVideo[] {
  return ALL.filter((m): m is LocalVideo => m.kind === 'video')
}

/** Photos that are at least `minEdge` px on their short side and not extreme strips — good for crops in games. */
export function getGamePhotos(minEdge = 400): LocalPhoto[] {
  return getPhotos().filter((p) => Math.min(p.width, p.height) >= minEdge)
}

export function isPortrait(p: { width: number; height: number }): boolean {
  return p.height > p.width
}

/** Fisher–Yates shuffle that returns a new array. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function pickRandom<T>(items: readonly T[], count: number, random: () => number = Math.random): T[] {
  return shuffle(items, random).slice(0, Math.max(0, Math.min(count, items.length)))
}

/** Small deterministic PRNG so "photo of the day" style features are stable for a given seed. */
export function seededRandom(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

/** A seed that changes once per local calendar day. */
export function todaySeed(date = new Date()): number {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
}

/** Groups media by year; undated items land under `null`. Years ascending, null last. */
export function groupByYear<T extends { year: number | null }>(items: readonly T[]): { year: number | null; items: T[] }[] {
  const map = new Map<number | null, T[]>()
  for (const item of items) {
    const key = item.year ?? null
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return [...map.entries()]
    .sort(([a], [b]) => (a === null ? 1 : b === null ? -1 : a - b))
    .map(([year, list]) => ({ year, items: list }))
}

/** "December 31, 2023" — or null when the date is unknown. */
export function formatPhotoDate(date: string | null): string | null {
  if (!date) return null
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}
