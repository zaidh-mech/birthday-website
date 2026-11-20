'use client'

import { memo, useMemo } from 'react'
import type { WheelPrize } from '@/lib/siteConfig'
import { layoutLabel, polar, segmentColors, wedgePath } from './wheelMath'
import styles from './wheel.module.css'

/** Disc radius in SVG units (the rim SVG is 500 units wide; the disc sits inside it). */
export const DISC_R = 208

const PALETTE = [
  { key: 'rose', stops: ['#fda4af', '#f43f5e', '#be123c'], text: '#ffffff', outline: 'rgba(136,19,55,0.45)' },
  { key: 'blush', stops: ['#fff1f2', '#fecdd3', '#fb9fb0'], text: '#881337', outline: '' },
  { key: 'lavender', stops: ['#faf5ff', '#e9d5ff', '#c4b5fd'], text: '#4c1d95', outline: '' },
  { key: 'cream', stops: ['#fffdf8', '#fff1df', '#fbd5a5'], text: '#9f1239', outline: '' },
] as const

const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'

interface WheelDiscProps {
  prizes: WheelPrize[]
  winnerIndex: number | null
  idPrefix: string
}

function WheelDisc({ prizes, winnerIndex, idPrefix }: WheelDiscProps) {
  const count = prizes.length
  const seg = 360 / count
  const R = DISC_R
  const rStart = R * (count > 10 ? 0.3 : 0.27)
  const rEnd = R * 0.7

  const segments = useMemo(() => {
    const colors = segmentColors(count, PALETTE.length)
    return prizes.map((p, i) => ({
      prize: p,
      path: wedgePath(i, count, R),
      palette: PALETTE[colors[i]],
      layout: layoutLabel(p.label, count, R, rStart, rEnd),
    }))
  }, [prizes, count, R, rStart, rEnd])

  const pegs = useMemo(() => Array.from({ length: count }, (_, k) => polar(R - 9, k * seg)), [count, seg, R])

  return (
    <svg viewBox={`${-R} ${-R} ${R * 2} ${R * 2}`} className="block h-full w-full font-sans" aria-hidden="true" focusable="false">
      <defs>
        {PALETTE.map((p) => (
          <radialGradient key={p.key} id={`${idPrefix}-${p.key}`} cx="0" cy="0" r={R} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={p.stops[0]} />
            <stop offset="0.58" stopColor={p.stops[1]} />
            <stop offset="1" stopColor={p.stops[2]} />
          </radialGradient>
        ))}
        <radialGradient id={`${idPrefix}-peg`} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#fffbea" />
          <stop offset="0.45" stopColor="#fcd34d" />
          <stop offset="1" stopColor="#b45309" />
        </radialGradient>
      </defs>

      <circle r={R} fill="#fff" />

      {segments.map((s, i) => (
        <path key={`w-${s.prize.id}-${i}`} d={s.path} fill={`url(#${idPrefix}-${s.palette.key})`} stroke="rgba(255,255,255,0.92)" strokeWidth={2} strokeLinejoin="round" />
      ))}

      {winnerIndex !== null && winnerIndex < count && (
        <path d={wedgePath(winnerIndex, count, R)} fill="#ffffff" className={styles.winner} />
      )}

      <circle r={R - 17} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={1.6} strokeDasharray="0.5 7" strokeLinecap="round" />
      <circle r={R * 0.25} fill="rgba(255,255,255,0.35)" stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} />

      {segments.map((s, i) => {
        const { lines, fontSize, emojiSize } = s.layout
        const lineHeight = fontSize * 1.1
        return (
          <g key={`l-${s.prize.id}-${i}`} transform={`rotate(${Math.round((i + 0.5) * seg * 100) / 100})`}>
            <text
              x={0}
              y={-R * 0.845}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={emojiSize}
              style={{ fontFamily: EMOJI_FONT }}
            >
              {s.prize.emoji}
            </text>
            {lines.map((line, li) => (
              <text
                key={li}
                transform="rotate(-90)"
                x={rEnd}
                y={(li - (lines.length - 1) / 2) * lineHeight}
                textAnchor="end"
                dominantBaseline="central"
                fontSize={fontSize}
                fontWeight={700}
                letterSpacing={0.2}
                fill={s.palette.text}
                stroke={s.palette.outline || undefined}
                strokeWidth={s.palette.outline ? 2.2 : undefined}
                strokeLinejoin="round"
                paintOrder="stroke"
              >
                {line}
              </text>
            ))}
          </g>
        )
      })}

      {pegs.map(([x, y], k) => (
        <g key={`p-${k}`}>
          <circle cx={x} cy={y + 1.2} r={4.6} fill="rgba(0,0,0,0.18)" />
          <circle cx={x} cy={y} r={4.6} fill={`url(#${idPrefix}-peg)`} stroke="rgba(120,53,15,0.35)" strokeWidth={0.8} />
        </g>
      ))}
    </svg>
  )
}

export default memo(WheelDisc)
