'use client'

import { Gamepad2 } from 'lucide-react'
import { GAMES } from '@/data/games'
import { getPhotos } from '@/lib/photos'
import styles from './Explore.module.css'

const SPRING = 'transition-[translate,rotate,scale] duration-500 ease-[cubic-bezier(.34,1.56,.64,1)]'

/* ---------- Letters: a little stack of envelopes that fans out ---------- */

const ENVELOPES = [
  { body: '#efe7ff', flap: '#ddd1fb', cls: '-translate-x-7 -translate-y-1 -rotate-12 group-hover:-translate-x-14 group-hover:-rotate-[20deg] group-active:-translate-x-10' },
  { body: '#ffe4ec', flap: '#fecdd9', cls: 'translate-x-7 -translate-y-2 rotate-[8deg] group-hover:translate-x-14 group-hover:-translate-y-4 group-hover:rotate-[16deg] group-active:translate-x-10' },
  { body: '#fff1e6', flap: '#fde2cc', cls: 'translate-y-2 group-hover:-translate-y-2 group-hover:scale-105 group-active:-translate-y-1' },
]

export function EnvelopesVisual() {
  return (
    <div aria-hidden className="relative h-full w-full">
      {ENVELOPES.map((env, i) => (
        <div
          key={i}
          className={`absolute inset-0 m-auto h-[4.5rem] w-28 rounded-md shadow-md ring-1 ring-black/5 ${SPRING} ${env.cls}`}
          style={{ background: env.body }}
        >
          <div
            className="absolute inset-x-0 bottom-0 h-[55%] opacity-60"
            style={{ background: env.flap, clipPath: 'polygon(0 100%, 50% 8%, 100% 100%)' }}
          />
          <div className="absolute inset-x-0 top-0 h-[60%] rounded-t-md" style={{ background: env.flap, clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
          {i === ENVELOPES.length - 1 && (
            <span className="absolute left-1/2 top-[52%] grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-rose-500 text-[10px] leading-none text-white shadow ring-2 ring-rose-300/60">
              ♥
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

/* ---------- Memories: a fan of three real photos ---------- */

const FAN = [
  '-translate-x-10 -rotate-12 group-hover:-translate-x-16 group-hover:-rotate-[18deg] group-active:-translate-x-12',
  'z-10 -translate-y-1 group-hover:-translate-y-3 group-hover:scale-105',
  'translate-x-10 rotate-12 group-hover:translate-x-16 group-hover:rotate-[18deg] group-active:translate-x-12',
]

export function PhotoFanVisual() {
  const photos = getPhotos()
  const picks = Array.from(
    new Set([0.12, 0.5, 0.88].map((f) => photos[Math.min(photos.length - 1, Math.floor(photos.length * f))]).filter(Boolean)),
  )
  return (
    <div aria-hidden className="relative h-full w-full">
      {picks.map((p, i) => (
        <div
          key={p.id}
          className={`absolute inset-0 m-auto h-[7.25rem] w-[5.25rem] rounded-[3px] bg-white p-1 pb-4 shadow-lg ring-1 ring-black/5 ${SPRING} ${FAN[i] ?? ''}`}
        >
          <div className="h-full w-full overflow-hidden rounded-[2px] bg-rose-50" style={{ backgroundImage: `url(${p.blur})`, backgroundSize: 'cover' }}>
            <img src={p.thumb} alt="" loading="lazy" decoding="async" draggable={false} className="h-full w-full object-cover object-[center_30%]" />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------- Games: floating game emoji around a controller ---------- */

const EMOJI_SPOTS = [
  { left: '12%', top: '16%' },
  { left: '74%', top: '12%' },
  { left: '6%', top: '60%' },
  { left: '80%', top: '58%' },
  { left: '30%', top: '66%' },
  { left: '56%', top: '68%' },
]

export function GamesVisual() {
  const emojis = GAMES.map((g) => g.emoji).slice(0, EMOJI_SPOTS.length)
  return (
    <div aria-hidden className="relative h-full w-full">
      <div className="absolute inset-0 m-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-rose-400 to-fuchsia-500 text-white shadow-lg shadow-rose-400/30 transition-[rotate,scale] duration-500 group-hover:rotate-[-8deg] group-hover:scale-110 dark:from-purple-500 dark:to-fuchsia-500">
        <Gamepad2 className="h-8 w-8" />
      </div>
      {emojis.map((emoji, i) => (
        <span
          key={i}
          className={`absolute text-2xl transition-[scale] duration-500 group-hover:scale-125 sm:text-3xl`}
          style={{ left: EMOJI_SPOTS[i].left, top: EMOJI_SPOTS[i].top }}
        >
          <span className={`${styles.bob} inline-block`} style={{ animationDelay: `${-i * 0.55}s`, animationDuration: `${2.8 + (i % 3) * 0.5}s` }}>
            {emoji}
          </span>
        </span>
      ))}
    </div>
  )
}

/* ---------- Gift: a ticket with a tear-off stub ---------- */

export function TicketVisual() {
  return (
    <div aria-hidden className="relative flex h-full w-full items-center justify-center">
      <svg
        viewBox="0 0 240 110"
        className="w-[85%] max-w-[15rem] -rotate-6 drop-shadow-lg transition-[rotate,scale] duration-500 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:rotate-0 group-hover:scale-105"
      >
        <defs>
          <linearGradient id="home-ticket-body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fde68a" />
            <stop offset="1" stopColor="#fda4af" />
          </linearGradient>
          <linearGradient id="home-ticket-stub" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fda4af" />
            <stop offset="1" stopColor="#fb7185" />
          </linearGradient>
        </defs>
        <path d="M12 0 H167 A9 9 0 0 0 176 9 V101 A9 9 0 0 0 167 110 H12 A12 12 0 0 1 0 98 V12 A12 12 0 0 1 12 0 Z" fill="url(#home-ticket-body)" />
        <rect x="9" y="9" width="158" height="92" rx="8" fill="none" stroke="#9f1239" strokeOpacity="0.18" strokeDasharray="4 3" />
        <text x="22" y="34" fontSize="9" letterSpacing="3" fill="#9f1239" fillOpacity="0.6" fontWeight="700">
          ADMIT ONE
        </text>
        <text x="22" y="62" fontSize="18" fontWeight="700" fill="#4c0519" className="font-serif">
          A date with me
        </text>
        <text x="22" y="86" fontSize="15" fill="#9f1239" className="font-cursive">
          valid forever ♥
        </text>
        <g className="transition-[translate,rotate] duration-500 ease-[cubic-bezier(.34,1.56,.64,1)] [transform-box:fill-box] [transform-origin:0%_100%] group-hover:translate-x-2 group-hover:rotate-[8deg]">
          <path d="M189 0 H228 A12 12 0 0 1 240 12 V98 A12 12 0 0 1 228 110 H189 A9 9 0 0 0 180 101 V9 A9 9 0 0 0 189 0 Z" fill="url(#home-ticket-stub)" />
          <path d="M184 14 V96" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="2" strokeDasharray="3 4" />
          <text x="214" y="62" textAnchor="middle" fontSize="22" fill="#ffffff">
            ♥
          </text>
        </g>
      </svg>
    </div>
  )
}
