import MemoriesContainer from './MemoriesContainer'

export const dynamic = 'force-dynamic'

export default function MemoriesPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center min-h-screen">
      <MemoriesContainer />
    </main>
  )
}
