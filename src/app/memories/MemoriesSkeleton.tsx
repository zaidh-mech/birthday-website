import { Heart } from 'lucide-react'
import styles from './memories.module.css'

/** Soft placeholder while we find out whether the safe is open. */
export default function MemoriesSkeleton() {
  return (
    <div
      className="flex min-h-[70vh] w-full flex-col items-center justify-center px-4 pb-28 pt-24 sm:pt-28 md:pb-16"
      role="status"
      aria-live="polite"
    >
      <div className="relative flex h-36 w-36 items-center justify-center sm:h-44 sm:w-44">
        <div className="absolute inset-0 rounded-full bg-rose-200/40 blur-2xl dark:bg-purple-500/20" />
        <div
          className={`absolute inset-0 rounded-full border-[6px] border-dashed border-rose-200/80 dark:border-purple-300/25 ${styles.spinSlow}`}
        />
        <div
          className={`absolute inset-4 rounded-full border-2 border-dotted border-rose-300/70 dark:border-purple-300/30 ${styles.spinReverse}`}
        />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/80 shadow-lg shadow-rose-200/60 backdrop-blur-md dark:bg-white/10 dark:shadow-none sm:h-20 sm:w-20">
          <Heart className="h-7 w-7 animate-pulse fill-rose-400/40 text-rose-500 dark:fill-purple-300/30 dark:text-purple-300 sm:h-8 sm:w-8" />
        </div>
      </div>

      <p className="mt-8 font-cursive text-2xl text-rose-500 dark:text-purple-200 sm:text-3xl">Finding our memories…</p>

      <div className="mt-6 w-full max-w-xs space-y-3" aria-hidden="true">
        <div className={`mx-auto h-3 w-4/5 rounded-full bg-rose-100/80 dark:bg-white/10 ${styles.shimmer}`} />
        <div className={`mx-auto h-3 w-3/5 rounded-full bg-rose-100/80 dark:bg-white/10 ${styles.shimmer}`} />
        <div className={`mx-auto h-3 w-2/5 rounded-full bg-rose-100/80 dark:bg-white/10 ${styles.shimmer}`} />
      </div>
      <span className="sr-only">Loading memories</span>
    </div>
  )
}
