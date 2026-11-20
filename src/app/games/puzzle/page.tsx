import type { Metadata } from 'next'
import PuzzleGame from './PuzzleGame'

export const metadata: Metadata = {
  title: 'Picture Puzzle',
  description: 'Slide the tiles to put one of our memories back together.',
}

export default function PuzzlePage() {
  return <PuzzleGame />
}
