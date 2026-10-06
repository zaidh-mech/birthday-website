'use client'

import { useEffect, useState } from 'react'
import LettersClient from './LettersClient'
import { fetchLetters } from '@/lib/storage'
import { Letter } from '@/data/initialData'

export default function LettersPage() {
  const [letters, setLetters] = useState<Letter[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetchLetters().then((data) => {
      setLetters(data)
      setLoaded(true)
    })
  }, [])

  return (
    <main className="flex-1 max-w-4xl w-full mx-auto p-6 pt-32 pb-24">
      <div className="text-center mb-16 space-y-4">
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-900">Letters for You</h1>
        <p className="font-sans text-gray-500 font-light">Words I wrote when I was thinking of you.</p>
      </div>
      
      {loaded && <LettersClient letters={letters} />}
    </main>
  )
}
