/** A photo as the home page shows it (polaroids, lightbox, photo of the day). */
export interface ViewerPhoto {
  id: string
  /** Large image for the lightbox (already base-path prefixed) */
  src: string
  /** Small image for cards and polaroids (already base-path prefixed) */
  thumb: string
  caption: string
  date?: string | null
  /** Tiny base64 placeholder */
  blur?: string
  /** Dominant colour, for glows */
  color?: string
}

/** Shared glass card look used across the home sections. */
export const GLASS_CARD =
  'rounded-3xl border border-rose-100 bg-white/60 shadow-xl shadow-rose-200/20 backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:shadow-black/30'

/** Small uppercase label above titles. */
export const EYEBROW = 'text-[10px] font-semibold uppercase tracking-[0.22em] text-rose-500 sm:text-[11px] dark:text-purple-200'

/** Primary pill button. */
export const BUTTON_PRIMARY =
  'inline-flex items-center justify-center gap-2 rounded-full bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-500/25 transition hover:bg-rose-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300/60 dark:bg-purple-500 dark:shadow-purple-500/25 dark:hover:bg-purple-400 dark:focus-visible:ring-purple-400/50'

/** Secondary glass pill button. */
export const BUTTON_SECONDARY =
  'inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-white/70 px-5 py-2.5 text-sm font-semibold text-rose-600 shadow-sm backdrop-blur-md transition hover:bg-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300/60 dark:border-white/15 dark:bg-white/10 dark:text-purple-100 dark:hover:bg-white/15 dark:focus-visible:ring-purple-400/50'

/** Picks a stable pet name for copy: her name when set, otherwise the first nickname. */
export function petName(herName: string, nicknames: string[]): string {
  return herName.trim() || nicknames[0] || 'my love'
}
