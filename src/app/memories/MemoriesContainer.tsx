'use client'

import { useState } from 'react'
import { getMemoriesWithPasscode } from '@/app/actions/memoriesAuth'
import MemoriesGallery from './MemoriesGallery'
import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'

type Memory = {
  id: string
  title: string
  imagePath: string
  caption: string
  date: Date
}

export default function MemoriesContainer() {
  const [memories, setMemories] = useState<Memory[] | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    const passcode = formData.get('password') as string
    
    try {
      const res = await getMemoriesWithPasscode(passcode)
      if (res.success && res.memories) {
        setMemories(res.memories)
      } else {
        setError('Incorrect passcode.')
      }
    } catch (err) {
      setError('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (memories) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6 pt-32 pb-24">
        <div className="text-center mb-16 space-y-4">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-900">Our Memories</h1>
          <p className="font-sans text-gray-500 font-light">Snapshots of our time together.</p>
        </div>
        <MemoriesGallery memories={memories} />
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center mx-6"
    >
      <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <Lock className="w-5 h-5 text-rose-400" />
      </div>
      <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">Secret Garden</h2>
      <p className="text-sm text-gray-500 mb-8 font-light">Enter the passcode to view our memories.</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          name="password"
          placeholder="Passcode"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200 transition-shadow text-center tracking-widest"
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white font-medium py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-70"
        >
          {loading ? 'Unlocking...' : 'Unlock'}
        </button>
      </form>
    </motion.div>
  )
}
