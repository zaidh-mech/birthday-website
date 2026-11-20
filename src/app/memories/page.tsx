import type { Metadata } from 'next'
import MemoriesContainer from './MemoriesContainer'

export const metadata: Metadata = {
  title: 'Our Memories · 5 Years & Happy Birthday',
  description: 'Every photo of us so far: a memory lane, an album and a slideshow, kept safe behind a little love-letter vault.',
}

export default function MemoriesPage() {
  return (
    <main className="flex w-full flex-1 flex-col">
      <MemoriesContainer />
    </main>
  )
}
