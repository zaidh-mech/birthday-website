import type { LetterState } from './logic'

/** Tiny className joiner. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Revealed tile colours. Contrast is checked for both themes:
 * white on rose-500/pink-600 (and purple-500/fuchsia-600 at night),
 * amber-950 on amber-300/400, stone-600 on stone-300, slate-200 on slate-700.
 */
export const TILE_STATE_CLASSES: Record<LetterState, string> = {
  correct:
    'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-[0_10px_22px_-10px_rgba(225,29,72,0.85)] ring-1 ring-inset ring-white/25 dark:from-purple-500 dark:to-fuchsia-600 dark:shadow-[0_10px_24px_-10px_rgba(192,38,211,0.9)]',
  present:
    'bg-gradient-to-br from-amber-300 to-amber-400 text-amber-950 shadow-[0_10px_22px_-12px_rgba(217,119,6,0.8)] ring-1 ring-inset ring-white/40 dark:from-amber-300 dark:to-amber-500 dark:ring-white/20',
  absent: 'bg-stone-300 text-stone-600 dark:bg-slate-700 dark:text-slate-200',
}

export const KEY_STATE_CLASSES: Record<LetterState | 'unknown', string> = {
  unknown:
    'border border-rose-100 bg-white/80 text-gray-800 shadow-sm hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-white/10 dark:text-gray-100 dark:hover:bg-white/15',
  correct: 'border border-transparent bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-sm shadow-rose-500/30 dark:from-purple-500 dark:to-fuchsia-600 dark:shadow-purple-500/30',
  present: 'border border-transparent bg-gradient-to-br from-amber-300 to-amber-400 text-amber-950 shadow-sm dark:from-amber-300 dark:to-amber-500',
  absent: 'border border-transparent bg-stone-300/90 text-stone-500 dark:bg-slate-700/90 dark:text-slate-400',
}

export const STATE_LABELS: Record<LetterState, string> = {
  correct: 'right spot',
  present: 'in the word',
  absent: 'not in the word',
}
