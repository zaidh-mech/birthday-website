'use client'

import { useState, useEffect, useRef } from 'react'
import { fetchPolaroids, createPolaroid, removePolaroid, Polaroid } from '@/lib/storage'
import { Trash2, Plus, Image as ImageIcon, Loader2 } from 'lucide-react'

export default function AdminPolaroidsPage() {
  const [polaroids, setPolaroids] = useState<Polaroid[]>([])
  const [loading, setLoading] = useState(false)
  const [caption, setCaption] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchPolaroids().then(setPolaroids)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile && !preview) return

    setLoading(true)
    try {
      // Mock local URL if no file (shouldn't happen here)
      const data = {
        caption,
        imagePath: preview || '/placeholder.jpg'
      }
      
      const newPolaroid = await createPolaroid(data, selectedFile || undefined)
      setPolaroids([newPolaroid, ...polaroids])
      
      setCaption('')
      setSelectedFile(null)
      setPreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      console.error(err)
      alert("Failed to upload Polaroid")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this Polaroid?')) {
      await removePolaroid(id)
      setPolaroids(polaroids.filter(p => p.id !== id))
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Polaroid Vault</h1>
        <p className="text-sm text-gray-500 mt-1">Upload cute photos to scatter across the homepage.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <form onSubmit={handleUpload} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 sticky top-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-rose-500" />
              Add New Polaroid
            </h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Photo</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full aspect-square object-cover rounded-lg" />
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

            <button 
              type="submit" 
              disabled={loading || (!selectedFile && !preview)}
              className="w-full bg-rose-600 text-white py-2.5 rounded-xl font-medium hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Uploading...' : 'Save Polaroid'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {polaroids.map((p) => (
              <div key={p.id} className="bg-white p-3 pb-8 rounded-sm shadow-md border border-gray-100 relative group aspect-[3/4] flex flex-col">
                <img src={p.imagePath} alt={p.caption} className="w-full flex-1 object-cover" />
                {p.caption && (
                  <p className="font-serif text-center text-sm text-gray-700 mt-3 absolute bottom-2 left-0 right-0">{p.caption}</p>
                )}
                <button 
                  onClick={() => handleDelete(p.id)}
                  className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
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
