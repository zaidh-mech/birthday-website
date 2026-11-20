'use client'

import { motion, type MotionValue } from 'framer-motion'
import { Heart } from 'lucide-react'

const TICKS = Array.from({ length: 60 }, (_, i) => i)
const NUMBERS = Array.from({ length: 10 }, (_, i) => i * 10)

/**
 * The combination dial on the vault door. The face rotates with `rotate`
 * (degrees); the pointer at the top stays still.
 */
export default function VaultDial({ rotate, unlocked }: { rotate: MotionValue<number>; unlocked: boolean }) {
  return (
    <div className="relative h-[104px] w-[104px] sm:h-[132px] sm:w-[132px]" aria-hidden="true">
      {/* soft halo */}
      <div
        className={`absolute -inset-3 rounded-full blur-xl transition-colors duration-700 ${
          unlocked ? 'bg-emerald-300/50 dark:bg-emerald-400/30' : 'bg-rose-300/40 dark:bg-purple-500/25'
        }`}
      />
      {/* outer bezel */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#fbe7df] via-[#e2a99a] to-[#b9786a] p-[6px] shadow-[0_10px_30px_-8px_rgba(159,18,57,0.45),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:from-[#6d6290] dark:via-[#3b3456] dark:to-[#1f1b30] dark:shadow-[0_10px_30px_-8px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.25)]">
        {/* rotating face */}
        <motion.div
          style={{ rotate }}
          className="relative h-full w-full rounded-full bg-gradient-to-br from-[#fffaf6] via-[#f6e4dc] to-[#e9cabd] shadow-[inset_0_2px_6px_rgba(0,0,0,0.18)] dark:from-[#2a2640] dark:via-[#1c1a2b] dark:to-[#141320] dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]"
        >
          <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full">
            {TICKS.map((i) => {
              const major = i % 6 === 0
              const angle = (i / 60) * 360
              return (
                <line
                  key={i}
                  x1="60"
                  y1={major ? 7 : 9}
                  x2="60"
                  y2={major ? 17 : 13}
                  transform={`rotate(${angle} 60 60)`}
                  className={major ? 'stroke-rose-500/80 dark:stroke-purple-200/80' : 'stroke-rose-900/25 dark:stroke-white/25'}
                  strokeWidth={major ? 1.6 : 1}
                  strokeLinecap="round"
                />
              )
            })}
            {NUMBERS.map((n, i) => {
              const angle = (i / NUMBERS.length) * 2 * Math.PI
              const r = 34
              const x = 60 + r * Math.sin(angle)
              const y = 60 - r * Math.cos(angle) + 3
              return (
                <text
                  key={n}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  className="fill-rose-900/60 font-sans text-[8px] font-semibold dark:fill-purple-100/60"
                >
                  {n}
                </text>
              )
            })}
          </svg>
          {/* knob */}
          <div className="absolute inset-[30%] flex items-center justify-center rounded-full bg-gradient-to-br from-[#fbe1d8] via-[#e8a898] to-[#c57b6c] shadow-[0_4px_10px_rgba(0,0,0,0.25),inset_0_1px_2px_rgba(255,255,255,0.8)] dark:from-[#8b7fb8] dark:via-[#55497a] dark:to-[#2e2846]">
            <Heart className="h-1/2 w-1/2 fill-white/90 text-white drop-shadow-sm" strokeWidth={1.5} />
          </div>
        </motion.div>
      </div>
      {/* fixed pointer */}
      <div className="absolute -top-1.5 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[7px] border-t-[11px] border-x-transparent border-t-rose-500 drop-shadow dark:border-t-purple-300" />
    </div>
  )
}
