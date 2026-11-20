'use client'

import { useId, type KeyboardEvent } from 'react'
import styles from './Cake.module.css'

/* ---------- geometry (viewBox 0 0 360 330) ---------- */

const CX = 180

interface Tier {
  rx: number
  ry: number
  top: number
  bottom: number
}

const T1: Tier = { rx: 135, ry: 22, top: 200, bottom: 292 }
const T2: Tier = { rx: 88, ry: 15, top: 132, bottom: 200 }

/** [centre (-1…1 across the tier), length, half width] */
type Drip = [number, number, number]

/** Frosting = the whole top ellipse plus a dripping band along its front edge. */
function frostingPath(t: Tier, drips: Drip[], base: number): string {
  const left = CX - t.rx
  const right = CX + t.rx
  const pts: string[] = []
  for (let x = left; x <= right + 0.01; x += 2) {
    const u = (x - CX) / t.rx
    const edge = Math.sqrt(Math.max(0, 1 - u * u))
    let extra = 0
    for (const [c, len, hw] of drips) {
      const dx = (x - (CX + c * t.rx)) / hw
      if (Math.abs(dx) < 1) extra = Math.max(extra, len * Math.sqrt(1 - dx * dx))
    }
    pts.push(`${x.toFixed(1)},${(t.top + t.ry * edge + (base + extra) * edge).toFixed(1)}`)
  }
  return `M${left},${t.top} L${pts.join(' L')} L${right},${t.top} A${t.rx} ${t.ry} 0 0 0 ${left} ${t.top} Z`
}

/** Cylinder side: straight walls with a rounded bottom edge. */
function bodyPath(t: Tier): string {
  return `M${CX - t.rx},${t.top} L${CX - t.rx},${t.bottom} A${t.rx} ${t.ry} 0 0 0 ${CX + t.rx},${t.bottom} L${CX + t.rx},${t.top} Z`
}

function heartPath(x: number, y: number, s: number): string {
  const t = y - s / 2
  return `M${x},${t + s * 0.3} C${x},${t} ${x - s * 0.5},${t} ${x - s * 0.5},${t + s * 0.3} C${x - s * 0.5},${t + s * 0.6} ${x},${t + s * 0.78} ${x},${t + s} C${x},${t + s * 0.78} ${x + s * 0.5},${t + s * 0.6} ${x + s * 0.5},${t + s * 0.3} C${x + s * 0.5},${t} ${x},${t} ${x},${t + s * 0.3} Z`
}

function frontEdge(t: Tier, y: number, u: number): number {
  return y + t.ry * Math.sqrt(Math.max(0, 1 - u * u))
}

const T1_FROSTING = frostingPath(
  T1,
  [
    [-0.84, 10, 8],
    [-0.58, 22, 10],
    [-0.3, 13, 9],
    [-0.02, 27, 11],
    [0.27, 15, 9],
    [0.54, 24, 10],
    [0.82, 12, 8],
  ],
  7,
)
const T2_FROSTING = frostingPath(
  T2,
  [
    [-0.72, 12, 7],
    [-0.34, 19, 8],
    [0.06, 11, 7],
    [0.42, 18, 8],
    [0.78, 9, 6],
  ],
  5,
)
const T1_BODY = bodyPath(T1)
const T2_BODY = bodyPath(T2)

const PEARLS_T1 = Array.from({ length: 15 }, (_, k) => {
  const u = -0.93 + k * (1.86 / 14)
  return { x: CX + u * T1.rx, y: frontEdge(T1, T1.bottom, u) - 3 }
})
const PEARLS_T2 = Array.from({ length: 11 }, (_, k) => {
  const u = -0.92 + k * (1.84 / 10)
  return { x: CX + u * T2.rx, y: frontEdge(T2, T2.bottom, u) - 2 }
})
const SIDE_HEARTS = [-0.84, -0.64, 0.64, 0.84].map((u) => ({ x: CX + u * T1.rx, y: 258 + 12 * Math.sqrt(1 - u * u) }))
const SPRINKLES: [number, number, number, string][] = [
  [108, 186, 25, '#f472b6'],
  [124, 197, -35, '#60a5fa'],
  [141, 180, 55, '#facc15'],
  [160, 196, -15, '#34d399'],
  [200, 196, 30, '#a78bfa'],
  [219, 180, -50, '#f472b6'],
  [236, 195, 20, '#facc15'],
  [252, 183, -30, '#60a5fa'],
]

const CANDLE_COLORS = ['#fda4af', '#c4b5fd', '#fde68a', '#93c5fd', '#86efac', '#f9a8d4', '#fdba74']
const CANDLE_H = 44

function candleLayout(n: number) {
  const spacing = n > 1 ? Math.min(30, 136 / (n - 1)) : 0
  return Array.from({ length: n }, (_, i) => {
    const x = CX + (i - (n - 1) / 2) * spacing
    const u = (x - CX) / T2.rx
    const y = T2.top + (i % 2 === 0 ? 4 : -3) * Math.sqrt(Math.max(0, 1 - u * u))
    return { i, x, y, color: CANDLE_COLORS[i % CANDLE_COLORS.length], halfHit: Math.max(12, spacing / 2) }
  }).sort((a, b) => a.y - b.y)
}

/* ---------- component ---------- */

interface CakeSvgProps {
  lit: boolean[]
  /** Increment an entry to replay that candle's smoke */
  smoke: number[]
  label: string
  onBlow: (index: number) => void
}

export default function CakeSvg({ lit, smoke, label, onBlow }: CakeSvgProps) {
  const p = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const candles = candleLayout(lit.length)
  const url = (name: string) => `url(#${p}-${name})`

  const onKey = (e: KeyboardEvent<SVGGElement>, i: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onBlow(i)
    }
  }

  return (
    <svg viewBox="0 0 360 330" className="h-auto w-full overflow-visible" role="group" aria-label={`Birthday cake with ${lit.length} candles`}>
      <defs>
        <linearGradient id={`${p}-t1`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#f472b6" />
          <stop offset="0.18" stopColor="#f9a8d4" />
          <stop offset="0.5" stopColor="#fbcfe8" />
          <stop offset="0.82" stopColor="#f9a8d4" />
          <stop offset="1" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id={`${p}-t2`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#efc3a4" />
          <stop offset="0.2" stopColor="#fde7d4" />
          <stop offset="0.5" stopColor="#fff7ed" />
          <stop offset="0.8" stopColor="#fde7d4" />
          <stop offset="1" stopColor="#e6ae8e" />
        </linearGradient>
        <linearGradient id={`${p}-f1`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fbe3d2" />
          <stop offset="0.5" stopColor="#fffaf3" />
          <stop offset="1" stopColor="#f8dcc8" />
        </linearGradient>
        <linearGradient id={`${p}-f2`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#e11d48" />
          <stop offset="0.45" stopColor="#fb7185" />
          <stop offset="1" stopColor="#e11d48" />
        </linearGradient>
        <pattern id={`${p}-stripes`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="2.6" height="7" fill="#ffffff" opacity="0.6" />
        </pattern>
        <linearGradient id={`${p}-shade`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#000000" stopOpacity="0.16" />
          <stop offset="0.38" stopColor="#ffffff" stopOpacity="0.2" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.2" />
        </linearGradient>
        <radialGradient id={`${p}-glow`}>
          <stop offset="0" stopColor="#fde047" stopOpacity="0.85" />
          <stop offset="0.38" stopColor="#fbbf24" stopOpacity="0.32" />
          <stop offset="1" stopColor="#fb923c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${p}-flame`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#f97316" />
          <stop offset="0.55" stopColor="#fb923c" />
          <stop offset="1" stopColor="#fde047" />
        </linearGradient>
        <linearGradient id={`${p}-flameIn`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#fef08a" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
      </defs>

      {/* plate */}
      <ellipse cx={CX} cy={302} rx={170} ry={25} className="fill-rose-200/50 dark:fill-white/10" />
      <ellipse cx={CX} cy={297} rx={160} ry={20} className="fill-white dark:fill-slate-600" />
      <ellipse cx={CX} cy={295} rx={142} ry={15} fill="#000000" opacity="0.08" />

      {/* bottom tier */}
      <path d={T1_BODY} fill={url('t1')} />
      {SIDE_HEARTS.map((h, k) => (
        <path key={k} d={heartPath(h.x, h.y, 11)} fill="#ffffff" opacity="0.85" />
      ))}
      <text x={CX} y={266} textAnchor="middle" className="font-cursive" fontSize="22" fill="#be185d">
        {label}
      </text>
      {PEARLS_T1.map((pt, k) => (
        <g key={k}>
          <circle cx={pt.x} cy={pt.y} r={4.4} fill="#fffaf3" />
          <circle cx={pt.x - 1.3} cy={pt.y - 1.4} r={1.3} fill="#ffffff" />
        </g>
      ))}
      <path d={T1_FROSTING} fill={url('f1')} />

      {/* top tier */}
      <ellipse cx={CX} cy={T2.bottom + 2} rx={T2.rx + 4} ry={T2.ry + 2} fill="#000000" opacity="0.07" />
      <path d={T2_BODY} fill={url('t2')} />
      {SPRINKLES.map(([x, y, r, c], k) => (
        <rect key={k} x={x - 4} y={y - 1.3} width={8} height={2.6} rx={1.3} fill={c} transform={`rotate(${r} ${x} ${y})`} />
      ))}
      <path d={heartPath(CX, 186, 15)} fill="#fb7185" />
      {PEARLS_T2.map((pt, k) => (
        <circle key={k} cx={pt.x} cy={pt.y} r={3.2} fill="#ffffff" />
      ))}
      <path d={T2_FROSTING} fill={url('f2')} />
      <ellipse cx={CX - 20} cy={T2.top - 4} rx={46} ry={5} fill="#ffffff" opacity="0.18" />

      {/* candles */}
      {candles.map((c) => {
        const on = lit[c.i]
        const top = c.y - CANDLE_H
        return (
          <g
            key={c.i}
            className={styles.candle}
            role="button"
            tabIndex={on ? 0 : -1}
            aria-label={on ? `Blow out candle ${c.i + 1}` : `Candle ${c.i + 1} is blown out`}
            aria-disabled={!on}
            onClick={() => onBlow(c.i)}
            onKeyDown={(e) => onKey(e, c.i)}
          >
            <rect x={c.x - c.halfHit} y={top - 44} width={c.halfHit * 2} height={CANDLE_H + 46} fill="transparent" />
            <rect
              className={styles.focusRing}
              x={c.x - c.halfHit + 1}
              y={top - 42}
              width={c.halfHit * 2 - 2}
              height={CANDLE_H + 44}
              rx={8}
              fill="none"
              stroke="#f43f5e"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
            <ellipse cx={c.x} cy={c.y} rx={7} ry={2.4} fill="#000000" opacity="0.15" />
            <rect x={c.x - 5} y={top} width={10} height={CANDLE_H} rx={2.5} fill={c.color} />
            <rect x={c.x - 5} y={top} width={10} height={CANDLE_H} rx={2.5} fill={url('stripes')} />
            <rect x={c.x - 5} y={top} width={10} height={CANDLE_H} rx={2.5} fill={url('shade')} />
            <ellipse cx={c.x} cy={top} rx={5} ry={1.8} fill="#ffffff" opacity="0.55" />
            <path d={`M${c.x},${top} Q${c.x + 1.2},${top - 3} ${c.x},${top - 6}`} fill="none" stroke={on ? '#57534e' : '#1c1917'} strokeWidth={1.6} strokeLinecap="round" />

            <g transform={`translate(${c.x} ${top - 5})`}>
              <g className={`${styles.glowWrap} ${on ? '' : styles.glowOut}`}>
                <circle cx={0} cy={-12} r={24} fill={url('glow')} className={styles.glow} style={{ animationDelay: `${-c.i * 0.37}s` }} />
              </g>
              <g className={`${styles.flameWrap} ${on ? '' : styles.flameOut}`}>
                <g className={styles.flame} style={{ animationDelay: `${-c.i * 0.23}s`, animationDuration: `${1.2 + (c.i % 3) * 0.25}s` }}>
                  <path d="M0,0 C-7,-5 -8,-16 0,-30 C8,-16 7,-5 0,0 Z" fill={url('flame')} />
                  <path d="M0,-1 C-3.6,-4 -4.2,-11 0,-19 C4.2,-11 3.6,-4 0,-1 Z" fill={url('flameIn')} />
                  <ellipse cx={0} cy={-2.5} rx={2.4} ry={3} fill="#60a5fa" opacity="0.55" />
                </g>
              </g>
              {!on && smoke[c.i] > 0 && (
                <g key={smoke[c.i]} className={styles.smoke}>
                  <path d="M0,-2 C-5,-10 5,-16 0,-24 C-5,-32 4,-38 0,-46" />
                  <path d="M2,-4 C7,-12 -2,-18 3,-27 C8,-34 0,-40 4,-50" />
                  <path d="M-2,-4 C-7,-13 2,-20 -3,-28 C-8,-35 -1,-42 -4,-52" />
                </g>
              )}
            </g>
          </g>
        )
      })}
    </svg>
  )
}
