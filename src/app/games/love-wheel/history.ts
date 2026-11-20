'use client'

import { getGameData, setGameData } from '@/lib/gameStorage'
import type { WheelPrize } from '@/lib/siteConfig'

/** One prize won on the wheel, kept on this device ("Your winnings"). */
export interface WinEntry {
  id: string
  prizeId: string
  emoji: string
  label: string
  detail: string
  /** ISO timestamp */
  at: string
}

export const HISTORY_LIMIT = 5

function isEntry(v: unknown): v is WinEntry {
  if (!v || typeof v !== 'object') return false
  const e = v as Record<string, unknown>
  return typeof e.id === 'string' && typeof e.label === 'string' && typeof e.emoji === 'string' && typeof e.at === 'string'
}

export function readHistory(): WinEntry[] {
  const raw = getGameData<unknown>('love-wheel', 'history', [])
  if (!Array.isArray(raw)) return []
  return raw
    .filter(isEntry)
    .map((e) => ({ ...e, prizeId: String(e.prizeId ?? ''), detail: String(e.detail ?? '') }))
    .slice(0, HISTORY_LIMIT)
}

export function saveHistory(list: WinEntry[]): void {
  setGameData('love-wheel', 'history', list.slice(0, HISTORY_LIMIT))
}

export function makeEntry(prize: WheelPrize): WinEntry {
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    prizeId: prize.id,
    emoji: prize.emoji,
    label: prize.label,
    detail: prize.detail,
    at: new Date().toISOString(),
  }
}

export function claimMessage(prize: { emoji: string; label: string }): string {
  return `I just won ${prize.emoji} ${prize.label} on the Wheel of Love! Pay up 😘`
}
