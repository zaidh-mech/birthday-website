'use client'

import { useState, useEffect } from 'react'
import { fetchMemories, createMemory, removeMemory } from '@/lib/storage'
import { Memory } from '@/data/initialData'
import { Upload, Trash2, Gift } from 'lucide-react'

export default function AdminGiftPage() {
  const [giftMemory, setGiftMemory] = useState<Memory | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMemories().then(mems => {
      const found = mems.find(m => m.title === '[GIFT_PHOTO]')
      if (found) setGiftMemory(found)
    })
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    setIsUploading(true)
    setError('')
    try {
      // If there's an existing one, delete it first
      if (giftMemory) {
        await removeMemory(giftMemory.id)
      }

      const newMem = await createMemory({
        title: '[GIFT_PHOTO]',
        caption: 'The cute fella for the date plan.',
        file: e.target.files[0]
      })

      setGiftMemory(newMem)
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-10 max-w-2xl">
      <div>
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Gift Settings</h1>
        <p className="text-gray-500 text-sm">Upload the "cute fella" photo that appears during the interactive gift planner.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center flex flex-col items-center">
        <Gift className="w-12 h-12 text-rose-400 mb-4" />
        
        {giftMemory ? (
          <div className="space-y-4 flex flex-col items-center">
            <img 
              src={giftMemory.imagePath} 
              alt="Cute fella" 
              className="w-48 h-48 object-cover rounded-2xl shadow-md border-4 border-rose-100" 
            />
            <p className="text-sm text-green-600 font-medium">Photo is live!</p>
            
            <label className="cursor-pointer px-6 py-2 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-black transition-colors inline-block mt-4">
              {isUploading ? 'Uploading...' : 'Replace Photo'}
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={isUploading} />
            </label>
          </div>
        ) : (
          <div className="space-y-4 flex flex-col items-center">
            <div className="w-48 h-48 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400">
              No photo uploaded
            </div>
            <label className="cursor-pointer px-6 py-3 bg-rose-500 text-white rounded-full text-sm font-medium hover:bg-rose-600 transition-colors inline-block mt-4 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              {isUploading ? 'Uploading...' : 'Upload Photo'}
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={isUploading} />
            </label>
          </div>
        )}

        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
      </div>
    </div>
  )
}
