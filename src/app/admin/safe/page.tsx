'use client'

import { useState, useEffect } from 'react'
import { createLetter, fetchLetters, removeLetter } from '@/lib/storage'
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react'

const DEFAULT_LETTER_TEXT = `To my dearest [pet name|baby],

From the very first time we went to [place|colombo], I knew you were someone special. I absolutely love your [feature|smile] and how you always make my days brighter. I can't wait to spend [time|forever] with you.

Yours always.`

export default function SafeConfigPage() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    async function loadConfig() {
      const letters = await fetchLetters()
      const lockLetter = letters.find(l => l.title === '[LOCK_LETTER]')
      if (lockLetter) {
        setText(lockLetter.content)
      } else {
        setText(DEFAULT_LETTER_TEXT)
      }
      setLoading(false)
    }
    loadConfig()
  }, [])

  async function handleSave() {
    setSaving(true)
    setMessage('')
    setIsError(false)

    try {
      // Find and remove old lock letter(s)
      const letters = await fetchLetters()
      const oldLetters = letters.filter(l => l.title === '[LOCK_LETTER]')
      for (const old of oldLetters) {
        await removeLetter(old.id)
      }

      // Create new lock letter
      await createLetter({
        title: '[LOCK_LETTER]',
        content: text,
        occasion: 'lock'
      })

      setMessage('Love Letter Safe updated successfully!')
    } catch (err) {
      console.error(err)
      setIsError(true)
      setMessage('Failed to save config.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Love Letter Safe Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Customize the interactive Love Letter that unlocks the Memories page.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="mb-6 space-y-4">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>How to create hidden fill-in-the-blanks:</strong></p>
              <p>Type your letter normally. When you want to create a blank that she has to fill in, use brackets like this: <code>[placeholder|answer]</code>.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Placeholder:</strong> The hint shown inside the empty box (e.g., "pet name")</li>
                <li><strong>Answer:</strong> The exact word she needs to type to unlock it (e.g., "baby")</li>
              </ul>
              <p className="mt-2 font-mono bg-white/50 px-2 py-1 rounded inline-block text-blue-900 border border-blue-200">
                Example: "I love your [feature|smile] so much!"
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-semibold text-gray-700">
            Letter Text
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-80 p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200 resize-y font-serif text-gray-800"
            placeholder="Type your letter here..."
          />
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white font-medium rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-70"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>

          {message && (
            <span className={`flex items-center gap-2 text-sm font-medium ${isError ? 'text-red-600' : 'text-emerald-600'}`}>
              {!isError && <CheckCircle2 className="w-4 h-4" />}
              {message}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
