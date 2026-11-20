'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { format } from 'date-fns'

const fieldBase =
  'w-full min-w-0 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 disabled:opacity-60'

/**
 * Shared class names so every admin page looks the same. (Don't append conflicting utilities: pick a variant.)
 * Fields stay at 16px on phones: iOS Safari zooms the page into any field smaller than that.
 */
export const ui = {
  card: 'bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100',
  input: `${fieldBase} px-3.5 py-2.5 text-base sm:text-sm`,
  inputSm: `${fieldBase} px-2.5 py-2 text-base sm:text-xs`,
  textarea: `${fieldBase} px-3.5 py-3 text-base sm:text-sm leading-relaxed resize-y`,
  mono: `${fieldBase} px-3.5 py-2.5 text-base sm:text-xs font-mono break-all`,
  letter: `${fieldBase} p-4 text-base font-serif leading-relaxed resize-y`,
  label: 'block text-xs font-semibold text-gray-700 mb-1',
  hint: 'text-xs text-gray-500',
  pageTitle: 'text-2xl sm:text-3xl font-serif font-bold text-gray-900',
  pageSubtitle: 'text-gray-500 text-sm mt-1',
  primaryButton:
    'inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2',
  roseButton:
    'inline-flex items-center justify-center gap-2 bg-rose-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2',
  secondaryButton:
    'inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300',
  iconButton:
    'inline-flex items-center justify-center p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300',
  dangerIconButton:
    'inline-flex items-center justify-center p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300',
}

export type Notice = { tone: 'success' | 'error' | 'info'; text: string } | null

const toneStyles = {
  success: { box: 'bg-emerald-50 border-emerald-200 text-emerald-800', Icon: CheckCircle2, icon: 'text-emerald-600' },
  error: { box: 'bg-red-50 border-red-200 text-red-800', Icon: AlertCircle, icon: 'text-red-600' },
  info: { box: 'bg-sky-50 border-sky-200 text-sky-800', Icon: Info, icon: 'text-sky-600' },
} as const

/** Inline success / error / info message. */
export function Banner({ notice, onClose, className = '' }: { notice: Notice; onClose?: () => void; className?: string }) {
  if (!notice) return null
  const style = toneStyles[notice.tone]
  return (
    <div
      role={notice.tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 border rounded-2xl px-4 py-3 text-sm ${style.box} ${className}`}
    >
      <style.Icon className={`w-5 h-5 shrink-0 mt-px ${style.icon}`} aria-hidden="true" />
      <p className="flex-1 min-w-0 break-words leading-snug">{notice.text}</p>
      {onClose && (
        <button type="button" onClick={onClose} className="shrink-0 -m-1 p-1 rounded-md opacity-60 hover:opacity-100" aria-label="Dismiss message">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

/** A notice that clears itself after a while (errors stay until dismissed or replaced). */
export function useNotice(successMs = 4000): [Notice, (n: Notice) => void] {
  const [notice, setNotice] = useState<Notice>(null)
  useEffect(() => {
    if (!notice || notice.tone === 'error') return
    const t = window.setTimeout(() => setNotice(null), successMs)
    return () => window.clearTimeout(t)
  }, [notice, successMs])
  return [notice, setNotice]
}

export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof Error && err.message) return err.message
  if (typeof err === 'string' && err) return err
  return fallback
}

/** Object URL for a picked file, revoked automatically. */
export function useFilePreview(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!file) {
      setUrl(null)
      return
    }
    const next = URL.createObjectURL(file)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [file])
  return url
}

/** Formats a stored date without ever throwing on bad values. */
export function safeFormat(date: string | number | null | undefined, pattern = 'PP'): string {
  if (date === null || date === undefined || date === '') return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  try {
    return format(d, pattern)
  } catch {
    return ''
  }
}

export const MAX_UPLOAD_BYTES = 30 * 1024 * 1024

/** Returns an error message for files we shouldn't try to upload, or null. */
export function validateImageFile(file: File): string | null {
  if (file.type && !file.type.startsWith('image/')) return 'That file is not an image. Please pick a photo.'
  if (file.size > MAX_UPLOAD_BYTES) return 'That photo is larger than 30 MB. Please pick a smaller one.'
  return null
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className={ui.pageTitle}>{title}</h1>
        {subtitle && <p className={ui.pageSubtitle}>{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}
