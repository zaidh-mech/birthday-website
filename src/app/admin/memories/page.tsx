import { prisma } from '@/lib/prisma'
import { createMemory, deleteMemory } from '@/app/actions/data'
import { format } from 'date-fns'
import Image from 'next/image'
import UploadForm from './UploadForm'

export const dynamic = 'force-dynamic'

export default async function AdminMemoriesPage() {
  const memories = await prisma.memory.findMany({ orderBy: { date: 'desc' } })

  return (
    <div className="space-y-10">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4">Add a New Memory</h2>
        <UploadForm />
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Saved Memories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {memories.map((memory) => (
            <div key={memory.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col">
              <div className="relative w-full h-40 mb-3 rounded-lg overflow-hidden bg-gray-100">
                <img src={memory.imagePath} alt={memory.title} className="object-cover w-full h-full" />
              </div>
              <h3 className="font-bold text-lg mb-1">{memory.title}</h3>
              <p className="text-xs text-gray-400 mb-2">{format(new Date(memory.date), 'PP')}</p>
              <p className="text-gray-600 text-sm line-clamp-2 mb-4 flex-1">{memory.caption}</p>
              
              <form action={async () => {
                'use server'
                await deleteMemory(memory.id)
              }}>
                <button type="submit" className="text-red-500 text-sm font-medium hover:underline">Delete</button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
