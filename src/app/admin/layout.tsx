'use client'

import { useEffect, useState } from 'react'
import AdminLogin from './AdminLogin'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { isSessionAuthorized, setSessionAuthorized, exportAllData } from '@/lib/storage'
import { getSupabaseCredentials, saveSupabaseCredentials, getSupabaseClient } from '@/lib/supabase'
import { Download, LogOut, BookOpen, Image as ImageIcon, ArrowLeft, Database, X, Check, Copy, Gift } from 'lucide-react'

const SUPABASE_SETUP_SQL = `-- Run this in Supabase SQL Editor:
create table if not exists letters (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  occasion text not null,
  date timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  caption text not null,
  image_path text not null,
  date timestamptz default now(),
  created_at timestamptz default now()
);

alter table letters enable row level security;
alter table memories enable row level security;

create policy "public_read_letters" on letters for select using (true);
create policy "public_write_letters" on letters for all using (true) with check (true);

create policy "public_read_memories" on memories for select using (true);
create policy "public_write_memories" on memories for all using (true) with check (true);`

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [showDbModal, setShowDbModal] = useState(false)
  const [supaUrl, setSupaUrl] = useState('')
  const [supaKey, setSupaKey] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [copiedSql, setCopiedSql] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setAuthorized(isSessionAuthorized('admin'))
    const creds = getSupabaseCredentials()
    setSupaUrl(creds.url)
    setSupaKey(creds.key)
    setIsConnected(Boolean(getSupabaseClient()))
  }, [])

  const handleLoginSuccess = () => {
    setAuthorized(true)
  }

  const handleLogout = () => {
    setSessionAuthorized('admin', false)
    setAuthorized(false)
  }

  const handleSaveSupabase = () => {
    saveSupabaseCredentials(supaUrl, supaKey)
    const client = getSupabaseClient()
    setIsConnected(Boolean(client))
    alert(client ? 'Supabase credentials saved and connected!' : 'Please check your URL and anon key.')
    if (client) {
      setShowDbModal(false)
      window.location.reload()
    }
  }

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL)
    setCopiedSql(true)
    setTimeout(() => setCopiedSql(false), 2000)
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
            <Link 
              href="/admin/gift" 
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                pathname === '/admin/gift' 
                  ? 'bg-rose-50 text-rose-700 font-semibold' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Gift className="w-4 h-4" />
              Gift Settings
            </Link>
            
            <button
              onClick={() => setShowDbModal(true)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-left transition-colors"
            >
              <span className="flex items-center gap-3">
                <Database className="w-4 h-4 text-rose-500" />
                Cloud Database
              </span>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            </button>

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

      {/* Supabase Cloud Connection Modal */}
      {showDbModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button 
              onClick={() => setShowDbModal(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="font-serif text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Database className="w-6 h-6 text-rose-500" /> Supabase Cloud Sync
              </h2>
              <p className="text-gray-500 text-xs mt-1">
                Sync all letters and photos across every phone & computer.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Supabase Project URL
                </label>
                <input 
                  type="url"
                  value={supaUrl}
                  onChange={(e) => setSupaUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Supabase Anon Public Key
                </label>
                <textarea 
                  value={supaKey}
                  onChange={(e) => setSupaKey(e.target.value)}
                  placeholder="eyJhbGciOi..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-rose-200"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveSupabase}
                className="w-full bg-gray-900 text-white font-medium py-2.5 rounded-xl text-sm hover:bg-gray-800 transition-colors"
              >
                Save & Connect Supabase
              </button>
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800">1-Minute Database Setup SQL</span>
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1 text-xs text-rose-600 font-medium hover:underline"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSql ? 'Copied!' : 'Copy SQL'}
                </button>
              </div>
              <p className="text-xs text-gray-400 font-light">
                Paste this into your Supabase Dashboard → <strong>SQL Editor</strong> to auto-create the tables and permissions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
