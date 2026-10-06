'use client'

import { useState } from 'react'
import { verifyPasscode, setSessionAuthorized } from '@/lib/storage'
import { Lock } from 'lucide-react'

export default function AdminLogin({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (verifyPasscode('admin', passcode)) {
      setSessionAuthorized('admin', true)
      onLoginSuccess()
    } else {
      setError('Invalid admin passcode.')
    }
  }

  return (
    <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center">
      <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <Lock className="w-5 h-5 text-rose-400" />
      </div>
      <h1 className="text-2xl font-serif font-bold mb-2 text-gray-900">Admin Studio</h1>
      <p className="text-sm text-gray-500 mb-6 font-light">Enter passcode to manage letters & memories.</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="password"
            value={passcode}
            onChange={(e) => {
              setPasscode(e.target.value)
              setError('')
            }}
            placeholder="Admin Passcode"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-200 outline-none text-center tracking-widest text-sm"
            required
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-gray-900 text-white font-medium py-3 rounded-xl hover:bg-gray-800 transition-colors text-sm"
        >
          Sign In
        </button>
      </form>
    </div>
  )
}
