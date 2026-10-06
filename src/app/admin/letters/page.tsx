'use client'

import { useState, useEffect } from 'react'
import { fetchLetters, createLetter, updateLetter, removeLetter } from '@/lib/storage'
import { Letter } from '@/data/initialData'
import { format } from 'date-fns'
import { Trash2, Plus, BookOpen, Edit2, X } from 'lucide-react'

export default function AdminLettersPage() {
  const [letters, setLetters] = useState<Letter[]>([])
  const [title, setTitle] = useState('')
  const [occasion, setOccasion] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  useEffect(() => {
    fetchLetters().then(setLetters)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !content || !occasion) return
    setSaving(true)
    
    if (editId) {
      const updated = await updateLetter(editId, { title, occasion, content })
      setLetters(letters.map(l => l.id === editId ? updated : l))
      setEditId(null)
    } else {
      const newLetter = await createLetter({ title, occasion, content })
      setLetters([newLetter, ...letters])
    }
    
    setTitle('')
    setOccasion('')
    setContent('')
    setSaving(false)
  }

  const handleEdit = (letter: Letter) => {
    setEditId(letter.id)
    setTitle(letter.title)
    setOccasion(letter.occasion)
    setContent(letter.content)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditId(null)
    setTitle('')
    setOccasion('')
    setContent('')
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this letter?')) {
      await removeLetter(id)
      setLetters(letters.filter((l) => l.id !== id))
      if (editId === id) cancelEdit()
    }
  }

  return (
    <div className="space-y-10 max-w-5xl">
      <div>
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Letters Studio</h1>
        <p className="text-gray-500 text-sm">Create and manage personal letters in the cloud.</p>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            {editId ? <Edit2 className="w-5 h-5 text-amber-500" /> : <Plus className="w-5 h-5 text-rose-500" />} 
            {editId ? 'Edit Letter' : 'Write a New Letter'}
          </h2>
          {editId && (
            <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm font-medium">
              <X className="w-4 h-4" /> Cancel Edit
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (e.g. My Favorite Memory of Us)" 
              required 
              className="px-4 py-2.5 border border-gray-200 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-rose-200" 
            />
            <input 
              type="text" 
              value={occasion} 
              onChange={(e) => setOccasion(e.target.value)}
              placeholder="Occasion (e.g. 21st Birthday, Anniversary)" 
              required 
              className="px-4 py-2.5 border border-gray-200 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-rose-200" 
            />
          </div>
          <textarea 
            value={content} 
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your letter here... You can use paragraphs and line breaks." 
            rows={6} 
            required 
            className="px-4 py-3 border border-gray-200 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 custom-scrollbar"
          ></textarea>
          <button 
            type="submit" 
            disabled={saving}
            className={`${editId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-gray-900 hover:bg-gray-800'} text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50`}
          >
            {saving ? 'Saving...' : editId ? 'Update Letter' : 'Save Letter'}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-4 text-gray-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-rose-500" /> Saved Letters ({letters.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {letters.map((letter) => (
            <div key={letter.id} className={`bg-white p-5 rounded-2xl shadow-sm border flex flex-col justify-between ${editId === letter.id ? 'border-amber-300 ring-2 ring-amber-50' : 'border-gray-100'}`}>
              <div>
                <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">{letter.occasion}</span>
                <h3 className="font-bold text-lg text-gray-900 mt-1 mb-1">{letter.title}</h3>
                <p className="text-xs text-gray-400 mb-3">{format(new Date(letter.date), 'PP')}</p>
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">{letter.content}</p>
              </div>
              
              <div className="pt-3 border-t border-gray-50 flex justify-end gap-3">
                <button 
                  onClick={() => handleEdit(letter)} 
                  className="text-gray-500 hover:text-amber-500 text-sm font-medium flex items-center gap-1"
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
                <button 
                  onClick={() => handleDelete(letter.id)} 
                  className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          ))}
          {letters.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400 text-sm">
              No letters saved yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
