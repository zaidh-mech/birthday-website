'use client'

import { useId } from 'react'
import { seededRandom } from '@/lib/photos'

/* viewBox 0 0 220 260 */
const BODY =
  'M74 50 L74 62 C74 72 36 76 34 98 L32 214 C32 234 46 244 66 244 L154 244 C174 244 188 234 188 214 L186 98 C184 76 146 72 146 62 L146 50 Z'

const NOTE_COLORS = ['#fde68a', '#fbcfe8', '#bae6fd', '#ddd6fe', '#bbf7d0', '#fecdd3', '#fed7aa']

interface NoteShape {
  x: number
  y: number
  rotate: number
  color: string
  heart: boolean
}

/** Folded notes packed from the bottom of the jar upwards (deterministic). */
const NOTES: NoteShape[] = (() => {
  const rnd = seededRandom(1405)
  const out: NoteShape[] = []
  for (let row = 0; row < 8; row++) {
    const y = 228 - row * 14
    const offset = row % 2 === 0 ? 0 : 12
    for (let col = 0; col < 6; col++) {
      const x = 52 + offset + col * 24 + (rnd() - 0.5) * 8
      if (x > 172) continue
      out.push({
        x,
        y: y + (rnd() - 0.5) * 6,
        rotate: (rnd() - 0.5) * 80,
        color: NOTE_COLORS[Math.floor(rnd() * NOTE_COLORS.length)],
        heart: rnd() < 0.18,
      })
    }
  }
  return out
})()

export const JAR_NOTE_CAPACITY = NOTES.length

/** An illustrated glass jar full of folded paper notes. `filled` is 0…1. */
export default function JarSvg({ filled }: { filled: number }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const visible = filled <= 0 ? 0 : Math.max(3, Math.round(NOTES.length * Math.min(1, filled)))

  return (
    <svg viewBox="0 0 220 260" className="h-auto w-full overflow-visible" aria-hidden>
      <defs>
        <clipPath id={`${id}-inside`}>
          <path d={BODY} transform="translate(110 147) scale(0.95) translate(-110 -147)" />
        </clipPath>
        <linearGradient id={`${id}-glass`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="0.3" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="0.75" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* shadow */}
      <ellipse cx="110" cy="248" rx="78" ry="8" fill="#000000" opacity="0.1" />

      {/* back of the glass */}
      <path d={BODY} className="fill-white/40 dark:fill-white/[0.06]" />

      {/* notes */}
      <g clipPath={`url(#${id}-inside)`}>
        {NOTES.map((n, i) => (
          <g
            key={i}
            transform={`translate(${n.x.toFixed(1)} ${n.y.toFixed(1)}) rotate(${n.rotate.toFixed(1)})`}
            style={{ opacity: i < visible ? 1 : 0, transition: `opacity 0.45s ease ${i < visible ? 0 : 0.1}s` }}
          >
            <rect x={-13} y={-7.5} width={26} height={15} rx={2} fill={n.color} />
            <path d="M-13 0 L13 0" stroke="#000000" strokeOpacity="0.1" strokeWidth={1} />
            <path d="M-13 -7.5 L-6 0 L-13 7.5" fill="#000000" fillOpacity="0.05" />
            {n.heart && <path d="M0,-2 C0,-4.5 -3.5,-4.5 -3.5,-2 C-3.5,0.4 0,2.4 0,3.4 C0,2.4 3.5,0.4 3.5,-2 C3.5,-4.5 0,-4.5 0,-2 Z" fill="#f43f5e" />}
          </g>
        ))}
      </g>

      {/* front glass with highlights */}
      <path d={BODY} fill={`url(#${id}-glass)`} strokeWidth="2.5" className="stroke-rose-200 dark:stroke-white/25" />
      <path d="M46 106 C43 140 43 182 46 216" fill="none" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="5" strokeLinecap="round" />
      <path d="M58 96 C55 104 55 110 56 116" fill="none" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="3" strokeLinecap="round" />
      <path d="M176 120 C178 150 178 180 176 204" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" />

      {/* label */}
      <g transform="rotate(-3 110 152)">
        <rect x="56" y="128" width="108" height="50" rx="10" fill="#fffaf0" />
        <rect x="60" y="132" width="100" height="42" rx="7" fill="none" stroke="#fda4af" strokeWidth="1.2" strokeDasharray="3 2.5" />
        <text x="110" y="150" textAnchor="middle" className="font-cursive" fontSize="17" fontWeight="700" fill="#e11d48">
          Reasons
        </text>
        <text x="110" y="167" textAnchor="middle" className="font-cursive" fontSize="13" fill="#be185d">
          I love you ♥
        </text>
      </g>

      {/* neck ribbon + bow */}
      <rect x="72" y="56" width="76" height="8" rx="3" fill="#fb7185" />
      <g transform="translate(146 60)">
        <path d="M0 0 C10 -14 26 -10 22 0 C26 10 10 14 0 0 Z" fill="#f43f5e" />
        <path d="M0 0 C-4 -12 -16 -12 -14 -2 C-16 8 -4 10 0 0 Z" fill="#fb7185" />
        <path d="M0 0 L8 22 L12 18 L15 24" fill="none" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="0" cy="0" r="4" fill="#e11d48" />
      </g>

      {/* lid */}
      <rect x="66" y="34" width="88" height="18" rx="6" fill="#e9c39b" />
      <rect x="66" y="34" width="88" height="6" rx="3" fill="#f3d6b5" />
      {[78, 92, 106, 120, 134, 148].map((x) => (
        <path key={x} d={`M${x} 40 L${x} 50`} stroke="#c99a6b" strokeWidth="1.4" strokeLinecap="round" />
      ))}
    </svg>
  )
}
