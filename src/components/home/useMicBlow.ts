'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type MicStatus = 'idle' | 'requesting' | 'listening' | 'denied' | 'unsupported' | 'error'

/** How long the level must stay above the threshold to count as a puff. */
const PUFF_MS = 200
/** Quiet time after a puff before the next one can register. */
const COOLDOWN_MS = 480
/** Give up listening after this long so the mic never stays on by accident. */
const MAX_LISTEN_MS = 30000
const MIN_THRESHOLD = 0.1

/**
 * Listens to the microphone (only after an explicit start()) and calls
 * `onPuff(strength)` when she blows at the screen: the RMS level has to stay
 * over an adaptive threshold for ~200ms. Strong puffs report strength 2.
 *
 * `meterRef` can be attached to an element whose transform shows the live
 * level (scaleX 0…1) without re-rendering React on every frame.
 */
export function useMicBlow(onPuff: (strength: 1 | 2) => void) {
  const [status, setStatus] = useState<MicStatus>('idle')
  const meterRef = useRef<HTMLDivElement>(null)
  const onPuffRef = useRef(onPuff)
  const streamRef = useRef<MediaStream | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef(0)
  const timeoutRef = useRef<number | null>(null)
  const sessionRef = useRef(0)

  useEffect(() => {
    onPuffRef.current = onPuff
  }, [onPuff])

  const release = useCallback(() => {
    sessionRef.current += 1
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = 0
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    const ctx = ctxRef.current
    ctxRef.current = null
    if (ctx && ctx.state !== 'closed') void ctx.close().catch(() => {})
    if (meterRef.current) meterRef.current.style.transform = 'scaleX(0)'
  }, [])

  const stop = useCallback(() => {
    release()
    setStatus((s) => (s === 'listening' || s === 'requesting' ? 'idle' : s))
  }, [release])

  const start = useCallback(async () => {
    if (typeof window === 'undefined') return
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported')
      return
    }
    release()
    const session = sessionRef.current
    setStatus('requesting')
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        // Noise suppression would filter out exactly the sound we want to hear.
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      })
    } catch (err) {
      const name = err instanceof DOMException ? err.name : ''
      if (session !== sessionRef.current) return
      setStatus(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : name === 'NotFoundError' ? 'unsupported' : 'error')
      return
    }
    // Stopped or unmounted while the permission prompt was open.
    if (session !== sessionRef.current) {
      stream.getTracks().forEach((t) => t.stop())
      return
    }

    const AC: typeof AudioContext | undefined =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) {
      stream.getTracks().forEach((t) => t.stop())
      setStatus('unsupported')
      return
    }

    try {
      // Hand the stream to release() first, so a failing AudioContext still turns the mic off.
      streamRef.current = stream
      const ctx = new AC()
      ctxRef.current = ctx
      void ctx.resume().catch(() => {})
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 1024
      analyser.smoothingTimeConstant = 0.2
      source.connect(analyser) // never connected to the speakers: no feedback
      const buffer = new Float32Array(analyser.fftSize)

      let floor = 0.02
      let above = 0
      let peak = 0
      let cooldownUntil = 0
      let last = performance.now()

      const loop = (now: number) => {
        if (session !== sessionRef.current) return
        const dt = Math.min(100, now - last)
        last = now
        analyser.getFloatTimeDomainData(buffer)
        let sum = 0
        for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i]
        const rms = Math.sqrt(sum / buffer.length)
        const threshold = Math.max(MIN_THRESHOLD, floor * 3.5)

        if (meterRef.current) meterRef.current.style.transform = `scaleX(${Math.min(1, rms / (threshold * 2)).toFixed(3)})`

        if (rms < threshold) {
          floor = floor * 0.97 + rms * 0.03
          above = Math.max(0, above - dt * 2)
          peak = 0
        } else if (now > cooldownUntil) {
          above += dt
          peak = Math.max(peak, rms)
          if (above >= PUFF_MS) {
            onPuffRef.current(peak > threshold * 2.2 ? 2 : 1)
            above = 0
            peak = 0
            cooldownUntil = now + COOLDOWN_MS
          }
        }
        rafRef.current = requestAnimationFrame(loop)
      }

      setStatus('listening')
      rafRef.current = requestAnimationFrame(loop)
      timeoutRef.current = window.setTimeout(() => {
        release()
        setStatus('idle')
      }, MAX_LISTEN_MS)
    } catch {
      release()
      setStatus('error')
    }
  }, [release])

  useEffect(() => release, [release])

  return { status, start, stop, meterRef }
}
