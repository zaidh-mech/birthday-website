import type { Metadata } from 'next'
import MemoryMatch from './MemoryMatch'

export const metadata: Metadata = {
  title: 'Memory Match',
  description: 'Flip our photos and find every pair.',
}

export default function MemoryMatchPage() {
  return <MemoryMatch />
}
