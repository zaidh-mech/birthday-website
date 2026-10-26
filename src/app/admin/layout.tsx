'use client'

import { useEffect, useState } from 'react'
import AdminLogin from './AdminLogin'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { isSessionAuthorized, setSessionAuthorized, exportAllData } from '@/lib/storage'
import { getSupabaseCredentials, saveSupabaseCredentials, getSupabaseClient } from '@/lib/supabase'
import { Download, LogOut, BookOpen, Image as ImageIcon, ArrowLeft, Database, X, Check, Copy, Gift, Lock, Menu } from 'lucide-react'

const SUPABASE_SETUP_SQL = `-- Run this in Supabase SQL Editor:
create table if not exists public.letters (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  occasion text not null,
  date timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  caption text not null,
  image_path text not null,
  date timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.polaroids (
  id text primary key,
  image_url text not null,
  caption text,
  created_at timestamptz default now()
);

-- Grant permissions to anonymous and authenticated web visitors
grant all on table public.letters to anon, authenticated, service_role;
grant all on table public.memories to anon, authenticated, service_role;
grant all on table public.polaroids to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

alter table public.letters enable row level security;
alter table public.memories enable row level security;
alter table public.polaroids enable row level security;

drop policy if exists "public_read_letters" on public.letters;
drop policy if exists "public_write_letters" on public.letters;
create policy "public_read_letters" on public.letters for select using (true);
create policy "public_write_letters" on public.letters for all using (true) with check (true);

drop policy if exists "public_read_memories" on public.memories;
drop policy if exists "public_write_memories" on public.memories;
create policy "public_read_memories" on public.memories for select using (true);
create policy "public_write_memories" on public.memories for all using (true) with check (true);

drop policy if exists "public_read_polaroids" on public.polaroids;
drop policy if exists "public_write_polaroids" on public.polaroids;
create policy "public_read_polaroids" on public.polaroids for select using (true);
create policy "public_write_polaroids" on public.polaroids for all using (true) with check (true);

-- Storage bucket and policies
insert into storage.buckets (id, name, public) values ('memories', 'memories', true) on conflict (id) do update set public = true;

drop policy if exists "public_read_storage" on storage.objects;
drop policy if exists "public_write_storage" on storage.objects;
drop policy if exists "public_update_storage" on storage.objects;
drop policy if exists "public_delete_storage" on storage.objects;

create policy "public_read_storage" on storage.objects for select using (bucket_id = 'memories');
create policy "public_write_storage" on storage.objects for insert with check (bucket_id = 'memories');
create policy "public_update_storage" on storage.objects for update using (bucket_id = 'memories');
create policy "public_delete_storage" on storage.objects for delete using (bucket_id = 'memories');`

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [showDbModal, setShowDbModal] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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

  // Auto-close mobile drawer when navigating
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

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
    alert(client ? 'Supabase cloud credentials connected!' : 'Please check your Supabase URL and anon public key.')
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 sm:p-6">
        <AdminLogin onLoginSuccess={handleLoginSuccess} />
      </div>
    )
  }

  const navLinks = [
    { href: '/admin/letters', label: 'Manage Letters', icon: BookOpen, active: pathname === '/admin/letters' || pathname === '/admin' },
    { href: '/admin/memories', label: 'Manage Memories', icon: ImageIcon, active: pathname === '/admin/memories' },
    { href: '/admin/gift', label: 'Gift Settings', icon: Gift, active: pathname === '/admin/gift' },
    { href: '/admin/polaroids', label: 'Polaroids Vault', icon: ImageIcon, active: pathname === '/admin/polaroids' },
    { href: '/admin/safe', label: 'Love Letter Safe', icon: Lock, active: pathname === '/admin/safe' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <span className="font-serif text-lg font-bold text-gray-900 flex items-center gap-1.5">
            <span>✦</span> Admin Studio
          </span>
          <span 
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-400'}`}
            title={isConnected ? 'Cloud Connected' : 'Local Mode'}
          />
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu Dropdown / Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[57px] z-30 bg-gray-900/40 backdrop-blur-xs flex flex-col justify-between">
          <div className="bg-white border-b border-gray-200 p-5 space-y-4 max-h-[80vh] overflow-y-auto shadow-xl">
            <nav className="space-y-1.5">
              {navLinks.map((link) => {
                const IconComponent = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      link.active
                        ? 'bg-rose-50 text-rose-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    {link.label}
                  </Link>
                )
              })}

              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  setShowDbModal(true)
                }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-left transition-colors"
              >
                <span className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-rose-500" />
                  Cloud Database
                </span>
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleExportBackup()
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-left transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                Export Backup JSON
              </button>
            </nav>

            <div className="pt-4 border-t border-gray-100 space-y-2">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Site
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors text-left font-medium"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
          
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 p-6 flex-col justify-between shrink-0">
        <div>
          <div className="font-serif text-2xl font-bold mb-8 text-gray-900 flex items-center gap-2">
            <span>✦</span> Admin Studio
          </div>
          
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const IconComponent = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    link.active
                      ? 'bg-rose-50 text-rose-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {link.label}
                </Link>
              )
            })}
            
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

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-10 overflow-y-auto">
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
                Sync all letters, memories, and polaroids across every phone & computer.
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
                  placeholder="https://mugtcupwehermhxcssji.supabase.co"
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
