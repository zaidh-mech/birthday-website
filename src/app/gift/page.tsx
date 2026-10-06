import GiftInteractive from './GiftInteractive'

export const metadata = {
  title: 'Your Birthday Gift',
  description: 'A special surprise just for you.',
}

export default function GiftPage() {
  return (
    <main className="flex-1 min-h-screen pt-24 pb-20 relative flex items-center justify-center">
      <GiftInteractive />
    </main>
  )
}
