'use client'

import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'

/**
 * Favourite memories (the little hearts), kept in this browser's
 * localStorage and shared live between the grid, the lightbox and the hero.
 */

const KEY = 'birthday_memories_favourites'
const EMPTY: string[] = []
let cache: string[] | null = null
const listeners = new Set<() => void>()

function read(): string[] {
  if (cache) return cache
  if (typeof window === 'undefined') return EMPTY
  try {
    const raw = window.localStorage.getItem(KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    cache = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    cache = []
  }
  return cache
}

function write(next: string[]) {
  cache = next
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* storage may be blocked — favourites still work for this visit */
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useFavourites() {
  const list = useSyncExternalStore(subscribe, read, () => EMPTY)
  const set = useMemo(() => new Set(list), [list])

  // Keep several open tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return
      cache = null
      listeners.forEach((l) => l())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  /** Toggles a favourite; returns true when it is now a favourite. */
  const toggle = useCallback((id: string): boolean => {
    const current = read()
    const has = current.includes(id)
    write(has ? current.filter((x) => x !== id) : [...current, id])
    return !has
  }, [])

  const isFavourite = useCallback((id: string) => set.has(id), [set])

  return { favourites: set, count: list.length, isFavourite, toggle }
}
