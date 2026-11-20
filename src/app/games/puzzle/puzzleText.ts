import { format } from 'date-fns'
import type { LocalPhoto } from '@/lib/photos'

/**
 * "December 31, 2023" for a photo. Uses a fixed English format (not the
 * browser locale) so the prerendered HTML and the client agree.
 */
export function photoDateLabel(photo: Pick<LocalPhoto, 'date'>, fallback: string | null = 'A memory of us'): string | null {
  if (!photo.date) return fallback
  const d = new Date(photo.date)
  if (Number.isNaN(d.getTime())) return fallback
  return format(d, 'MMMM d, yyyy')
}

export const WIN_TITLES = ['Perfect fit!', 'Pieced together!', 'Memory restored!', 'All in place!'] as const

export const WIN_MESSAGES: ((nick: string) => string)[] = [
  (nick) => `Every piece found its place, ${nick}. Just like you did in my life.`,
  (nick) => `Piece by piece, ${nick}. That's exactly how we built us.`,
  (nick) => `You put our memory back together, ${nick}. You always fix my world.`,
  (nick) => `A perfect fit, like your hand in mine, ${nick}.`,
  (nick) => `Look at us, ${nick}. Whole again, and smiling.`,
]

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}
