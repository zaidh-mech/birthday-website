import type { GameId } from '@/lib/gameStorage'

export interface GameInfo {
  id: GameId
  href: string
  title: string
  emoji: string
  tagline: string
  /** Tailwind gradient classes for the card art */
  gradient: string
  /** How the stored best score should be shown, or null when the game has no score */
  bestLabel: ((best: number) => string) | null
}

/** Every game on the site, in hub order. */
export const GAMES: GameInfo[] = [
  {
    id: 'memory-match',
    href: '/games/memory-match',
    title: 'Memory Match',
    emoji: '🃏',
    tagline: 'Flip our photos and find every pair.',
    gradient: 'from-rose-300 via-pink-300 to-fuchsia-300',
    bestLabel: (best) => `Best: ${best} moves`,
  },
  {
    id: 'puzzle',
    href: '/games/puzzle',
    title: 'Picture Puzzle',
    emoji: '🧩',
    tagline: 'Slide the tiles to put one of our memories back together.',
    gradient: 'from-amber-200 via-orange-300 to-rose-300',
    bestLabel: (best) => `Best: ${best} moves`,
  },
  {
    id: 'heart-catcher',
    href: '/games/heart-catcher',
    title: 'Heart Catcher',
    emoji: '💘',
    tagline: 'Catch all my love before it hits the ground.',
    gradient: 'from-fuchsia-300 via-purple-300 to-indigo-300',
    bestLabel: (best) => `High score: ${best}`,
  },
  {
    id: 'secret-word',
    href: '/games/secret-word',
    title: 'Secret Word',
    emoji: '🔤',
    tagline: 'Guess the hidden love word in six tries.',
    gradient: 'from-emerald-200 via-teal-300 to-sky-300',
    bestLabel: (best) => `Solved in ${best} ${best === 1 ? 'try' : 'tries'} (best)`,
  },
  {
    id: 'love-wheel',
    href: '/games/love-wheel',
    title: 'Wheel of Love',
    emoji: '🎡',
    tagline: 'Spin it and win a little something from me.',
    gradient: 'from-pink-300 via-rose-300 to-amber-200',
    bestLabel: null,
  },
  {
    id: 'love-coupons',
    href: '/games/love-coupons',
    title: 'Love Coupons',
    emoji: '🎟️',
    tagline: 'Scratch to reveal coupons you can redeem anytime.',
    gradient: 'from-violet-300 via-purple-300 to-pink-300',
    bestLabel: null,
  },
]

export function getGame(id: GameId): GameInfo | undefined {
  return GAMES.find((g) => g.id === id)
}
