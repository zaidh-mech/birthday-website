'use client'

import { useEffect, useRef, useState } from 'react'
import { createMemory, updateMemory } from '@/lib/storage'
import { Memory } from '@/data/initialData'
import { Upload, Link as LinkIcon, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Banner, errorMessage, ui, useFilePreview, validateImageFile, type Notice } from '../_components/ui'

type Mode = 'file' | 'url'

const isHttpUrl = (value: string) => /^https?:\/\/\S+$/i.test(value.trim())

export default function UploadForm({
  onMemorySaved,
  editMemory,
  onCancelEdit,
}: {
  onMemorySaved: (memory: Memory) => void
  editMemory?: Memory | null
  onCancelEdit?: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [mode, setMode] = useState<Mode>('file')
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const filePreview = useFilePreview(selectedFile)

  useEffect(() => {
    setNotice(null)
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (editMemory) {
      setTitle(editMemory.title)
      setCaption(editMemory.caption)
      const external = editMemory.imagePath.startsWith('http') && !editMemory.imagePath.includes('/storage/v1/object/public/')
      setMode(external ? 'url' : 'file')
      setImageUrlInput(external ? editMemory.imagePath : '')
    } else {
      setTitle('')
      setCaption('')
      setImageUrlInput('')
      setMode('file')
    }
  }, [editMemory])

  const existingImage = editMemory?.imagePath || null
  const previewSrc = mode === 'file' ? filePreview || existingImage : isHttpUrl(imageUrlInput) ? imageUrlInput.trim() : null

  const pickFile = (file: File | null | undefined) => {
    if (!file) return
    const problem = validateImageFile(file)
    if (problem) {
      setNotice({ tone: 'error', text: problem })
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setNotice(null)
    setSelectedFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setNotice(null)
    if (!title.trim()) {
      setNotice({ tone: 'error', text: 'Please give the memory a title.' })
      return
    }
    if (mode === 'file' && !selectedFile && !editMemory) {
      setNotice({ tone: 'error', text: 'Please choose a photo to upload.' })
      return
    }
    if (mode === 'url' && !isHttpUrl(imageUrlInput)) {
      setNotice({ tone: 'error', text: 'Please paste a full photo link that starts with https://' })
      return
    }

    setUploading(true)
    try {
      const payload = {
        title: title.trim(),
        caption: caption.trim(),
        imagePath: mode === 'url' ? imageUrlInput.trim() : editMemory?.imagePath,
        file: mode === 'file' ? selectedFile : null,
      }
      const saved = editMemory ? await updateMemory(editMemory.id, payload) : await createMemory(payload)
      onMemorySaved(saved)

      if (!editMemory) {
        setTitle('')
        setCaption('')
        setSelectedFile(null)
        setImageUrlInput('')
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    } catch (err) {
      console.error(err)
      setNotice({ tone: 'error', text: errorMessage(err) })
    } finally {
      setUploading(false)
    }
  }

  const tabClass = (active: boolean) =>
    `flex items-center gap-2 text-xs font-semibold uppercase tracking-wider pb-1.5 border-b-2 transition-colors ${
      active ? 'text-rose-600 border-rose-600' : 'text-gray-400 border-transparent hover:text-gray-600'
    }`

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Banner notice={notice} onClose={() => setNotice(null)} />

      <div className="flex gap-5 border-b border-gray-100" role="group" aria-label="Photo source">
        <button type="button" aria-pressed={mode === 'file'} onClick={() => setMode('file')} className={tabClass(mode === 'file')}>
          <Upload className="w-3.5 h-3.5" aria-hidden="true" /> {editMemory ? 'Change file' : 'Upload file'}
        </button>
        <button type="button" aria-pressed={mode === 'url'} onClick={() => setMode('url')} className={tabClass(mode === 'url')}>
          <LinkIcon className="w-3.5 h-3.5" aria-hidden="true" /> Photo link
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        <div className="space-y-4 min-w-0">
          <div>
            <label htmlFor="memory-title" className={ui.label}>
              Title
            </label>
            <input
              id="memory-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sunset at Galle Face"
              required
              maxLength={120}
              className={ui.input}
            />
          </div>
          <div>
            <label htmlFor="memory-caption" className={ui.label}>
              Caption / the story behind it <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              id="memory-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What were we doing, what made it special…"
              rows={4}
              className={ui.textarea}
            />
          </div>

          {mode === 'url' ? (
            <div>
              <label htmlFor="memory-url" className={ui.label}>
                Photo link
              </label>
              <input
                id="memory-url"
                type="url"
                inputMode="url"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="https://…"
                className={ui.input}
              />
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                pickFile(e.dataTransfer.files?.[0])
              }}
              className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center transition-colors ${dragging ? 'border-rose-400 bg-rose-50' : 'border-gray-200 bg-gray-50/50'}`}
            >
              <label htmlFor="memory-file" className="block text-xs text-gray-500 mb-2">
                {editMemory ? 'Pick a new photo to replace the current one (optional)' : 'Pick a photo or drop it here'}
              </label>
              <input
                id="memory-file"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => pickFile(e.target.files?.[0])}
                className="block w-full max-w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 cursor-pointer"
              />
              {selectedFile && (
                <p className="mt-2 text-[11px] text-gray-400 truncate">
                  {selectedFile.name} · {(selectedFile.size / 1024 / 1024).toFixed(1)} MB (large photos are shrunk before upload)
                </p>
              )}
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden min-h-[180px] md:min-h-[240px] relative">
          {previewSrc ? (
            <img src={previewSrc} alt="Preview of the memory photo" className="absolute inset-0 w-full h-full object-cover [object-position:center_30%]" />
          ) : (
            <div className="flex flex-col items-center text-gray-400 gap-1">
              <ImageIcon className="w-8 h-8 opacity-40" aria-hidden="true" />
              <span className="text-xs font-light">Photo preview</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-1">
        <button type="submit" disabled={uploading} className={ui.primaryButton}>
          {uploading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          {uploading ? (selectedFile ? 'Uploading…' : 'Saving…') : editMemory ? 'Update memory' : 'Save memory'}
        </button>
        {editMemory && onCancelEdit && (
          <button type="button" onClick={onCancelEdit} disabled={uploading} className={ui.secondaryButton}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
