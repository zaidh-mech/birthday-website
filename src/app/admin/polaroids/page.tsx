'use client'

import { useState, useEffect, useRef } from 'react'
import { fetchPolaroids, createPolaroid, updatePolaroid, removePolaroid, Polaroid } from '@/lib/storage'
import { Trash2, Plus, Image as ImageIcon, Loader2, Edit3, X, Check } from 'lucide-react'

export default function AdminPolaroidsPage() {
  const [polaroids, setPolaroids] = useState<Polaroid[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    fetchPolaroids().then(setPolaroids)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEdit = (polaroid: Polaroid) => {
    setEditingId(polaroid.id)
    setCaption(polaroid.caption || '')
    setPreview(polaroid.imagePath)
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setCaption('')
    setPreview(null)
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile && !preview) return

    setLoading(true)
    try {
      if (editingId) {
        const updated = await updatePolaroid(
          editingId,
          { caption, imagePath: preview || undefined },
          selectedFile || undefined
        )
        setPolaroids(polaroids.map(p => p.id === updated.id ? updated : p))
        handleCancelEdit()
      } else {
        const data = {
          caption,
          imagePath: preview || '/placeholder.jpg'
        }
        const newPolaroid = await createPolaroid(data, selectedFile || undefined)
        setPolaroids([newPolaroid, ...polaroids])
        handleCancelEdit()
      }
    } catch (err) {
      console.error(err)
      alert(editingId ? "Failed to update Polaroid" : "Failed to upload Polaroid")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this Polaroid?')) {
      if (editingId === id) {
        handleCancelEdit()
      }
      await removePolaroid(id)
      setPolaroids(polaroids.filter(p => p.id !== id))
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Polaroid Vault</h1>
        <p className="text-sm text-gray-500 mt-1">Upload and edit cute photos to scatter across the homepage.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <form 
            ref={formRef}
            onSubmit={handleSubmit} 
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 sticky top-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                {editingId ? (
                  <>
                    <Edit3 className="w-5 h-5 text-rose-500" />
                    Edit Polaroid
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-rose-500" />
                    Add New Polaroid
                  </>
                )}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {editingId ? 'Photo (click to change)' : 'Photo'}
              </label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors relative group ${
                  editingId ? 'border-rose-300 hover:bg-rose-50/30' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                {preview ? (
                  <div className="relative">
                    <img src={preview} alt="Preview" className="w-full aspect-square object-cover rounded-lg" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white text-xs font-medium">
                      Click to choose another photo
                    </div>
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center text-gray-400">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span className="text-sm font-medium">Click to select photo</span>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Cute Caption (Optional)</label>
              <input 
                type="text" 
                value={caption} 
                onChange={e => setCaption(e.target.value)}
                placeholder="e.g. My favorite smile..."
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>

            <div className="space-y-2 pt-1">
              <button 
                type="submit" 
                disabled={loading || (!selectedFile && !preview)}
                className="w-full bg-rose-600 text-white py-2.5 rounded-xl font-medium hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading 
                  ? (editingId ? 'Saving Changes...' : 'Uploading...') 
                  : (editingId ? 'Update Polaroid' : 'Save Polaroid')
                }
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="w-full bg-gray-100 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel Editing
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Polaroid Vault ({polaroids.length})</h2>
            <span className="text-xs text-gray-400">Tip: Click any polaroid to edit it</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {polaroids.map((p) => {
              const isSelected = editingId === p.id
              return (
                <div 
                  key={p.id} 
                  onClick={() => handleEdit(p)}
                  className={`bg-white p-3 pb-8 rounded-sm shadow-md border relative group aspect-[3/4] flex flex-col cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
                    isSelected 
                      ? 'ring-4 ring-rose-400 border-rose-300 shadow-xl -translate-y-1 bg-rose-50/20' 
                      : 'border-gray-100 hover:border-rose-200'
                  }`}
                >
                  <img src={p.imagePath} alt={p.caption} className="w-full flex-1 object-cover" />
                  {p.caption && (
                    <p className="font-serif text-center text-sm text-gray-700 mt-3 absolute bottom-2 left-0 right-0 px-2 line-clamp-1">
                      {p.caption}
                    </p>
                  )}

                  {/* Active Editing indicator */}
                  {isSelected ? (
                    <span className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                      <Check className="w-3 h-3" /> Editing
                    </span>
                  ) : (
                    /* Hover hint */
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-sm flex items-center justify-center pointer-events-none">
                      <span className="bg-white/95 text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-rose-500" /> Click to Edit
                      </span>
                    </div>
                  )}

                  {/* Delete button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(p.id)
                    }}
                    title="Delete Polaroid"
                    className="absolute -top-3 -right-3 z-10 bg-red-500 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 focus:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
            {polaroids.length === 0 && (
              <div className="col-span-full text-center py-20 text-gray-400 font-light border-2 border-dashed border-gray-200 rounded-2xl">
                No polaroids in the vault yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
