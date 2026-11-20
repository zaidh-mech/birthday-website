'use client'

import { useState } from 'react'
import Link from 'next/link'
import { verifyPasscode, setSessionAuthorized } from '@/lib/storage'
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react'

export default function AdminLogin({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [visible, setVisible] = useState(false)
  const [attempt, setAttempt] = useState(0)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (verifyPasscode('admin', passcode)) {
      setSessionAuthorized('admin', true)
      onLoginSuccess()
    } else {
      setAttempt((n) => n + 1)
      setError("That passcode isn't right. This area is for the site's creator.")
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div
        key={attempt}
        className={`bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 text-center ${attempt > 0 ? 'motion-safe:animate-[admin-shake_0.4s_ease-in-out]' : ''}`}
      >
        <style>{`@keyframes admin-shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>
        <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-5 h-5 text-rose-400" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-serif font-bold mb-2 text-gray-900">Admin Studio</h1>
        <p className="text-xs sm:text-sm text-gray-500 mb-6 font-light">Enter the passcode to manage letters, memories and games.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label htmlFor="admin-passcode" className="sr-only">
              Admin passcode
            </label>
            <input
              id="admin-passcode"
              type={visible ? 'text' : 'password'}
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value)
                setError('')
              }}
              placeholder="Admin passcode"
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'admin-passcode-error' : undefined}
              className="w-full pl-11 pr-11 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-200 outline-none text-center tracking-widest text-base sm:text-sm"
              required
              autoFocus
            />
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-gray-400 hover:text-gray-700"
              aria-label={visible ? 'Hide passcode' : 'Show passcode'}
            >
              {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {error && (
            <p id="admin-passcode-error" role="alert" className="text-red-500 text-xs sm:text-sm font-medium">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={!passcode.trim()}
            className="w-full bg-gray-900 text-white font-medium py-3 rounded-xl hover:bg-gray-800 transition-colors text-sm disabled:opacity-50"
          >
            Sign In
          </button>
        </form>
      </div>

      <Link
        href="/"
        className="mt-5 mx-auto flex w-fit items-center gap-1.5 text-sm text-gray-500 hover:text-rose-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to the site
      </Link>
    </div>
  )
}
