import Link from 'next/link'
import { Gamepad2, House, Images } from 'lucide-react'

const RISING_HEARTS = [
  { left: '18%', delay: '0s', size: 'text-base', duration: '5.5s' },
  { left: '32%', delay: '1.6s', size: 'text-xs', duration: '4.8s' },
  { left: '50%', delay: '0.8s', size: 'text-sm', duration: '6s' },
  { left: '66%', delay: '2.4s', size: 'text-base', duration: '5.2s' },
  { left: '80%', delay: '1.1s', size: 'text-xs', duration: '4.6s' },
]

function BigHeart() {
  return (
    <svg viewBox="0 0 120 110" className="h-full w-full drop-shadow-[0_18px_30px_rgba(244,63,94,0.35)] dark:drop-shadow-[0_18px_34px_rgba(168,85,247,0.45)]" aria-hidden="true">
      <defs>
        <linearGradient id="nf-heart" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fda4af" />
          <stop offset="55%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
      </defs>
      <path
        d="M60 104C53 97 8 66 8 34 8 17 21 6 36 6c10 0 18 5 24 14C66 11 74 6 84 6c15 0 28 11 28 28 0 32-45 63-52 70Z"
        fill="url(#nf-heart)"
      />
      <ellipse cx="36" cy="30" rx="11" ry="6" fill="#fff" opacity="0.45" transform="rotate(-35 36 30)" />
    </svg>
  )
}

/** 404: shown for any URL that doesn't exist (GitHub Pages serves it as 404.html). */
export default function NotFound() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center px-4 pb-28 pt-24 text-center sm:pt-28 md:pb-16">
      <div className="relative mx-auto w-full max-w-lg">
        <div className="relative mx-auto mb-6 flex items-center justify-center gap-1 font-serif text-[5.5rem] font-bold leading-none text-gray-900 sm:gap-3 sm:text-[8rem] dark:text-gray-100">
          <span className="animate-fade-up">4</span>
          <span className="relative inline-block h-[0.82em] w-[0.9em] animate-float" style={{ animationDelay: '0.2s' }}>
            <span className="block h-full w-full animate-heartbeat">
              <BigHeart />
            </span>
            {RISING_HEARTS.map((h, i) => (
              <span
                key={i}
                aria-hidden="true"
                className={`pointer-events-none absolute bottom-1/2 animate-rise text-rose-400 opacity-0 dark:text-purple-300 ${h.size}`}
                style={{ left: h.left, animationDelay: h.delay, animationDuration: h.duration }}
              >
                ♥
              </span>
            ))}
          </span>
          <span className="animate-fade-up" style={{ animationDelay: '0.12s' }}>
            4
          </span>
        </div>

        <div className="glass rounded-3xl px-5 py-7 shadow-sm sm:px-10 sm:py-9">
          <h1 className="font-serif text-2xl font-bold text-balance text-gray-900 sm:text-3xl dark:text-gray-100">
            This page wandered off…
          </h1>
          <p className="mt-2 font-serif text-lg italic text-balance text-rose-900/80 sm:text-xl dark:text-rose-100/80">
            like my heart did the day I met you.
          </p>
          <p className="mt-4 font-cursive text-2xl text-rose-500 dark:text-purple-300">
            Don&apos;t worry, my love, every road here leads back to you.
          </p>

          <div className="mt-7 flex flex-col items-stretch justify-center gap-2.5 sm:flex-row sm:items-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-rose-500/25 transition hover:-translate-y-0.5 hover:bg-rose-600 active:scale-95 dark:bg-purple-500 dark:shadow-purple-500/30 dark:hover:bg-purple-400"
            >
              <House aria-hidden="true" className="h-4 w-4" /> Take me home
            </Link>
            <Link
              href="/memories"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-white/70 px-5 py-3 text-sm font-semibold text-rose-600 transition hover:-translate-y-0.5 hover:bg-white active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-purple-200 dark:hover:bg-white/10"
            >
              <Images aria-hidden="true" className="h-4 w-4" /> Our memories
            </Link>
            <Link
              href="/games"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-white/70 px-5 py-3 text-sm font-semibold text-rose-600 transition hover:-translate-y-0.5 hover:bg-white active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-purple-200 dark:hover:bg-white/10"
            >
              <Gamepad2 aria-hidden="true" className="h-4 w-4" /> Play a game
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
