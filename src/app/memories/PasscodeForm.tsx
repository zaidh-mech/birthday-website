'use client'

import { useState } from 'react'
import { verifyPasscode, setSessionAuthorized } from '@/lib/storage'
import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'

export default function PasscodeForm({ onUnlock }: { onUnlock: () => void }) {
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (verifyPasscode('viewer', passcode)) {
      setSessionAuthorized('viewer', true)
      onUnlock()
    } else {
      setError('Incorrect passcode. Please try again.')
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center"
    >
      <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <Lock className="w-5 h-5 text-rose-400" />
      </div>
      <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">Secret Garden</h2>
      <p className="text-sm text-gray-500 mb-8 font-light">Enter the passcode to view our memories.</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          value={passcode}
          onChange={(e) => {
            setPasscode(e.target.value)
            setError('')
          }}
          placeholder="Passcode"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200 transition-shadow text-center tracking-widest"
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-gray-900 text-white font-medium py-3 rounded-xl hover:bg-gray-800 transition-colors"
        >
          Unlock
        </button>
      </form>
    </motion.div>
  )
}
