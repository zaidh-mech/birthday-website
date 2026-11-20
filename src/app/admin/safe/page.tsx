'use client'

import { useEffect, useMemo, useState } from 'react'
import { fetchLockLetter, saveLockLetter, fetchSafeUnlockedOverride, saveSafeUnlockedOverride } from '@/lib/storage'
import { AlertCircle, Loader2, LockOpen, RotateCcw, Save } from 'lucide-react'
import { Banner, PageHeader, errorMessage, ui, useNotice } from '../_components/ui'

/** Same default the Memories page falls back to. */
const DEFAULT_LETTER_TEXT = `To my dearest [pet name|baby],

From the very first time we went to [place|colombo], I knew you were someone special. I absolutely love your [feature|smile] and how you always make my days brighter. I can't wait to spend [time|forever] with you.

Yours always.`

/** Same pattern the Memories page uses to find the blanks. */
const BLANK_PATTERN = /\[([^[\]|]+)\|([^[\]]+)\]/g

export default function SafeConfigPage() {
  const [text, setText] = useState('')
  const [savedText, setSavedText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [notice, setNotice] = useNotice()

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchLockLetter(), fetchSafeUnlockedOverride()])
      .then(([letter, unlocked]) => {
        if (cancelled) return
        const initial = letter ?? DEFAULT_LETTER_TEXT
        setText(initial)
        setSavedText(initial)
        setIsUnlocked(unlocked)
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  // Like the Memories page: a blank whose answer is only spaces is shown as plain text, not a box.
  const blanks = useMemo(
    () =>
      Array.from(text.matchAll(BLANK_PATTERN))
        .map((m) => ({ hint: m[1].trim(), answer: m[2].trim() }))
        .filter((b) => b.answer),
    [text],
  )
  const brokenBrackets = useMemo(() => {
    const withoutBlanks = text.replace(BLANK_PATTERN, (match, _hint: string, answer: string) => (answer.trim() ? '' : match))
    return /\[[^\]]*\]/.test(withoutBlanks)
  }, [text])
  const dirty = text !== savedText

  const handleToggleUnlock = async () => {
    const next = !isUnlocked
    setIsUnlocked(next)
    setToggling(true)
    setNotice(null)
    try {
      await saveSafeUnlockedOverride(next)
      setNotice({
        tone: 'success',
        text: next ? 'The safe is open: she goes straight to the memories, no puzzle.' : 'The safe is locked again: she has to fill in the blanks.',
      })
    } catch (err) {
      setIsUnlocked(!next)
      setNotice({ tone: 'error', text: errorMessage(err) })
    } finally {
      setToggling(false)
    }
  }

  async function handleSave() {
    if (!text.trim()) {
      setNotice({ tone: 'error', text: 'The letter is empty.' })
      return
    }
    setSaving(true)
    setNotice(null)
    try {
      await saveLockLetter(text)
      setSavedText(text)
      setNotice({ tone: 'success', text: 'Love Letter Safe updated.' })
    } catch (err) {
      setNotice({ tone: 'error', text: errorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="py-16 flex justify-center text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" aria-label="Loading" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Love Letter Safe" subtitle="The fill-in-the-blanks letter she has to complete to open the Memories page." />

      <Banner notice={notice} onClose={() => setNotice(null)} />

      <div className="bg-white px-4 py-3.5 rounded-2xl border border-gray-200 flex items-center gap-3 shadow-sm">
        <div className="p-2 bg-rose-50 rounded-lg shrink-0">
          <LockOpen className="w-5 h-5 text-rose-600" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p id="unlock-label" className="text-sm font-bold text-gray-900 leading-tight">
            Open the safe for everyone
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Skips the puzzle on every device.</p>
        </div>
        {toggling && <Loader2 className="w-4 h-4 animate-spin text-gray-400 shrink-0" aria-hidden="true" />}
        <button
          type="button"
          role="switch"
          aria-checked={isUnlocked}
          aria-labelledby="unlock-label"
          onClick={handleToggleUnlock}
          disabled={toggling}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 disabled:opacity-60 ${
            isUnlocked ? 'bg-rose-500' : 'bg-gray-200'
          }`}
        >
          <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${isUnlocked ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      <div className={ui.card}>
        <div className="mb-6 bg-sky-50 border border-sky-100 p-4 rounded-xl flex gap-3">
          <AlertCircle className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm text-sky-900 space-y-2 min-w-0">
            <p>
              <strong>How to make a blank:</strong> type <code className="px-1 rounded bg-white/70">[hint|answer]</code>. She sees an empty box showing the hint and has to type the answer (not case-sensitive).
            </p>
            <p className="font-mono text-xs bg-white/60 px-2 py-1 rounded inline-block border border-sky-200 break-words">I love your [feature|smile] so much!</p>
          </div>
        </div>

        <label htmlFor="safe-letter" className="block text-sm font-semibold text-gray-700 mb-2">
          Letter text
        </label>
        <textarea
          id="safe-letter"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={`${ui.letter} h-72 sm:h-80`}
          placeholder="Type your letter here…"
        />

        <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 p-3 text-xs text-gray-600 space-y-2">
          <p className="font-semibold text-gray-700">
            {blanks.length === 0 ? 'No blanks yet: she would unlock the memories without typing anything.' : `${blanks.length} blank${blanks.length === 1 ? '' : 's'} she has to fill in:`}
          </p>
          {blanks.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {blanks.map((b, i) => (
                <li key={`${b.hint}-${i}`} className="rounded-full bg-white border border-gray-200 px-2.5 py-1">
                  <span className="text-gray-400">{b.hint}</span> → <span className="font-semibold text-rose-600">{b.answer}</span>
                </li>
              ))}
            </ul>
          )}
          {brokenBrackets && <p className="text-amber-700">Some [brackets] are missing the “|answer” part, so they will show as plain text.</p>}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button type="button" onClick={handleSave} disabled={saving || !dirty} className={ui.roseButton}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
            {saving ? 'Saving…' : dirty ? 'Save letter' : 'Saved'}
          </button>
          <button type="button" onClick={() => setText(DEFAULT_LETTER_TEXT)} disabled={saving || text === DEFAULT_LETTER_TEXT} className={ui.secondaryButton}>
            <RotateCcw className="w-4 h-4" aria-hidden="true" /> Use example letter
          </button>
          {dirty && <span className="text-xs text-amber-600">Unsaved changes</span>}
        </div>
      </div>
    </div>
  )
}
