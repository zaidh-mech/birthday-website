import type { Metadata } from 'next'
import GiftInteractive from './GiftInteractive'

export const metadata: Metadata = {
  title: 'Your Surprise Gift',
  description: 'A little invitation, just for you.',
}

export default function GiftPage() {
  return (
    <main className="relative flex w-full flex-1 flex-col pb-28 pt-24 sm:pt-28 md:pb-16">
      <GiftInteractive />
    </main>
  )
}
