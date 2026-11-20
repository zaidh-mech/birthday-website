'use client'

import { useEffect, useRef, useState } from 'react'
import { fetchLetters, createLetter, updateLetter, removeLetter } from '@/lib/storage'
import { Letter } from '@/data/initialData'
import { Trash2, Plus, BookOpen, Edit2, X, Loader2 } from 'lucide-react'
import { Banner, PageHeader, errorMessage, safeFormat, ui, useNotice } from '../_components/ui'

const isVisibleLetter = (l: Letter) => !l.title.startsWith('[')
const amberButton = ui.primaryButton.replace('bg-gray-900', 'bg-amber-500').replace('hover:bg-gray-800', 'hover:bg-amber-600')

export default function AdminLettersPage() {
  const [letters, setLetters] = useState<Letter[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [occasion, setOccasion] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [notice, setNotice] = useNotice()
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    fetchLetters()
      .then((data) => !cancelled && setLetters(data))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const resetForm = () => {
    setEditId(null)
    setTitle('')
    setOccasion('')
    setContent('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || !occasion.trim()) return
    setSaving(true)
    setNotice(null)
    try {
      if (editId) {
        const updated = await updateLetter(editId, { title: title.trim(), occasion: occasion.trim(), content })
        setLetters((prev) => prev.map((l) => (l.id === editId ? updated : l)))
        setNotice({ tone: 'success', text: `"${updated.title}" was updated.` })
      } else {
        const created = await createLetter({ title: title.trim(), occasion: occasion.trim(), content })
        setLetters((prev) => [created, ...prev])
        setNotice({ tone: 'success', text: `"${created.title}" was saved. She can read it on the Letters page now.` })
      }
      resetForm()
    } catch (err) {
      setNotice({ tone: 'error', text: errorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (letter: Letter) => {
    setEditId(letter.id)
    setTitle(letter.title)
    setOccasion(letter.occasion)
    setContent(letter.content)
    setNotice(null)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleDelete = async (letter: Letter) => {
    if (!window.confirm(`Delete "${letter.title}"? This can't be undone.`)) return
    setDeletingId(letter.id)
    setNotice(null)
    try {
      await removeLetter(letter.id)
      setLetters((prev) => prev.filter((l) => l.id !== letter.id))
      if (editId === letter.id) resetForm()
      setNotice({ tone: 'success', text: `"${letter.title}" was deleted.` })
    } catch (err) {
      setNotice({ tone: 'error', text: errorMessage(err) })
    } finally {
      setDeletingId(null)
    }
  }

  const visible = letters.filter(isVisibleLetter)

  return (
    <div className="space-y-8 sm:space-y-10 max-w-5xl">
      <PageHeader title="Letters Studio" subtitle="Write letters for her. They appear on the Letters page, newest first." />

      <Banner notice={notice} onClose={() => setNotice(null)} />

      <div ref={formRef} className={`${ui.card} scroll-mt-20`}>
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            {editId ? <Edit2 className="w-5 h-5 text-amber-500" aria-hidden="true" /> : <Plus className="w-5 h-5 text-rose-500" aria-hidden="true" />}
            {editId ? 'Edit letter' : 'Write a new letter'}
          </h2>
          {editId && (
            <button type="button" onClick={resetForm} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm font-medium">
              <X className="w-4 h-4" aria-hidden="true" /> Cancel edit
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="letter-title" className={ui.label}>
                Title
              </label>
              <input
                id="letter-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. My favourite memory of us"
                required
                maxLength={160}
                className={ui.input}
              />
            </div>
            <div>
              <label htmlFor="letter-occasion" className={ui.label}>
                Occasion
              </label>
              <input
                id="letter-occasion"
                type="text"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                placeholder="e.g. Birthday, Anniversary, Just because"
                required
                maxLength={80}
                list="letter-occasions"
                className={ui.input}
              />
              <datalist id="letter-occasions">
                <option value="Birthday" />
                <option value="Anniversary" />
                <option value="Anniversary & Birthday" />
                <option value="Just Because" />
                <option value="Open When You Miss Me" />
                <option value="Open When You're Sad" />
              </datalist>
            </div>
          </div>
          <div>
            <label htmlFor="letter-content" className={ui.label}>
              Letter
            </label>
            <textarea
              id="letter-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your letter here… Paragraphs and line breaks are kept."
              rows={8}
              required
              className={ui.textarea}
            />
            <p className={`${ui.hint} mt-1 text-right`}>{content.trim() ? `${content.trim().split(/\s+/).length} words` : ''}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={saving} className={editId ? amberButton : ui.primaryButton}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              {saving ? 'Saving…' : editId ? 'Update letter' : 'Save letter'}
            </button>
            {editId && (
              <button type="button" onClick={resetForm} disabled={saving} className={ui.secondaryButton}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <section>
        <h2 className="text-lg font-bold mb-4 text-gray-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-rose-500" aria-hidden="true" /> Saved letters ({visible.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((letter) => (
            <article
              key={letter.id}
              className={`bg-white p-5 rounded-2xl shadow-sm border flex flex-col justify-between min-w-0 ${
                editId === letter.id ? 'border-amber-300 ring-2 ring-amber-50' : 'border-gray-100'
              }`}
            >
              <div className="min-w-0">
                <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider break-words">{letter.occasion}</span>
                <h3 className="font-bold text-lg text-gray-900 mt-1 mb-1 break-words">{letter.title}</h3>
                <p className="text-xs text-gray-400 mb-3">{safeFormat(letter.date)}</p>
                <p className="text-gray-600 text-sm line-clamp-3 mb-4 whitespace-pre-line break-words">{letter.content}</p>
              </div>

              <div className="pt-3 border-t border-gray-50 flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => handleEdit(letter)}
                  className="px-2.5 py-1.5 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 text-sm font-medium flex items-center gap-1"
                >
                  <Edit2 className="w-4 h-4" aria-hidden="true" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(letter)}
                  disabled={deletingId === letter.id}
                  className="px-2.5 py-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 text-sm font-medium flex items-center gap-1 disabled:opacity-50"
                >
                  {deletingId === letter.id ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Trash2 className="w-4 h-4" aria-hidden="true" />} Delete
                </button>
              </div>
            </article>
          ))}
          {!loading && visible.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-2xl">
              No letters yet. Write the first one above.
            </div>
          )}
          {loading && (
            <div className="col-span-full py-12 flex justify-center text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" aria-label="Loading letters" />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
