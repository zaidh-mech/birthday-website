import { prisma } from '@/lib/prisma'
import LettersClient from './LettersClient'

export const dynamic = 'force-dynamic'

export default async function LettersPage() {
  const letters = await prisma.letter.findMany({
    orderBy: { date: 'desc' }
  })

  return (
    <main className="flex-1 max-w-4xl w-full mx-auto p-6 pt-32 pb-24">
      <div className="text-center mb-16 space-y-4">
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-900">Letters for You</h1>
        <p className="font-sans text-gray-500 font-light">Words I wrote when I was thinking of you.</p>
      </div>
      
      <LettersClient letters={letters} />
    </main>
  )
}
