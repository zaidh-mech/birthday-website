import { prisma } from '@/lib/prisma'
import { createLetter, deleteLetter } from '@/app/actions/data'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function AdminLettersPage() {
  const letters = await prisma.letter.findMany({ orderBy: { date: 'desc' } })

  return (
    <div className="space-y-10">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4">Write a New Letter</h2>
        <form action={createLetter} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input type="text" name="title" placeholder="Title" required className="px-4 py-2 border rounded-lg w-full" />
            <input type="text" name="occasion" placeholder="Occasion (e.g., Your 25th Birthday)" required className="px-4 py-2 border rounded-lg w-full" />
          </div>
          <textarea name="content" placeholder="Write your letter here..." rows={6} required className="px-4 py-2 border rounded-lg w-full custom-scrollbar"></textarea>
          <button type="submit" className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors">
            Save Letter
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Saved Letters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {letters.map((letter) => (
            <div key={letter.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col">
              <h3 className="font-bold text-lg mb-1">{letter.title}</h3>
              <p className="text-xs text-gray-400 mb-4">{format(new Date(letter.date), 'PP')} • {letter.occasion}</p>
              <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-1">{letter.content}</p>
              
              <form action={async () => {
                'use server'
                await deleteLetter(letter.id)
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
