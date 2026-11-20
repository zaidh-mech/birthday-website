'use client'

import { memo, type MouseEvent } from 'react'
import { CornerDownLeft, Delete } from 'lucide-react'
import type { LetterState } from './logic'
import { KEY_STATE_CLASSES, STATE_LABELS, cx } from './tileStyles'

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']

export type KeyName = string // 'A'..'Z' | 'ENTER' | 'BACKSPACE'

interface KeyboardProps {
  states: Record<string, LetterState>
  onKey: (key: KeyName) => void
  /** Key to show as pressed (mirrors the physical keyboard) */
  pressed: string | null
  /** Letter revealed by the hint, highlighted softly */
  hintLetter: string | null
  keyH: number | null
  keyGap: number | null
  disabled?: boolean
}

function Keyboard({ states, onKey, pressed, hintLetter, keyH, keyGap, disabled = false }: KeyboardProps) {
  const height = keyH ? `${keyH}px` : 'clamp(42px, 6.4dvh, 54px)'
  const gap = keyGap ? `${keyGap}px` : '5px'

  const press = (key: KeyName) => (e: MouseEvent<HTMLButtonElement>) => {
    // Pointer clicks shouldn't leave focus on the key, or a later physical
    // Enter would "click" it again.
    if (e.detail > 0) e.currentTarget.blur()
    onKey(key)
  }

  const keyClass = (extra: string, isPressed: boolean) =>
    cx(
      'relative flex min-w-0 touch-manipulation select-none items-center justify-center rounded-lg font-semibold uppercase outline-none transition-[background-color,color,transform,box-shadow] duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:rounded-xl dark:focus-visible:ring-purple-300',
      isPressed && 'scale-95 brightness-105',
      disabled && 'pointer-events-none opacity-70',
      extra,
    )

  return (
    <div role="group" aria-label="Keyboard" className="mx-auto flex w-full max-w-[520px] flex-col select-none" style={{ gap }}>
      {ROWS.map((row, r) => (
        <div key={row} className="flex w-full justify-center" style={{ gap }}>
          {r === 1 && <div aria-hidden="true" className="flex-[0.5] max-w-[24px]" />}
          {r === 2 && (
            <button
              type="button"
              aria-label="Enter"
              onMouseDown={(e) => e.preventDefault()}
              onClick={press('ENTER')}
              disabled={disabled}
              style={{ height }}
              className={keyClass(
                'max-w-[84px] flex-[1.55] gap-1 bg-gradient-to-br from-rose-400 to-pink-500 px-1 text-[11px] tracking-wide text-white shadow-md shadow-rose-400/30 hover:brightness-105 sm:text-xs dark:from-purple-500 dark:to-fuchsia-500 dark:shadow-purple-500/30',
                pressed === 'ENTER',
              )}
            >
              <CornerDownLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Enter</span>
            </button>
          )}
          {row.split('').map((letter) => {
            const state = states[letter]
            const isHint = !state && hintLetter === letter
            return (
              <button
                key={letter}
                type="button"
                aria-label={state ? `${letter}, ${STATE_LABELS[state]}` : letter}
                onMouseDown={(e) => e.preventDefault()}
                onClick={press(letter)}
                disabled={disabled}
                style={{ height }}
                className={keyClass(
                  cx(
                    'max-w-[50px] flex-1 basis-0 text-sm sm:text-base',
                    KEY_STATE_CLASSES[state ?? 'unknown'],
                    isHint && 'ring-2 ring-amber-300 ring-offset-1 ring-offset-transparent dark:ring-amber-300/70',
                  ),
                  pressed === letter,
                )}
              >
                {letter}
              </button>
            )
          })}
          {r === 1 && <div aria-hidden="true" className="flex-[0.5] max-w-[24px]" />}
          {r === 2 && (
            <button
              type="button"
              aria-label="Backspace"
              onMouseDown={(e) => e.preventDefault()}
              onClick={press('BACKSPACE')}
              disabled={disabled}
              style={{ height }}
              className={keyClass(cx('max-w-[84px] flex-[1.55]', KEY_STATE_CLASSES.unknown), pressed === 'BACKSPACE')}
            >
              <Delete className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

export default memo(Keyboard)
