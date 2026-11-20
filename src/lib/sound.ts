'use client'

import { useSyncExternalStore } from 'react'

/**
 * Tiny synthesized sound effects (WebAudio, no audio files).
 *
 *   import { sfx, useSoundEnabled } from '@/lib/sound'
 *   sfx.pop()
 *
 * Effects respect the global mute toggle (persisted in localStorage).
 * `playHappyBirthday()` is an explicit "play the song" action, so it plays
 * even when effects are muted. All calls are safe on the server and fail
 * silently when audio isn't available.
 */

const STORAGE_KEY = 'birthday_sound_enabled'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let enabledCache: boolean | null = null
const listeners = new Set<() => void>()

function readEnabled(): boolean {
  if (enabledCache !== null) return enabledCache
  if (typeof window === 'undefined') return true
  try {
    enabledCache = window.localStorage.getItem(STORAGE_KEY) !== 'false'
  } catch {
    enabledCache = true
  }
  return enabledCache
}

export function isSoundEnabled(): boolean {
  return readEnabled()
}

export function setSoundEnabled(value: boolean): void {
  enabledCache = value
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false')
  } catch {
    /* storage may be blocked */
  }
  listeners.forEach((l) => l())
}

export function toggleSound(): boolean {
  const next = !readEnabled()
  setSoundEnabled(next)
  if (next) sfx.chime()
  return next
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** React hook: `const [enabled, setEnabled] = useSoundEnabled()` */
export function useSoundEnabled(): [boolean, (value: boolean) => void] {
  const enabled = useSyncExternalStore(subscribe, readEnabled, () => true)
  return [enabled, setSoundEnabled]
}

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const AC: typeof AudioContext | undefined =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AC) return null
      ctx = new AC()
      master = ctx.createGain()
      master.gain.value = 0.32
      master.connect(ctx.destination)
    }
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {})
    return ctx
  } catch {
    return null
  }
}

interface ToneOptions {
  freq: number
  /** seconds from now */
  at?: number
  duration?: number
  type?: OscillatorType
  gain?: number
  slideTo?: number
  attack?: number
}

function tone({ freq, at = 0, duration = 0.15, type = 'sine', gain = 0.3, slideTo, attack = 0.004 }: ToneOptions, force = false) {
  if (!force && !readEnabled()) return
  const ac = getContext()
  if (!ac || !master) return
  const t0 = ac.currentTime + at
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + duration)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(g)
  g.connect(master)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

/** Bell-ish note: fundamental plus a quiet octave harmonic with a long decay. */
function bell(freq: number, at = 0, duration = 0.9, gain = 0.22, force = false) {
  tone({ freq, at, duration, type: 'sine', gain, attack: 0.003 }, force)
  tone({ freq: freq * 2, at, duration: duration * 0.6, type: 'sine', gain: gain * 0.35, attack: 0.003 }, force)
  tone({ freq: freq * 3.01, at, duration: duration * 0.3, type: 'triangle', gain: gain * 0.08, attack: 0.002 }, force)
}

function noiseBurst(duration = 0.18, gain = 0.15, filterFreq = 1800) {
  if (!readEnabled()) return
  const ac = getContext()
  if (!ac || !master) return
  const length = Math.floor(ac.sampleRate * duration)
  const buffer = ac.createBuffer(1, length, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length)
  const src = ac.createBufferSource()
  src.buffer = buffer
  const filter = ac.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = filterFreq
  const g = ac.createGain()
  g.gain.value = gain
  src.connect(filter)
  filter.connect(g)
  g.connect(master)
  src.start()
}

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12)

export const sfx = {
  /** Bubble / balloon pop */
  pop: () => tone({ freq: 720, slideTo: 180, duration: 0.09, type: 'sine', gain: 0.35 }),
  /** Card flip */
  flip: () => tone({ freq: 420, slideTo: 880, duration: 0.07, type: 'triangle', gain: 0.18 }),
  /** Soft UI tick (wheel pegs, keyboard taps) */
  tick: () => tone({ freq: 1500, duration: 0.025, type: 'square', gain: 0.05 }),
  /** Gentle confirmation */
  chime: () => {
    bell(midi(88), 0, 0.6, 0.16)
    bell(midi(95), 0.08, 0.8, 0.12)
  },
  /** A pair matched / item caught */
  match: () => {
    tone({ freq: midi(83), duration: 0.09, type: 'triangle', gain: 0.2 })
    tone({ freq: midi(88), at: 0.08, duration: 0.18, type: 'triangle', gain: 0.2 })
  },
  /** Something sparkly */
  sparkle: () => {
    ;[96, 100, 103, 108].forEach((n, i) => tone({ freq: midi(n), at: i * 0.045, duration: 0.12, type: 'sine', gain: 0.07 }))
  },
  /** Wrong answer / miss — soft, not harsh */
  miss: () => tone({ freq: 240, slideTo: 140, duration: 0.22, type: 'triangle', gain: 0.18 }),
  /** Short whoosh (opening things, page swooshes) */
  whoosh: () => noiseBurst(0.22, 0.12, 1200),
  /** Level up / win fanfare */
  win: () => {
    ;[72, 76, 79, 84].forEach((n, i) => bell(midi(n), i * 0.11, 0.9, 0.16))
    bell(midi(88), 0.48, 1.4, 0.14)
  },
  /** Scratching sound for scratch cards (call repeatedly while scratching) */
  scratch: () => noiseBurst(0.05, 0.05, 3500),
}

// "Happy Birthday to You" — the melody is in the public domain.
const HAPPY_BIRTHDAY: [number, number][] = [
  [67, 0.75], [67, 0.25], [69, 1], [67, 1], [72, 1], [71, 2],
  [67, 0.75], [67, 0.25], [69, 1], [67, 1], [74, 1], [72, 2],
  [67, 0.75], [67, 0.25], [79, 1], [76, 1], [72, 1], [71, 1], [69, 2],
  [77, 0.75], [77, 0.25], [76, 1], [72, 1], [74, 1], [72, 3],
]

let melodyTimer: number | null = null

/**
 * Plays "Happy Birthday" as a music box. Returns the total duration in ms.
 * `onNote` is called with the index of each note as it plays (for visualizers).
 */
export function playHappyBirthday(onNote?: (index: number) => void, bpm = 112): number {
  stopMelody()
  const ac = getContext()
  if (!ac) return 0
  const beat = 60 / bpm
  let t = 0.05
  const timeouts: number[] = []
  HAPPY_BIRTHDAY.forEach(([note, beats], i) => {
    bell(midi(note + 12), t, Math.max(0.5, beats * beat * 1.4), 0.2, true)
    if (onNote) timeouts.push(window.setTimeout(() => onNote(i), t * 1000))
    t += beats * beat
  })
  const total = Math.round(t * 1000)
  melodyTimer = window.setTimeout(() => {
    melodyTimer = null
  }, total)
  activeTimeouts = timeouts
  return total
}

let activeTimeouts: number[] = []

export function stopMelody(): void {
  if (melodyTimer !== null) window.clearTimeout(melodyTimer)
  melodyTimer = null
  activeTimeouts.forEach((t) => window.clearTimeout(t))
  activeTimeouts = []
  // Notes already scheduled on the audio clock fade out on their own within ~1s.
}

export const HAPPY_BIRTHDAY_NOTE_COUNT = HAPPY_BIRTHDAY.length

/** Light haptic feedback on phones that support it. */
export function haptic(pattern: number | number[] = 12): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return
  try {
    navigator.vibrate(pattern)
  } catch {
    /* ignore */
  }
}
