'use client'

import { useRef, type ReactNode } from 'react'
import { Eye, Hash, Images, RotateCcw } from 'lucide-react'
import styles from './puzzle.module.css'

const BUTTON =
  'flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-2.5 text-xs font-semibold outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-rose-400 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 lg:flex-row lg:justify-start lg:gap-3 lg:px-4 lg:py-3 lg:text-sm dark:focus-visible:ring-purple-300'
const IDLE =
  'border-rose-100 bg-white/70 text-gray-700 shadow-sm backdrop-blur-md hover:-translate-y-0.5 hover:border-rose-200 hover:bg-white hover:text-rose-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-purple-100'
const ON =
  'border-rose-300 bg-rose-500 text-white shadow-md shadow-rose-500/25 dark:border-purple-400/60 dark:bg-purple-500 dark:shadow-purple-500/20'

function Hint({ children }: { children: ReactNode }) {
  return <span className="hidden text-[11px] font-normal opacity-70 lg:ml-auto lg:inline">{children}</span>
}

/** Peek: press and hold to look at the whole picture, or tap to toggle it on/off. */
export function PeekButton({
  active,
  disabled,
  onHold,
  onToggle,
}: {
  active: boolean
  disabled?: boolean
  onHold: (held: boolean) => void
  onToggle: () => void
}) {
  const pressStart = useRef(0)

  const end = (allowToggle: boolean) => {
    if (!pressStart.current) return
    const heldFor = performance.now() - pressStart.current
    pressStart.current = 0
    onHold(false)
    if (allowToggle && heldFor < 300) onToggle()
  }

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label="Peek at the full picture"
      title="Tap to toggle, or press and hold (P)"
      disabled={disabled}
      onPointerDown={(e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return
        pressStart.current = performance.now()
        onHold(true)
      }}
      onPointerUp={() => end(true)}
      onPointerLeave={() => end(false)}
      onPointerCancel={() => end(false)}
      onClick={(e) => {
        // Keyboard activation (Enter / Space) has no pointer events.
        if (e.detail === 0) onToggle()
      }}
      onContextMenu={(e) => e.preventDefault()}
      className={`${BUTTON} ${active ? ON : IDLE} touch-none ${styles.noCallout}`}
    >
      <Eye className="h-4 w-4 shrink-0" />
      <span>Peek</span>
      <Hint>hold or tap, P</Hint>
    </button>
  )
}

export function ToggleButton({
  active,
  onClick,
  label,
  hint,
  icon,
  title,
}: {
  active: boolean
  onClick: () => void
  label: string
  hint?: string
  icon: ReactNode
  title?: string
}) {
  return (
    <button type="button" aria-pressed={active} title={title} onClick={onClick} className={`${BUTTON} ${active ? ON : IDLE}`}>
      {icon}
      <span>{label}</span>
      {hint && <Hint>{hint}</Hint>}
    </button>
  )
}

export function ActionButton({ onClick, label, hint, icon, title }: { onClick: () => void; label: string; hint?: string; icon: ReactNode; title?: string }) {
  return (
    <button type="button" title={title} onClick={onClick} className={`${BUTTON} ${IDLE}`}>
      {icon}
      <span>{label}</span>
      {hint && <Hint>{hint}</Hint>}
    </button>
  )
}

export const icons = {
  numbers: <Hash className="h-4 w-4 shrink-0" />,
  photos: <Images className="h-4 w-4 shrink-0" />,
  again: <RotateCcw className="h-4 w-4 shrink-0" />,
}
