import type { Metadata } from 'next'
import LettersClient from './LettersClient'

export const metadata: Metadata = {
  title: 'Letters for You',
  description: 'Sealed letters, written for you whenever I was thinking of you.',
}

export default function LettersPage() {
  return <LettersClient />
}
