'use client'

import {
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type Ref,
} from 'react'
import { Heart } from 'lucide-react'
import type { WheelPrize } from '@/lib/siteConfig'
import { haptic, sfx } from '@/lib/sound'
import WheelDisc from './WheelDisc'
import WheelRim from './WheelRim'
import {
  FLICK_MIN_SPEED,
  NORMAL_SPIN_MAX,
  NORMAL_SPIN_MIN,
  easeOut,
  mod,
  planSpin,
  segmentAt,
} from './wheelMath'
import styles from './wheel.module.css'

export interface WheelHandle {
  /** Starts a normal spin (ignored while already spinning). */
  spin: () => void
  /** The wheel's outer element, e.g. for confetti origins. */
  getElement: () => HTMLElement | null
}

interface WheelProps {
  prizes: WheelPrize[]
  reducedMotion: boolean
  disabled?: boolean
  winnerIndex: number | null
  onSpinStart: () => void
  onSpinEnd: (index: number) => void
  ref?: Ref<WheelHandle>
}

interface SpinAnim {
  from: number
  to: number
  duration: number
  start: number
}

interface DragState {
  id: number
  lastRaw: number
  accum: number
  startRot: number
  samples: { t: number; r: number }[]
}

/** Degrees the flapper kicks when a peg passes, and how quickly it settles per frame. */
const FLAP_KICK = 26
const FLAP_DECAY = 0.8
/** Minimum gap between peg ticks so fast spins don't turn into a buzz. */
const TICK_GAP_MS = 42

/**
 * The interactive wheel: SVG disc rotated with a CSS transform (written
 * straight to the DOM from one requestAnimationFrame loop, no React renders
 * per frame), a static rim with bulbs, a hub and a flapper pointer.
 */
export default function Wheel({ prizes, reducedMotion, disabled = false, winnerIndex, onSpinStart, onSpinEnd, ref }: WheelProps) {
  const count = prizes.length
  const idPrefix = `wheel${useId().replace(/[^a-zA-Z0-9]/g, '')}`

  const rootRef = useRef<HTMLDivElement>(null)
  const discRef = useRef<HTMLDivElement>(null)
  const flapperRef = useRef<HTMLDivElement>(null)
  const readoutRef = useRef<HTMLSpanElement>(null)

  const [spinning, setSpinning] = useState(false)
  const [grabbing, setGrabbing] = useState(false)

  const physics = useRef({
    rot: 0,
    boundary: 0,
    segment: -1,
    flap: 0,
    lastTick: 0,
    raf: 0,
    anim: null as SpinAnim | null,
    drag: null as DragState | null,
    spinning: false,
  })

  // Latest props for the RAF loop and event handlers.
  const live = useRef({ prizes, count, reducedMotion, disabled, onSpinStart, onSpinEnd })
  useEffect(() => {
    live.current = { prizes, count, reducedMotion, disabled, onSpinStart, onSpinEnd }
  })

  const updateReadout = (force = false) => {
    const s = physics.current
    const { prizes: list, count: n } = live.current
    if (n < 1) return
    const idx = segmentAt(s.rot, n)
    if (!force && idx === s.segment) return
    s.segment = idx
    const p = list[idx]
    if (readoutRef.current && p) readoutRef.current.textContent = `${p.emoji} ${p.label}`
  }

  const applyFlap = () => {
    const el = flapperRef.current
    if (el) el.style.transform = `rotate(${physics.current.flap.toFixed(2)}deg)`
  }

  const frame = (now: number) => {
    const s = physics.current
    s.raf = 0
    let active = false

    const anim = s.anim
    if (anim) {
      const u = Math.max(0, Math.min(1, (now - anim.start) / anim.duration))
      setRotation(anim.from + (anim.to - anim.from) * easeOut(u), now)
      if (u >= 1) {
        s.anim = null
        finishSpin()
      } else {
        active = true
      }
    }

    if (Math.abs(s.flap) > 0.25) {
      s.flap *= FLAP_DECAY
      active = true
    } else {
      s.flap = 0
    }
    applyFlap()

    if (active) s.raf = requestAnimationFrame(frame)
  }

  const kick = () => {
    const s = physics.current
    if (!s.raf) s.raf = requestAnimationFrame(frame)
  }

  const setRotation = (rot: number, now: number) => {
    const s = physics.current
    s.rot = rot
    const disc = discRef.current
    if (disc) disc.style.transform = `rotate(${rot.toFixed(3)}deg)`
    const seg = 360 / live.current.count
    const b = Math.floor(rot / seg)
    if (b !== s.boundary) {
      const dir = b > s.boundary ? 1 : -1
      s.boundary = b
      // A clockwise wheel drags the flapper tip to the right (counter-clockwise rotation).
      s.flap = -dir * (live.current.reducedMotion ? FLAP_KICK * 0.5 : FLAP_KICK)
      if (now - s.lastTick >= TICK_GAP_MS) {
        s.lastTick = now
        sfx.tick()
      }
      updateReadout()
      kick()
    }
  }

  const finishSpin = () => {
    const s = physics.current
    const n = live.current.count
    const index = segmentAt(s.rot, n)
    // Normalise so the cumulative angle never grows without bound.
    s.rot = mod(s.rot, 360)
    s.boundary = Math.floor(s.rot / (360 / n))
    const disc = discRef.current
    if (disc) disc.style.transform = `rotate(${s.rot.toFixed(3)}deg)`
    s.spinning = false
    setSpinning(false)
    haptic([12, 40, 20])
    live.current.onSpinEnd(index)
  }

  /** `velocity` in deg/s (null = normal spin); `direction` is used for normal spins. */
  const startSpin = (velocity: number | null, direction: 1 | -1 = 1) => {
    const s = physics.current
    const L = live.current
    if (s.spinning || L.disabled || L.count < 2) return
    const v =
      velocity !== null && Math.abs(velocity) >= FLICK_MIN_SPEED
        ? velocity
        : direction * (NORMAL_SPIN_MIN + Math.random() * (NORMAL_SPIN_MAX - NORMAL_SPIN_MIN))
    const plan = planSpin({ from: s.rot, count: L.count, velocity: v, reduced: L.reducedMotion })
    s.anim = { from: plan.from, to: plan.to, duration: plan.duration, start: performance.now() }
    s.spinning = true
    setSpinning(true)
    L.onSpinStart()
    kick()
  }

  useImperativeHandle(ref, () => ({
    spin: () => startSpin(null, 1),
    getElement: () => rootRef.current,
  }))

  // Prizes changed (config loaded): re-sync the boundary counter without ticking.
  useEffect(() => {
    const s = physics.current
    s.boundary = Math.floor(s.rot / (360 / Math.max(1, count)))
    updateReadout(true)
  }, [count, prizes])

  useEffect(() => {
    const s = physics.current
    return () => {
      if (s.raf) cancelAnimationFrame(s.raf)
      s.raf = 0
    }
  }, [])

  /* ---------- grab & flick ---------- */

  const angleOf = (clientX: number, clientY: number): number => {
    const el = discRef.current
    if (!el) return 0
    const r = el.getBoundingClientRect()
    return (Math.atan2(clientY - (r.top + r.height / 2), clientX - (r.left + r.width / 2)) * 180) / Math.PI
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = physics.current
    if (s.spinning || live.current.disabled) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* capture is best-effort */
    }
    s.drag = {
      id: e.pointerId,
      lastRaw: angleOf(e.clientX, e.clientY),
      accum: 0,
      startRot: s.rot,
      samples: [{ t: e.timeStamp, r: s.rot }],
    }
    setGrabbing(true)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = physics.current
    const d = s.drag
    if (!d || d.id !== e.pointerId) return
    const raw = angleOf(e.clientX, e.clientY)
    let delta = raw - d.lastRaw
    if (delta > 180) delta -= 360
    else if (delta < -180) delta += 360
    d.lastRaw = raw
    d.accum += delta
    const rot = d.startRot + d.accum
    setRotation(rot, performance.now())
    d.samples.push({ t: e.timeStamp, r: rot })
    const cutoff = e.timeStamp - 160
    while (d.samples.length > 2 && d.samples[0].t < cutoff) d.samples.shift()
  }

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const s = physics.current
    const d = s.drag
    if (!d || d.id !== e.pointerId) return
    s.drag = null
    setGrabbing(false)
    if (cancelled) return

    const last = d.samples[d.samples.length - 1]
    const recent = d.samples.filter((p) => e.timeStamp - p.t <= 110)
    let v = 0
    if (recent.length >= 2) {
      const first = recent[0]
      const end = recent[recent.length - 1]
      const dt = (end.t - first.t) / 1000
      if (dt > 0.008) v = (end.r - first.r) / dt
    }
    // Held still before letting go: no flick.
    if (e.timeStamp - last.t > 90) v = 0
    const dir: 1 | -1 = v !== 0 ? (v < 0 ? -1 : 1) : d.accum < -3 ? -1 : 1
    startSpin(Math.abs(v) >= FLICK_MIN_SPEED ? v : null, dir)
  }

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    if (e.repeat) return
    startSpin(null, 1)
  }

  // Screen readers "click" role=button elements without pointer events (detail === 0).
  const onClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (e.detail === 0) startSpin(null, 1)
  }

  const label = `Wheel of Love with ${count} prizes. Press Enter or Space to spin, or grab the wheel and flick it.`

  return (
    <div className="flex w-full flex-col items-center">
      <div
        ref={rootRef}
        role="button"
        tabIndex={0}
        aria-label={label}
        aria-disabled={spinning || disabled}
        onKeyDown={onKeyDown}
        onClick={onClick}
        className={`${styles.wheelBox} ${spinning ? styles.spinning : ''} relative aspect-square select-none rounded-full outline-none focus-visible:ring-4 focus-visible:ring-rose-400/70 focus-visible:ring-offset-4 focus-visible:ring-offset-[#fdfbf7] dark:focus-visible:ring-purple-400/70 dark:focus-visible:ring-offset-[#0B0C10]`}
      >
        {/* slowly turning aura behind the wheel */}
        <div aria-hidden="true" className={`${styles.aura} pointer-events-none absolute -inset-[7%] rounded-full`} />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-[3%] rounded-full shadow-[0_30px_70px_-18px_rgba(225,29,72,0.55)] dark:shadow-[0_30px_80px_-18px_rgba(168,85,247,0.55)]"
        />

        <WheelRim spinning={spinning} idPrefix={idPrefix} />

        {/* the rotating disc */}
        <div
          ref={discRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => endDrag(e, false)}
          onPointerCancel={(e) => endDrag(e, true)}
          onContextMenu={(e) => e.preventDefault()}
          className={`absolute inset-[8.4%] overflow-hidden rounded-full [touch-action:none] [-webkit-touch-callout:none] ${
            spinning || disabled ? 'cursor-default' : grabbing ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ willChange: 'transform' }}
        >
          <WheelDisc prizes={prizes} winnerIndex={winnerIndex} idPrefix={idPrefix} />
        </div>

        {/* glossy sheen + inner shadow (static) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-[8.4%] rounded-full shadow-[inset_0_0_26px_rgba(76,5,25,0.22),inset_0_-8px_18px_rgba(76,5,25,0.12)]"
          style={{
            background:
              'radial-gradient(circle at 32% 22%, rgba(255,255,255,0.42), rgba(255,255,255,0.08) 34%, rgba(255,255,255,0) 52%)',
          }}
        />

        {/* hub */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[41.5%] top-[41.5%] flex h-[17%] w-[17%] items-center justify-center rounded-full border-[3px] border-white bg-gradient-to-br from-white via-rose-50 to-rose-200 shadow-[0_6px_16px_rgba(76,5,25,0.35),inset_0_-3px_6px_rgba(190,18,60,0.18)] dark:border-purple-100 dark:from-[#3b2a5c] dark:via-[#2a2140] dark:to-[#1a1626]"
        >
          <Heart className={`${styles.hubHeart} h-[46%] w-[46%] fill-rose-500 text-rose-500 drop-shadow-[0_1px_2px_rgba(136,19,55,0.4)] dark:fill-pink-400 dark:text-pink-400`} />
        </div>

        {/* flapper pointer */}
        <div
          ref={flapperRef}
          aria-hidden="true"
          className="pointer-events-none absolute z-10"
          style={{ left: '44%', top: '0.6%', width: '12%', height: '16%', transformOrigin: '50% 25%' }}
        >
          <svg viewBox="0 0 60 80" className="block h-full w-full overflow-visible drop-shadow-[0_4px_5px_rgba(76,5,25,0.4)]" focusable="false">
            <defs>
              <linearGradient id={`${idPrefix}-ptr`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#fff7d6" />
                <stop offset="0.45" stopColor="#fbbf24" />
                <stop offset="1" stopColor="#b45309" />
              </linearGradient>
            </defs>
            <path
              d="M30 78 C 23 63, 8 47, 8 30 C 8 17, 18 8, 30 8 C 42 8, 52 17, 52 30 C 52 47, 37 63, 30 78 Z"
              fill={`url(#${idPrefix}-ptr)`}
              stroke="#ffffff"
              strokeWidth="2.6"
              strokeLinejoin="round"
            />
            <path
              d="M30 48 C 22 42, 19 38, 19 34 C 19 31, 21.5 29, 24.2 29 C 26.6 29, 28.4 30.4, 30 32.6 C 31.6 30.4, 33.4 29, 35.8 29 C 38.5 29, 41 31, 41 34 C 41 38, 38 42, 30 48 Z"
              fill="#e11d48"
              stroke="#ffffff"
              strokeWidth="1.4"
            />
            <circle cx="30" cy="20" r="4.2" fill="#ffffff" stroke="rgba(120,53,15,0.45)" strokeWidth="1.2" />
          </svg>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="mt-5 inline-flex min-h-[2.25rem] max-w-[88vw] items-center gap-2 rounded-full border border-rose-100 bg-white/70 px-4 py-1.5 text-sm font-semibold text-rose-700 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-purple-100"
      >
        <span className="text-[10px] uppercase tracking-[0.22em] text-rose-400 dark:text-purple-300">{spinning ? 'Spinning' : 'Pointing at'}</span>
        <span ref={readoutRef} className="min-w-0 truncate" />
      </div>
    </div>
  )
}
