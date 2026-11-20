'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface TypewriterOptions {
  /** Base speed in characters per second (long letters speed up automatically). */
  cps?: number
  /** Show everything immediately (reduced motion). */
  instant?: boolean
  /** Wait before the first character, in ms. */
  startDelay?: number
}

interface Typewriter {
  /** The part of the text that is already "typed". */
  visible: string
  /** The rest — render it invisibly so the layout never jumps. */
  rest: string
  done: boolean
  /** Reveal everything right now. */
  skip: () => void
}

/** Code-unit offsets after each grapheme, so emoji never get split mid-character. */
function graphemeOffsets(text: string): number[] {
  const offsets: number[] = []
  const Segmenter = (Intl as unknown as { Segmenter?: typeof Intl.Segmenter }).Segmenter
  if (Segmenter) {
    const seg = new Segmenter(undefined, { granularity: 'grapheme' })
    for (const part of seg.segment(text)) offsets.push(part.index + part.segment.length)
  } else {
    let i = 0
    for (const ch of text) {
      i += ch.length
      offsets.push(i)
    }
  }
  return offsets
}

/**
 * A quick, natural-feeling typewriter: brief pauses after punctuation and
 * line breaks, faster for long letters (so nothing takes longer than ~12s).
 * The component using it should be keyed by the text so it restarts cleanly.
 */
export function useTypewriter(text: string, { cps = 170, instant = false, startDelay = 380 }: TypewriterOptions = {}): Typewriter {
  const offsets = useMemo(() => graphemeOffsets(text), [text])
  const total = offsets.length
  const [count, setCount] = useState(instant ? total : 0)
  const skippedRef = useRef(instant)

  useEffect(() => {
    if (instant || total === 0) {
      skippedRef.current = true
      setCount(total)
      return
    }
    skippedRef.current = false

    // Cumulative reveal time (ms) for each grapheme.
    const speed = Math.max(cps, total / 9)
    const base = 1000 / speed
    const times = new Float64Array(total)
    let acc = 0
    let prevEnd = 0
    for (let i = 0; i < total; i++) {
      const ch = text.slice(prevEnd, offsets[i])
      prevEnd = offsets[i]
      acc += base
      if (ch === '.' || ch === '!' || ch === '?') acc += 110
      else if (ch === ',' || ch === ';' || ch === ':') acc += 45
      else if (ch === '\n') acc += 70
      times[i] = acc
    }

    let raf = 0
    let start = 0
    let idx = 0
    const step = (t: number) => {
      if (skippedRef.current) return
      if (!start) start = t
      const elapsed = t - start
      while (idx < total && times[idx] <= elapsed) idx++
      setCount((prev) => (idx > prev ? idx : prev))
      if (idx < total) raf = window.requestAnimationFrame(step)
    }
    const timer = window.setTimeout(() => {
      raf = window.requestAnimationFrame(step)
    }, startDelay)

    return () => {
      window.clearTimeout(timer)
      window.cancelAnimationFrame(raf)
    }
  }, [text, offsets, total, cps, instant, startDelay])

  const skip = useCallback(() => {
    skippedRef.current = true
    setCount(total)
  }, [total])

  const cut = count <= 0 ? 0 : offsets[Math.min(count, total) - 1]
  return {
    visible: text.slice(0, cut),
    rest: text.slice(cut),
    done: count >= total,
    skip,
  }
}
