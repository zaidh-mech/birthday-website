import type { Memory } from '@/data/initialData'
import { asset } from '@/lib/basePath'
import { formatPhotoDate, type LocalMedia } from '@/lib/photos'

/**
 * One thing that can be shown in the lightbox / slideshow — either one of our
 * local photos (or the video) or an album upload from the cloud.
 */
export interface ViewerItem {
  /** Stable key, also used for favourites */
  id: string
  kind: 'image' | 'video'
  /** Full-size file (already base-path prefixed) */
  src: string
  /** Small version for grids / ambient backgrounds */
  thumb: string | null
  /** Tiny base64 placeholder */
  blur: string | null
  /** Dominant colour, e.g. "#a0522d" */
  color: string | null
  title: string
  description: string
  /** Human readable date, or null when unknown */
  dateLabel: string | null
  year: number | null
  width: number | null
  height: number | null
  downloadName: string
  mime?: string
}

export function fromLocalMedia(media: LocalMedia): ViewerItem {
  if (media.kind === 'video') {
    return {
      id: media.id,
      kind: 'video',
      src: media.src,
      thumb: null,
      blur: null,
      color: null,
      title: media.caption || 'A little moving memory',
      description: media.story,
      dateLabel: formatPhotoDate(media.date),
      year: media.year,
      width: null,
      height: null,
      downloadName: `${media.id}.mp4`,
      mime: media.mime,
    }
  }
  return {
    id: media.id,
    kind: 'image',
    src: media.src,
    thumb: media.thumb,
    blur: media.blur,
    color: media.color,
    title: media.caption,
    description: media.story,
    dateLabel: formatPhotoDate(media.date),
    year: media.year,
    width: media.width,
    height: media.height,
    downloadName: `${media.id}.webp`,
  }
}

function fileNameFromUrl(url: string, fallback: string): string {
  try {
    const clean = url.split(/[?#]/)[0]
    const last = clean.substring(clean.lastIndexOf('/') + 1)
    return last && /\.[a-z0-9]{2,5}$/i.test(last) ? decodeURIComponent(last) : fallback
  } catch {
    return fallback
  }
}

export function fromAlbumMemory(memory: Memory): ViewerItem {
  const src = asset(memory.imagePath)
  const date = memory.date ? new Date(memory.date) : null
  const valid = date && !Number.isNaN(date.getTime()) ? date : null
  return {
    id: `album:${memory.id}`,
    kind: 'image',
    src,
    thumb: src,
    blur: null,
    color: null,
    title: memory.title,
    description: memory.caption,
    dateLabel: valid ? valid.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : null,
    year: valid ? valid.getFullYear() : null,
    width: null,
    height: null,
    downloadName: fileNameFromUrl(memory.imagePath, `memory-${memory.id}.jpg`),
  }
}

/** Small, stable string hash (FNV-1a). */
export function hashString(value: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Deterministic "hand-placed" rotation in degrees for a card. */
export function tiltFor(id: string, range = 2.4): number {
  const n = (hashString(id) % 1000) / 999 // 0..1
  const deg = (n * 2 - 1) * range
  // Avoid almost-straight cards so every print feels placed by hand.
  return Math.abs(deg) < 0.5 ? (deg < 0 ? -0.8 : 0.8) : Math.round(deg * 10) / 10
}

const ROSE: [number, number, number] = [251, 113, 133]

function mix(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)]
}

/**
 * Turns a photo's dominant colour into a pleasant glow colour ("r, g, b").
 * Near-black (Snapchat borders) and grey photos are pulled towards rose so the
 * glow never looks muddy.
 */
export function glowRgb(hex: string | null | undefined): string {
  if (!hex || !/^#?[0-9a-f]{6}$/i.test(hex)) return ROSE.join(', ')
  const n = parseInt(hex.replace('#', ''), 16)
  const rgb: [number, number, number] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  const max = Math.max(...rgb)
  const min = Math.min(...rgb)
  const lum = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255
  const sat = max === 0 ? 0 : (max - min) / max
  let out: [number, number, number]
  if (lum < 0.16) out = ROSE
  else if (sat < 0.14) out = mix(rgb, ROSE, 0.6)
  else out = mix(rgb, ROSE, 0.2)
  return out.join(', ')
}

/** Height / width, clamped so very tall phone shots don't become ribbons. */
export function cardRatio(item: ViewerItem, min = 0.62, max = 1.55): number {
  if (item.kind === 'video') return max
  if (!item.width || !item.height) return 1.25
  return Math.min(max, Math.max(min, item.height / item.width))
}
