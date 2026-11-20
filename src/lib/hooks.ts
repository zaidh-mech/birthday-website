'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

/** true after the first client render — use to avoid hydration mismatches for browser-only values. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}

/** Subscribes to a CSS media query. Returns `fallback` during SSR. */
export function useMediaQuery(query: string, fallback = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {}
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : fallback),
    () => fallback,
  )
}

/** Touch-first device (phones/tablets). Hover effects should have tap equivalents when this is true. */
export function useIsCoarsePointer(): boolean {
  return useMediaQuery('(pointer: coarse)')
}

/** Desktop-style mouse that can hover. */
export function useCanHover(): boolean {
  return useMediaQuery('(hover: hover) and (pointer: fine)')
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

/** setInterval that always calls the latest callback; pass `null` to pause. */
export function useInterval(callback: () => void, delay: number | null): void {
  const saved = useRef(callback)
  useEffect(() => {
    saved.current = callback
  }, [callback])
  useEffect(() => {
    if (delay === null) return
    const id = window.setInterval(() => saved.current(), delay)
    return () => window.clearInterval(id)
  }, [delay])
}

/** useState mirrored to localStorage (JSON). Safe when storage is blocked. */
export function useLocalStorageState<T>(key: string, initial: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(initial)
  const loaded = useRef(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw !== null) setValue(JSON.parse(raw) as T)
    } catch {
      /* ignore */
    }
    loaded.current = true
  }, [key])

  useEffect(() => {
    if (!loaded.current) return
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* ignore */
    }
  }, [key, value])

  return [value, setValue]
}

/** Seconds elapsed while `running` is true. */
export function useStopwatch(running: boolean): [number, () => void] {
  const [seconds, setSeconds] = useState(0)
  useInterval(() => setSeconds((s) => s + 1), running ? 1000 : null)
  return [seconds, () => setSeconds(0)]
}

export function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
