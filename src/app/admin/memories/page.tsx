'use client'

import { useState, useEffect } from 'react'
import { fetchMemories, removeMemory, reorderMemories } from '@/lib/storage'
import { Memory } from '@/data/initialData'
import UploadForm from './UploadForm'
import { Trash2, Plus, Image as ImageIcon, Edit2, ArrowUp, ArrowDown } from 'lucide-react'

export default function AdminMemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null)
  const [reordering, setReordering] = useState(false)

  useEffect(() => {
    fetchMemories().then(setMemories)
  }, [])

  const handleMemorySaved = (savedMemory: Memory) => {
    setMemories(prev => {
      const exists = prev.find(m => m.id === savedMemory.id)
      if (exists) {
        return prev.map(m => m.id === savedMemory.id ? savedMemory : m)
      }
      return [savedMemory, ...prev]
    })
    setEditingMemory(null)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this memory?')) {
      await removeMemory(id)
      setMemories(memories.filter((m) => m.id !== id))
    }
  }

  const handleEdit = (memory: Memory) => {
    setEditingMemory(memory)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingMemory(null)
  }

  const moveMemory = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === memories.length - 1) return

    setReordering(true)
    const newMemories = [...memories]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    
    // Swap
    const temp = newMemories[index]
    newMemories[index] = newMemories[swapIndex]
    newMemories[swapIndex] = temp

    // Optimistic UI update
    setMemories(newMemories)

    try {
      const orderedIds = newMemories.map(m => m.id)
      await reorderMemories(orderedIds)
    } catch (e) {
      console.error('Reorder failed', e)
      // revert if failed
      setMemories(memories)
      alert('Failed to reorder. Please try again.')
    } finally {
      setReordering(false)
    }
  }

  return (
    <div className="space-y-10 max-w-5xl">
      <div>
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Memories Studio</h1>
        <p className="text-gray-500 text-sm">Upload photos and manage your photo album in the cloud.</p>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 transition-all">
        <h2 className="text-lg font-bold mb-4 text-gray-900 flex items-center gap-2">
          {editingMemory ? <Edit2 className="w-5 h-5 text-rose-500" /> : <Plus className="w-5 h-5 text-rose-500" />} 
          {editingMemory ? 'Edit Memory' : 'Add a New Memory'}
        </h2>
        <UploadForm 
          onMemorySaved={handleMemorySaved} 
          editMemory={editingMemory} 
          onCancelEdit={handleCancelEdit} 
        />
      </div>

      <div>
        <h2 className="text-lg font-bold mb-4 text-gray-900 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-rose-500" /> Saved Memories ({memories.length})
        </h2>
        
        {reordering && <p className="text-xs text-rose-500 font-medium mb-4">Saving order...</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {memories.filter(m => m.title !== '[GIFT_PHOTO]').map((memory, index) => (
            <div key={memory.id} className={`bg-white p-4 rounded-2xl shadow-sm border flex flex-col justify-between transition-colors ${editingMemory?.id === memory.id ? 'border-rose-400 ring-1 ring-rose-400' : 'border-gray-100'}`}>
              <div>
                <div className="relative w-full h-44 mb-3 rounded-xl overflow-hidden bg-gray-100">
                  <img src={memory.imagePath} alt={memory.title} className="object-cover w-full h-full" />
                </div>
                <h3 className="font-bold text-base text-gray-900 mb-1">{memory.title}</h3>
                <p className="text-gray-600 text-xs line-clamp-2 mb-4">{memory.caption}</p>
              </div>
              
              <div className="pt-2 border-t border-gray-50 flex justify-between items-center">
                <div className="flex gap-1">
                  <button 
                    onClick={() => moveMemory(index, 'up')}
                    disabled={index === 0 || reordering}
                    className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move Up (Appears earlier)"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => moveMemory(index, 'down')}
                    disabled={index === memories.length - 1 || reordering}
                    className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move Down (Appears later)"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleEdit(memory)} 
                    disabled={reordering}
                    className="text-gray-500 hover:text-gray-900 text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(memory.id)} 
                    disabled={reordering}
                    className="text-red-500 hover:text-red-700 text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
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
