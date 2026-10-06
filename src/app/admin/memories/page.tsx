'use client'

import { useState, useEffect } from 'react'
import { fetchMemories, removeMemory } from '@/lib/storage'
import { Memory } from '@/data/initialData'
import { format } from 'date-fns'
import UploadForm from './UploadForm'
import { Trash2, Plus, Image as ImageIcon } from 'lucide-react'

export default function AdminMemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([])

  useEffect(() => {
    fetchMemories().then(setMemories)
  }, [])

  const handleMemorySaved = (newMemory: Memory) => {
    setMemories([newMemory, ...memories])
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this memory?')) {
      await removeMemory(id)
      setMemories(memories.filter((m) => m.id !== id))
    }
  }

  return (
    <div className="space-y-10 max-w-5xl">
      <div>
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Memories Studio</h1>
        <p className="text-gray-500 text-sm">Upload photos and manage your photo album in the cloud.</p>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold mb-4 text-gray-900 flex items-center gap-2">
          <Plus className="w-5 h-5 text-rose-500" /> Add a New Memory
        </h2>
        <UploadForm onMemorySaved={handleMemorySaved} />
      </div>

      <div>
        <h2 className="text-lg font-bold mb-4 text-gray-900 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-rose-500" /> Saved Memories ({memories.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {memories.map((memory) => (
            <div key={memory.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="relative w-full h-44 mb-3 rounded-xl overflow-hidden bg-gray-100">
                  <img src={memory.imagePath} alt={memory.title} className="object-cover w-full h-full" />
                </div>
                <h3 className="font-bold text-base text-gray-900 mb-1">{memory.title}</h3>
                <p className="text-xs text-gray-400 mb-2">{format(new Date(memory.date), 'PP')}</p>
                <p className="text-gray-600 text-xs line-clamp-2 mb-4">{memory.caption}</p>
              </div>
              
              <div className="pt-2 border-t border-gray-50 flex justify-end">
                <button 
                  onClick={() => handleDelete(memory.id)} 
                  className="text-red-500 hover:text-red-700 text-xs font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
          {memories.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400 text-sm">
              No memories uploaded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
