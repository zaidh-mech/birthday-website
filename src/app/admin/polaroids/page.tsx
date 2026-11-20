'use client'

import { useEffect, useRef, useState } from 'react'
import { fetchPolaroids, createPolaroid, updatePolaroid, removePolaroid, Polaroid } from '@/lib/storage'
import { Trash2, Plus, Image as ImageIcon, Loader2, Edit3, X, Check } from 'lucide-react'
import { Banner, PageHeader, errorMessage, ui, useFilePreview, useNotice, validateImageFile } from '../_components/ui'

export default function AdminPolaroidsPage() {
  const [polaroids, setPolaroids] = useState<Polaroid[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [existingImage, setExistingImage] = useState<string | null>(null)
  const [notice, setNotice] = useNotice()
  const filePreview = useFilePreview(selectedFile)
  const preview = filePreview || existingImage

  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    fetchPolaroids()
      .then(setPolaroids)
      .finally(() => setLoadingList(false))
  }, [])

  const clearFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const problem = validateImageFile(file)
    if (problem) {
      setNotice({ tone: 'error', text: problem })
      clearFileInput()
      return
    }
    setNotice(null)
    setSelectedFile(file)
  }

  const handleEdit = (polaroid: Polaroid) => {
    setEditingId(polaroid.id)
    setCaption(polaroid.caption || '')
    setExistingImage(polaroid.imagePath)
    setSelectedFile(null)
    setNotice(null)
    clearFileInput()
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const resetForm = () => {
    setEditingId(null)
    setCaption('')
    setExistingImage(null)
    setSelectedFile(null)
    clearFileInput()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile && !existingImage) {
      setNotice({ tone: 'error', text: 'Please choose a photo first.' })
      return
    }

    setSaving(true)
    setNotice(null)
    try {
      if (editingId) {
        const updated = await updatePolaroid(editingId, { caption: caption.trim(), imagePath: existingImage || undefined }, selectedFile)
        setPolaroids((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
        setNotice({ tone: 'success', text: 'Polaroid updated.' })
      } else {
        const created = await createPolaroid({ caption: caption.trim(), imagePath: '' }, selectedFile || undefined)
        setPolaroids((prev) => [created, ...prev])
        setNotice({ tone: 'success', text: 'Polaroid added. It will show up on the home page.' })
      }
      resetForm()
    } catch (err) {
      console.error(err)
      setNotice({ tone: 'error', text: errorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this polaroid? This can't be undone.")) return
    setDeletingId(id)
    setNotice(null)
    try {
      await removePolaroid(id)
      setPolaroids((prev) => prev.filter((p) => p.id !== id))
      if (editingId === id) resetForm()
      setNotice({ tone: 'success', text: 'Polaroid deleted.' })
    } catch (err) {
      setNotice({ tone: 'error', text: errorMessage(err) })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-5xl space-y-8">
      <PageHeader title="Polaroid Vault" subtitle="Cute photos scattered across the home page. Tap any polaroid to edit it." />

      <Banner notice={notice} onClose={() => setNotice(null)} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <form ref={formRef} onSubmit={handleSubmit} className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 lg:sticky lg:top-6 scroll-mt-20">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                {editingId ? <Edit3 className="w-5 h-5 text-rose-500" aria-hidden="true" /> : <Plus className="w-5 h-5 text-rose-500" aria-hidden="true" />}
                {editingId ? 'Edit polaroid' : 'Add a polaroid'}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" /> Cancel
                </button>
              )}
            </div>

            <div>
              <span className={ui.label}>{editingId ? 'Photo (tap to change)' : 'Photo'}</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`w-full border-2 border-dashed rounded-xl p-3 text-center transition-colors relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 ${
                  editingId ? 'border-rose-300 hover:bg-rose-50/30' : 'border-gray-200 hover:bg-gray-50'
                }`}
                aria-label={preview ? 'Choose a different photo' : 'Choose a photo'}
              >
                {preview ? (
                  <span className="relative block">
                    <img src={preview} alt="" className="w-full aspect-square object-cover [object-position:center_30%] rounded-lg" />
                    <span className="absolute inset-x-0 bottom-0 rounded-b-lg bg-black/50 text-white text-xs font-medium py-1.5 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity">
                      Choose another photo
                    </span>
                  </span>
                ) : (
                  <span className="py-8 flex flex-col items-center text-gray-400">
                    <ImageIcon className="w-8 h-8 mb-2" aria-hidden="true" />
                    <span className="text-sm font-medium">Tap to select a photo</span>
                  </span>
                )}
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" tabIndex={-1} aria-hidden="true" />
            </div>

            <div>
              <label htmlFor="polaroid-caption" className={ui.label}>
                Cute caption <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                id="polaroid-caption"
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="e.g. My favourite smile…"
                maxLength={120}
                className={ui.input}
              />
            </div>

            <div className="space-y-2 pt-1">
              <button type="submit" disabled={saving || !preview} className={`${ui.roseButton} w-full`}>
                {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                {saving ? (editingId ? 'Saving changes…' : 'Uploading…') : editingId ? 'Update polaroid' : 'Save polaroid'}
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4 min-w-0">
          <h2 className="text-lg font-bold text-gray-800">In the vault ({polaroids.length})</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {polaroids.map((p) => {
              const isSelected = editingId === p.id
              return (
                <div key={p.id} className="relative group min-w-0">
                  <button
                    type="button"
                    onClick={() => handleEdit(p)}
                    aria-label={`Edit polaroid${p.caption ? `: ${p.caption}` : ''}`}
                    className={`block w-full text-left bg-white p-2 sm:p-3 rounded-sm shadow-md border transition-all duration-200 [@media(hover:hover)]:hover:-translate-y-1 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-300 ${
                      isSelected ? 'ring-4 ring-rose-400 border-rose-300 shadow-xl -translate-y-1' : 'border-gray-100 hover:border-rose-200'
                    }`}
                  >
                    <span className="block w-full aspect-[3/4] bg-gray-100 overflow-hidden relative rounded-xs">
                      <img
                        src={p.imagePath}
                        alt={p.caption || 'Polaroid photo'}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover [object-position:center_30%]"
                      />
                    </span>
                    <span className="pt-2.5 pb-0.5 px-1 min-h-[2.25rem] flex items-center justify-center">
                      <span className="font-cursive text-center text-sm sm:text-base text-gray-700 leading-tight break-words line-clamp-2">{p.caption}</span>
                    </span>
                    {isSelected && (
                      <span className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                        <Check className="w-3 h-3" aria-hidden="true" /> Editing
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                    aria-label="Delete polaroid"
                    title="Delete polaroid"
                    className="absolute -top-2.5 -right-2.5 z-10 bg-red-500 text-white p-2 rounded-full shadow-lg transition-opacity hover:bg-red-600 focus:opacity-100 disabled:opacity-60 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100"
                  >
                    {deletingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              )
            })}
            {!loadingList && polaroids.length === 0 && (
              <div className="col-span-full text-center py-16 text-gray-400 font-light border-2 border-dashed border-gray-200 rounded-2xl">
                No polaroids in the vault yet.
              </div>
            )}
            {loadingList && (
              <div className="col-span-full py-16 flex justify-center text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" aria-label="Loading polaroids" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
