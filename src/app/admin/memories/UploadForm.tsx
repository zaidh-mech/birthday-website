'use client'

import { useRef, useState, useEffect } from 'react'
import { createMemory, updateMemory } from '@/lib/storage'
import { Memory } from '@/data/initialData'
import { Upload, Link as LinkIcon, Image as ImageIcon } from 'lucide-react'

export default function UploadForm({ onMemorySaved, editMemory, onCancelEdit }: { onMemorySaved: (memory: Memory) => void, editMemory?: Memory | null, onCancelEdit?: () => void }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [useUrlMode, setUseUrlMode] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (editMemory) {
      setTitle(editMemory.title)
      setCaption(editMemory.caption)
      setPreview(editMemory.imagePath)
      if (editMemory.imagePath && editMemory.imagePath.startsWith('http')) {
        setUseUrlMode(true)
        setImageUrlInput(editMemory.imagePath)
      } else {
        setUseUrlMode(false)
        setImageUrlInput('')
      }
      setSelectedFile(null)
    } else {
      setTitle('')
      setCaption('')
      setPreview(null)
      setImageUrlInput('')
      setUseUrlMode(false)
      setSelectedFile(null)
    }
  }, [editMemory])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setSelectedFile(null)
      setPreview(editMemory?.imagePath || null)
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrlInput(e.target.value)
    setPreview(e.target.value || null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!useUrlMode && !selectedFile && !preview) {
      alert('Please select a photo to upload.')
      return
    }
    if (useUrlMode && !imageUrlInput && !preview) {
      alert('Please enter a photo URL.')
      return
    }
    if (!title || !caption) {
      alert('Please enter a title and caption.')
      return
    }

    setUploading(true)
    try {
      let savedMemory: Memory;
      
      if (editMemory) {
        savedMemory = await updateMemory(editMemory.id, {
          title,
          caption,
          imagePath: useUrlMode ? imageUrlInput : preview || undefined,
          file: useUrlMode ? null : selectedFile,
        })
      } else {
        savedMemory = await createMemory({
          title,
          caption,
          imagePath: useUrlMode ? imageUrlInput : preview || undefined,
          file: useUrlMode ? null : selectedFile,
        })
      }

      onMemorySaved(savedMemory)
      
      if (!editMemory) {
        setTitle('')
        setCaption('')
        setPreview(null)
        setSelectedFile(null)
        setImageUrlInput('')
        formRef.current?.reset()
      }
    } catch (err: any) {
      console.error(err)
      alert('Error saving memory: ' + (err.message || 'Unknown error'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-4 border-b border-gray-100 pb-3">
        <button
          type="button"
          onClick={() => setUseUrlMode(false)}
          className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider pb-1 transition-colors ${
            !useUrlMode ? 'text-rose-600 border-b-2 border-rose-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Upload className="w-3.5 h-3.5" /> {editMemory ? 'Change File' : 'Upload File'}
        </button>
        <button
          type="button"
          onClick={() => setUseUrlMode(true)}
          className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider pb-1 transition-colors ${
            useUrlMode ? 'text-rose-600 border-b-2 border-rose-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" /> Photo URL
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Memory Title (e.g. Sunset in Venice)" 
            required 
            className="px-4 py-2.5 border border-gray-200 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-rose-200" 
          />
          <textarea 
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption or story behind this photo..." 
            rows={4} 
            required 
            className="px-4 py-3 border border-gray-200 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 custom-scrollbar"
          ></textarea>
          
          {useUrlMode ? (
            <input 
              type="url" 
              value={imageUrlInput}
              onChange={handleUrlChange}
              placeholder="Paste direct image URL (https://...)" 
              required={!editMemory}
              className="px-4 py-2.5 border border-gray-200 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-rose-200" 
            />
          ) : (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center bg-gray-50/50">
              <input 
                type="file" 
                accept="image/*" 
                required={!preview}
                onChange={handleFileChange} 
                className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 cursor-pointer" 
              />
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden min-h-[160px] md:h-auto relative">
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full max-h-60 object-cover" />
          ) : (
            <div className="flex flex-col items-center text-gray-400 gap-1">
              <ImageIcon className="w-8 h-8 opacity-40" />
              <span className="text-xs font-light">Image Preview</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex gap-3 pt-2">
        <button 
          type="submit" 
          disabled={uploading}
          className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {uploading ? 'Saving...' : (editMemory ? 'Update Memory' : 'Save Memory')}
        </button>
        {editMemory && onCancelEdit && (
          <button 
            type="button" 
            onClick={onCancelEdit}
            disabled={uploading}
            className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
