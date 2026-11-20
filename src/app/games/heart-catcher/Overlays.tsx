'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Play, RotateCcw, Trophy, Sparkles } from 'lucide-react'
import styles from './HeartCatcher.module.css'

const CARD =
  'relative w-full rounded-3xl border border-rose-100 bg-white/85 text-center shadow-xl shadow-rose-200/40 backdrop-blur-md dark:border-white/10 dark:bg-[#15121f]/85 dark:shadow-black/40'

const PRIMARY =
  'inline-flex items-center justify-center gap-2 rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300/60 active:scale-95 dark:bg-purple-500 dark:hover:bg-purple-400 dark:focus-visible:ring-purple-400/50'

const SECONDARY =
  'inline-flex items-center justify-center gap-2 rounded-full bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 active:scale-95 dark:bg-white/10 dark:text-purple-100 dark:hover:bg-white/15 dark:focus-visible:ring-purple-400/40'

const LEGEND: { icon: string; label: string; value: string; bad?: boolean }[] = [
  { icon: '💗', label: 'Heart', value: '+1' },
  { icon: '💛', label: 'Golden', value: '+5' },
  { icon: '📸', label: 'Our photos', value: '+3' },
  { icon: '⭐', label: 'Magnet', value: '6s' },
  { icon: '⏱️', label: 'Slow-mo', value: '5s' },
  { icon: '💔🌧️', label: 'Avoid', value: '−1', bad: true },
]

function Backdrop({ children, onClick, label }: { children: ReactNode; onClick?: () => void; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`${styles.overlay} absolute inset-0 z-20 flex items-center justify-center overflow-y-auto bg-white/30 p-3 backdrop-blur-[3px] sm:p-6 dark:bg-black/40 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      role="group"
      aria-label={label}
    >
      <motion.div
        initial={{ y: 18, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 10, scale: 0.97, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className="my-auto w-full max-w-sm"
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

interface StartOverlayProps {
  best: number | null
  coarse: boolean
  nickname: string
  onStart: () => void
}

export function StartOverlay({ best, coarse, nickname, onStart }: StartOverlayProps) {
  return (
    <Backdrop onClick={onStart} label="Start Heart Catcher">
      <div className={`${CARD} px-4 py-5 sm:px-6 sm:py-6`}>
        <div className={`${styles.tallOnly} mb-1 text-4xl sm:text-5xl`} aria-hidden="true">
          <span className={styles.floaty}>💘</span>
        </div>
        <h2 className="font-cursive text-3xl leading-tight text-rose-500 sm:text-4xl dark:text-pink-200">Catch my love</h2>
        <p className="mx-auto mt-1 max-w-[17rem] text-xs leading-relaxed text-gray-600 sm:text-sm dark:text-gray-300">
          {coarse ? 'Drag anywhere on the board to slide the jar.' : 'Move your mouse over the board, or use ← → / A D.'}
          <span className={`${styles.tallOnly} block`}>Every heart up there is from me to you, {nickname}.</span>
        </p>

        <ul className={`${styles.tallOnly} mt-3 grid grid-cols-2 gap-1.5 text-left sm:grid-cols-3`} aria-label="What falls from the sky">
          {LEGEND.map((item) => (
            <li
              key={item.label}
              className={`flex items-center gap-1.5 rounded-xl px-2 py-1 text-[11px] sm:text-xs ${
                item.bad
                  ? 'bg-gray-100/90 text-gray-600 dark:bg-white/5 dark:text-gray-300'
                  : 'bg-rose-50/90 text-rose-900/80 dark:bg-white/5 dark:text-purple-100'
              }`}
            >
              <span aria-hidden="true" className="shrink-0 text-sm leading-none">
                {item.icon}
              </span>
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              <span className="font-bold tabular-nums">{item.value}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={(e) => {
            // the whole overlay also starts the game; don't fire twice
            e.stopPropagation()
            onStart()
          }}
          className={`${PRIMARY} ${styles.cta} mt-4`}
        >
          <Play className="h-4 w-4 fill-current" /> {coarse ? 'Tap to start' : 'Click to start'}
        </button>

        {best !== null && best > 0 ? (
          <p className="mt-3 inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-400 dark:text-purple-300">
            <Trophy className="h-3.5 w-3.5" /> High score {best}
          </p>
        ) : (
          !coarse && <p className="mt-3 text-[11px] text-gray-400 dark:text-gray-500">or press Space</p>
        )}
      </div>
    </Backdrop>
  )
}

interface PauseOverlayProps {
  score: number
  onResume: () => void
  onRestart: () => void
}

export function PauseOverlay({ score, onResume, onRestart }: PauseOverlayProps) {
  const resumeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    resumeRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <Backdrop label="Game paused">
      <div className={`${CARD} px-5 py-6`}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-rose-400 dark:text-purple-300">Paused</p>
        <h2 className="mt-1 font-cursive text-3xl text-gray-900 dark:text-gray-100">Take a breath</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Your jar holds <span className="font-serif font-bold text-rose-500 dark:text-pink-200">{score}</span> {score === 1 ? 'heart point' : 'heart points'} so far.
        </p>
        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          <button ref={resumeRef} type="button" onClick={onResume} className={PRIMARY}>
            <Play className="h-4 w-4 fill-current" /> Resume
          </button>
          <button type="button" onClick={onRestart} className={SECONDARY}>
            <RotateCcw className="h-4 w-4" /> Restart
          </button>
        </div>
        <p className={`${styles.tallOnly} mt-3 text-[11px] text-gray-400 dark:text-gray-500`}>Esc or P resumes too</p>
      </div>
    </Backdrop>
  )
}

interface OverOverlayProps {
  score: number
  best: number | null
  onPlayAgain: () => void
  onShowResults: () => void
}

export function OverOverlay({ score, best, onPlayAgain, onShowResults }: OverOverlayProps) {
  const playRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    playRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <Backdrop label="Game over">
      <div className={`${CARD} px-5 py-6`}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-rose-400 dark:text-purple-300">Game over</p>
        <p className="mt-1 font-serif text-5xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{score}</p>
        {best !== null && (
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 dark:text-purple-300">
            <Trophy className="h-3.5 w-3.5" /> Best {best}
          </p>
        )}
        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          <button ref={playRef} type="button" onClick={onPlayAgain} className={PRIMARY}>
            <RotateCcw className="h-4 w-4" /> Play again
          </button>
          <button type="button" onClick={onShowResults} className={SECONDARY}>
            <Sparkles className="h-4 w-4" /> Results
          </button>
        </div>
      </div>
    </Backdrop>
  )
}
