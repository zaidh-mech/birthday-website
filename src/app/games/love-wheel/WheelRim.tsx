'use client'

import { memo } from 'react'
import { polar } from './wheelMath'
import styles from './wheel.module.css'

/** The static outer frame: a metallic rim with little bulbs that twinkle (and chase while spinning). */

const RIM_MID = 226
const RIM_WIDTH = 36
const BULBS = 24
const TWINKLE_S = 2.6
const CHASE_S = 0.75

const BULB_POSITIONS = Array.from({ length: BULBS }, (_, i) => polar(RIM_MID, (i * 360) / BULBS + 360 / BULBS / 2))

const RIM_LIGHT = [
  [0, '#fff1f2'],
  [0.18, '#fda4af'],
  [0.36, '#e11d48'],
  [0.54, '#fecdd3'],
  [0.74, '#be123c'],
  [1, '#fda4af'],
] as const

const RIM_DARK = [
  [0, '#ede9fe'],
  [0.18, '#a78bfa'],
  [0.36, '#5b21b6'],
  [0.54, '#c4b5fd'],
  [0.74, '#4c1d95'],
  [1, '#a78bfa'],
] as const

function WheelRim({ spinning, idPrefix }: { spinning: boolean; idPrefix: string }) {
  return (
    <svg viewBox="-250 -250 500 500" className={`absolute inset-0 block h-full w-full ${spinning ? styles.spinning : ''}`} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${idPrefix}-rim-light`} x1="0" y1="0" x2="1" y2="1">
          {RIM_LIGHT.map(([o, c]) => (
            <stop key={o} offset={o} stopColor={c} />
          ))}
        </linearGradient>
        <linearGradient id={`${idPrefix}-rim-dark`} x1="0" y1="0" x2="1" y2="1">
          {RIM_DARK.map(([o, c]) => (
            <stop key={o} offset={o} stopColor={c} />
          ))}
        </linearGradient>
        <radialGradient id={`${idPrefix}-bulb`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fffbeb" stopOpacity="1" />
          <stop offset="0.35" stopColor="#fde68a" stopOpacity="0.95" />
          <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* soft contact shadow */}
      <circle cx="0" cy="5" r="246" fill="rgba(76,5,25,0.16)" />

      <circle r={RIM_MID} fill="none" strokeWidth={RIM_WIDTH} stroke={`url(#${idPrefix}-rim-light)`} className="dark:hidden" />
      <circle r={RIM_MID} fill="none" strokeWidth={RIM_WIDTH} stroke={`url(#${idPrefix}-rim-dark)`} className="hidden dark:inline" />
      <circle r={RIM_MID + RIM_WIDTH / 2 - 0.8} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={1.4} />
      <circle r={RIM_MID - RIM_WIDTH / 2 + 0.8} fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth={1.6} />

      {BULB_POSITIONS.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <circle r={6.4} fill="rgba(76,5,25,0.35)" />
          <g
            className={styles.bulb}
            style={{
              animationDelay: spinning ? `${-((1 - i / BULBS) * CHASE_S).toFixed(3)}s` : `${-((i * 0.53) % TWINKLE_S).toFixed(2)}s`,
            }}
          >
            <circle r={10} fill={`url(#${idPrefix}-bulb)`} />
            <circle r={3.8} fill="#fffbeb" />
          </g>
        </g>
      ))}
    </svg>
  )
}

export default memo(WheelRim)
