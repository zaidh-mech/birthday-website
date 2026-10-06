'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const isNightMode = theme === 'dark'

  return (
    <button 
      onClick={() => setTheme(isNightMode ? 'light' : 'dark')}
      className={`fixed bottom-6 right-6 md:bottom-auto md:top-6 md:right-6 z-50 p-3 rounded-full backdrop-blur-md transition-all duration-700 shadow-sm ${
        isNightMode ? 'bg-white/10 text-yellow-100 hover:bg-white/20' : 'bg-white/50 text-indigo-900 hover:bg-white/80'
      }`}
    >
      {isNightMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  )
}
