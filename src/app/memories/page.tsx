import { checkViewer } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PasscodeForm from './PasscodeForm'
import MemoriesGallery from './MemoriesGallery'

export const dynamic = 'force-dynamic'

export default async function MemoriesPage() {
  const isAuthorized = await checkViewer()

  if (!isAuthorized) {
    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <PasscodeForm />
      </main>
    )
  }

  const memories = await prisma.memory.findMany({
    orderBy: { date: 'desc' }
  })

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto p-6 pt-32 pb-24">
      <div className="text-center mb-16 space-y-4">
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-900">Our Memories</h1>
        <p className="font-sans text-gray-500 font-light">Snapshots of our time together.</p>
      </div>

      <MemoriesGallery memories={memories} />
    </main>
  )
}
