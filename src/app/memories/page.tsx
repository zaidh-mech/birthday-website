'use client'

import { useEffect, useState } from 'react'
import PasscodeForm from './PasscodeForm'
import MemoriesGallery from './MemoriesGallery'
import { getMemories, isSessionAuthorized } from '@/lib/storage'
import { Memory } from '@/data/initialData'

export default function MemoriesPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [memories, setMemories] = useState<Memory[]>([])

  useEffect(() => {
    const isAuth = isSessionAuthorized('viewer')
    setAuthorized(isAuth)
    if (isAuth) {
      setMemories(getMemories())
    }
  }, [])

  const handleUnlock = () => {
    setAuthorized(true)
    setMemories(getMemories())
  }

  if (authorized === null) {
    return <main className="flex-1 flex items-center justify-center p-6"></main>
  }

  if (!authorized) {
    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <PasscodeForm onUnlock={handleUnlock} />
      </main>
    )
  }

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto p-6 pt-32 pb-24">
      <div className="text-center mb-16 space-y-4">
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-900">Our Memories</h1>
        <p className="font-sans text-gray-500 font-light">Snapshots of our time together.</p>
      </div>

      <MemoriesGallery memories={memories} />
    </main>
  )
}
