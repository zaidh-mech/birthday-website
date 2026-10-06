'use client'

import { useEffect, useState } from 'react'
import AdminLogin from './AdminLogin'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { isSessionAuthorized, setSessionAuthorized, exportAllData } from '@/lib/storage'
import { Download, LogOut, BookOpen, Image as ImageIcon, ArrowLeft } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    setAuthorized(isSessionAuthorized('admin'))
  }, [])

  const handleLoginSuccess = () => {
    setAuthorized(true)
  }

  const handleLogout = () => {
    setSessionAuthorized('admin', false)
    setAuthorized(false)
  }

  const handleExportBackup = () => {
    const json = exportAllData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `birthday-website-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (authorized === null) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center" />
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <AdminLogin onLoginSuccess={handleLoginSuccess} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200 p-6 flex flex-col justify-between">
        <div>
          <div className="font-serif text-2xl font-bold mb-8 text-gray-900 flex items-center gap-2">
            <span>✦</span> Admin Studio
          </div>
          
          <nav className="space-y-1">
            <Link 
              href="/admin/letters" 
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                pathname === '/admin/letters' || pathname === '/admin' 
                  ? 'bg-rose-50 text-rose-700 font-semibold' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Manage Letters
            </Link>
            <Link 
              href="/admin/memories" 
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                pathname === '/admin/memories' 
                  ? 'bg-rose-50 text-rose-700 font-semibold' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Manage Memories
            </Link>
            
            <button
              onClick={handleExportBackup}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-left transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              Export Backup JSON
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-gray-100 space-y-2 mt-6">
          <Link 
            href="/" 
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Site
          </Link>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors text-left"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
