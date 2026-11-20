'use client'

import { useEffect, useRef, useState } from 'react'
import { fetchMemories, removeMemory, reorderMemories } from '@/lib/storage'
import { Memory } from '@/data/initialData'
import UploadForm from './UploadForm'
import { Trash2, Plus, Image as ImageIcon, Edit2, ArrowUp, ArrowDown, Loader2 } from 'lucide-react'
import { Banner, PageHeader, errorMessage, safeFormat, ui, useNotice } from '../_components/ui'

const GIFT_PHOTO_TITLE = '[GIFT_PHOTO]'

export default function AdminMemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null)
  const [reordering, setReordering] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [notice, setNotice] = useNotice()
  const formRef = useRef<HTMLDivElement>(null)

  const load = () =>
    fetchMemories()
      .then(setMemories)
      .finally(() => setLoading(false))

  useEffect(() => {
    void load()
  }, [])

  // The "cute fella" gift photo is managed on the Gift page and keeps its own place.
  const visible = memories.filter((m) => m.title !== GIFT_PHOTO_TITLE)
  const hidden = memories.filter((m) => m.title === GIFT_PHOTO_TITLE)

  const handleMemorySaved = (saved: Memory) => {
    const isEdit = Boolean(editingMemory)
    setMemories((prev) => (prev.some((m) => m.id === saved.id) ? prev.map((m) => (m.id === saved.id ? saved : m)) : [saved, ...prev]))
    setEditingMemory(null)
    setNotice({ tone: 'success', text: isEdit ? `"${saved.title}" was updated.` : `"${saved.title}" was added to the album.` })
  }

  const handleDelete = async (memory: Memory) => {
    if (!window.confirm(`Delete "${memory.title}"? This can't be undone.`)) return
    setDeletingId(memory.id)
    setNotice(null)
    try {
      await removeMemory(memory.id)
      setMemories((prev) => prev.filter((m) => m.id !== memory.id))
      if (editingMemory?.id === memory.id) setEditingMemory(null)
      setNotice({ tone: 'success', text: `"${memory.title}" was deleted.` })
    } catch (err) {
      setNotice({ tone: 'error', text: errorMessage(err) })
    } finally {
      setDeletingId(null)
    }
  }

  const handleEdit = (memory: Memory) => {
    setEditingMemory(memory)
    setNotice(null)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const moveMemory = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= visible.length) return

    const previous = memories
    const reordered = [...visible]
    ;[reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]]

    setReordering(true)
    setNotice(null)
    setMemories([...reordered, ...hidden]) // optimistic

    try {
      await reorderMemories(reordered.map((m) => m.id))
    } catch (err) {
      setMemories(previous)
      setNotice({ tone: 'error', text: errorMessage(err) })
      void load() // show what actually got saved
    } finally {
      setReordering(false)
    }
  }

  return (
    <div className="space-y-8 sm:space-y-10 max-w-5xl">
      <PageHeader title="Memories Studio" subtitle="Upload photos for the Memories album. The order here is the order she sees." />

      <Banner notice={notice} onClose={() => setNotice(null)} />

      <div ref={formRef} className={`${ui.card} scroll-mt-20`}>
        <h2 className="text-lg font-bold mb-4 text-gray-900 flex items-center gap-2">
          {editingMemory ? <Edit2 className="w-5 h-5 text-rose-500" aria-hidden="true" /> : <Plus className="w-5 h-5 text-rose-500" aria-hidden="true" />}
          {editingMemory ? 'Edit memory' : 'Add a new memory'}
        </h2>
        <UploadForm onMemorySaved={handleMemorySaved} editMemory={editingMemory} onCancelEdit={() => setEditingMemory(null)} />
      </div>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-rose-500" aria-hidden="true" /> Saved memories ({visible.length})
          </h2>
          {reordering && (
            <span className="text-xs text-rose-500 font-medium flex items-center gap-1.5" role="status">
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> Saving order…
            </span>
          )}
        </div>
        <p className={`${ui.hint} mb-4`}>
          Tip: the photos in the project&apos;s <code className="text-[11px]">assets/photos</code> folder are built into the site (games and galleries) at deploy time. Use this album for extra photos you want to add without redeploying.
        </p>

        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visible.map((memory, index) => (
            <article
              key={memory.id}
              className={`bg-white p-3 sm:p-4 rounded-2xl shadow-sm border flex flex-col justify-between min-w-0 transition-colors ${
                editingMemory?.id === memory.id ? 'border-rose-400 ring-1 ring-rose-400' : 'border-gray-100'
              }`}
            >
              <div className="min-w-0">
                <div className="relative w-full aspect-[4/3] mb-3 rounded-xl overflow-hidden bg-gray-100">
                  {memory.imagePath ? (
                    <img
                      src={memory.imagePath}
                      alt={memory.title}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover [object-position:center_30%]"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                      <ImageIcon className="w-8 h-8" aria-hidden="true" />
                    </div>
                  )}
                  <span className="absolute top-2 left-2 rounded-full bg-black/55 text-white text-[10px] font-semibold px-2 py-0.5">#{index + 1}</span>
                </div>
                <h3 className="font-bold text-base text-gray-900 mb-0.5 break-words">{memory.title}</h3>
                <p className="text-[11px] text-gray-400 mb-1">{safeFormat(memory.date)}</p>
                <p className="text-gray-600 text-xs line-clamp-2 mb-3 break-words">{memory.caption}</p>
              </div>

              <div className="pt-2 border-t border-gray-50 flex justify-between items-center gap-2">
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveMemory(index, 'up')}
                    disabled={index === 0 || reordering}
                    className={ui.iconButton}
                    aria-label={`Move "${memory.title}" earlier`}
                    title="Move earlier"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveMemory(index, 'down')}
                    disabled={index === visible.length - 1 || reordering}
                    className={ui.iconButton}
                    aria-label={`Move "${memory.title}" later`}
                    title="Move later"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleEdit(memory)}
                    disabled={reordering}
                    className="px-2 py-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                  >
                    <Edit2 className="w-3.5 h-3.5" aria-hidden="true" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(memory)}
                    disabled={reordering || deletingId === memory.id}
                    className="px-2 py-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                  >
                    {deletingId === memory.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />}
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
          {!loading && visible.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-2xl">
              No extra memories uploaded yet.
            </div>
          )}
          {loading && (
            <div className="col-span-full py-12 flex justify-center text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" aria-label="Loading memories" />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
