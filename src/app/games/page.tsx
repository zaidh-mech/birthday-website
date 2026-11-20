import type { Metadata } from 'next'
import GamesHub from './GamesHub'

export const metadata: Metadata = {
  title: 'Games',
  description: 'Game night for two: little games made out of our photos, words and memories.',
}

export default function GamesPage() {
  return <GamesHub />
}
