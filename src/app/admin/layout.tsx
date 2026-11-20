'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import AdminLogin from './AdminLogin'
import CloudDatabaseModal from './_components/CloudDatabaseModal'
import { isSessionAuthorized, setSessionAuthorized, exportBackup, exportAllData } from '@/lib/storage'
import { checkCloudConnection } from '@/lib/supabase'
import { fetchSiteConfig } from '@/lib/siteConfig'
import { normalizePath } from '@/lib/basePath'
import {
  ArrowLeft,
  BookOpen,
  Camera,
  Database,
  Download,
  Gamepad2,
  Gift,
  Images,
  Loader2,
  Lock,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react'

type CloudStatus = 'checking' | 'online' | 'offline'

const NAV_LINKS: { href: string; label: string; icon: LucideIcon; alsoActiveOn?: string[] }[] = [
  { href: '/admin/letters', label: 'Letters', icon: BookOpen, alsoActiveOn: ['/admin'] },
  { href: '/admin/memories', label: 'Memories', icon: Images },
  { href: '/admin/polaroids', label: 'Polaroids Vault', icon: Camera },
  { href: '/admin/safe', label: 'Love Letter Safe', icon: Lock },
  { href: '/admin/gift', label: 'Gift & Date', icon: Gift },
  { href: '/admin/site', label: 'Site & Games', icon: Gamepad2 },
]

const STATUS_LABEL: Record<CloudStatus, string> = {
  checking: 'Checking cloud…',
  online: 'Cloud connected',
  offline: "Cloud can't be reached",
}

function StatusDot({ status }: { status: CloudStatus }) {
  const color = status === 'online' ? 'bg-emerald-500' : status === 'offline' ? 'bg-amber-400' : 'bg-gray-300 animate-pulse'
  return <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${color}`} aria-hidden="true" />
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [showDbModal, setShowDbModal] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>('checking')
  const [exporting, setExporting] = useState(false)
  const pathname = normalizePath(usePathname())
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setAuthorized(isSessionAuthorized('admin'))
  }, [])

  useEffect(() => {
    if (!authorized) return
    let cancelled = false
    setCloudStatus('checking')
    checkCloudConnection()
      .then((r) => !cancelled && setCloudStatus(r.ok ? 'online' : 'offline'))
      .catch(() => !cancelled && setCloudStatus('offline'))
    return () => {
      cancelled = true
    }
  }, [authorized])

  // Close the mobile drawer on navigation.
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Drawer: Escape closes it and the page behind doesn't scroll.
  useEffect(() => {
    if (!mobileMenuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    const onResize = () => {
      if (window.matchMedia('(min-width: 768px)').matches) setMobileMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
      document.body.style.overflow = previous
    }
  }, [mobileMenuOpen])

  const closeDbModal = useCallback(() => setShowDbModal(false), [])
  const handleStatusChange = useCallback((ok: boolean) => setCloudStatus(ok ? 'online' : 'offline'), [])

  const handleLogout = () => {
    setSessionAuthorized('admin', false)
    setMobileMenuOpen(false)
    setAuthorized(false)
  }

  const handleExportBackup = async () => {
    setExporting(true)
    let json: string
    try {
      const siteConfig = await fetchSiteConfig(true)
      json = await exportBackup({ siteConfig })
    } catch (e) {
      console.warn('Cloud backup failed, exporting the copy on this device:', e)
      json = exportAllData()
    } finally {
      setExporting(false)
    }
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `birthday-website-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  // Admin is always light: it's a work area, and forcing the light scheme keeps
  // native inputs readable even when the site is in night mode.
  const shell = 'min-h-screen w-full bg-gray-50 text-gray-900 [color-scheme:light]'

  // React hoists this into <head>: keeps the admin area out of search engines.
  const robots = <meta name="robots" content="noindex, nofollow" />

  if (authorized === null) {
    return (
      <div className={shell}>
        {robots}
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className={`${shell} flex items-center justify-center p-4 sm:p-6`}>
        {robots}
        <AdminLogin onLoginSuccess={() => setAuthorized(true)} />
      </div>
    )
  }

  const isActive = (link: (typeof NAV_LINKS)[number]) => pathname === link.href || Boolean(link.alsoActiveOn?.includes(pathname))

  const navList = (variant: 'mobile' | 'desktop') => (
    <ul className="space-y-1">
      {NAV_LINKS.map((link) => {
        const Icon = link.icon
        const active = isActive(link)
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? 'page' : undefined}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 ${variant === 'mobile' ? 'py-3' : 'py-2.5'} rounded-xl text-sm transition-colors ${
                active ? 'bg-rose-50 text-rose-700 font-semibold' : 'font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-rose-500' : ''}`} aria-hidden="true" />
              {link.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )

  const toolButtons = (variant: 'mobile' | 'desktop') => {
    const pad = variant === 'mobile' ? 'py-3' : 'py-2.5'
    return (
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => {
            setMobileMenuOpen(false)
            setShowDbModal(true)
          }}
          className={`w-full flex items-center justify-between gap-3 px-4 ${pad} rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-left transition-colors`}
        >
          <span className="flex items-center gap-3">
            <Database className="w-4 h-4 text-rose-500" aria-hidden="true" />
            Cloud Database
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <StatusDot status={cloudStatus} />
            <span className="sr-only">{STATUS_LABEL[cloudStatus]}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setMobileMenuOpen(false)
            void handleExportBackup()
          }}
          disabled={exporting}
          className={`w-full flex items-center gap-3 px-4 ${pad} rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-left transition-colors disabled:opacity-60`}
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" aria-hidden="true" /> : <Download className="w-4 h-4 text-emerald-600" aria-hidden="true" />}
          {exporting ? 'Preparing backup…' : 'Export backup (JSON)'}
        </button>
      </div>
    )
  }

  const footerLinks = (
    <div className="space-y-1">
      <Link href="/" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-500 hover:text-gray-900 rounded-xl transition-colors">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Back to site
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors text-left font-medium"
      >
        <LogOut className="w-4 h-4" aria-hidden="true" />
        Log out
      </button>
    </div>
  )

  return (
    <div className={`${shell} flex flex-col md:flex-row`}>
      {robots}
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-40 h-14 bg-white/95 backdrop-blur border-b border-gray-200 px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-serif text-lg font-bold text-gray-900 truncate">✦ Admin Studio</span>
          <StatusDot status={cloudStatus} />
          <span className="sr-only">{STATUS_LABEL[cloudStatus]}</span>
        </div>
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="p-2 -mr-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="admin-mobile-menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 bottom-0 top-14 z-40 flex flex-col">
          <nav
            id="admin-mobile-menu"
            aria-label="Admin"
            className="bg-white border-b border-gray-200 px-4 py-4 space-y-4 max-h-full overflow-y-auto overscroll-contain shadow-xl"
          >
            {navList('mobile')}
            <div className="pt-3 border-t border-gray-100">{toolButtons('mobile')}</div>
            <div className="pt-3 border-t border-gray-100">{footerLinks}</div>
          </nav>
          <button
            type="button"
            className="flex-1 min-h-8 bg-gray-900/40 backdrop-blur-[2px] cursor-default"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setMobileMenuOpen(false)}
          />
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:sticky md:top-0 md:h-screen w-60 lg:w-64 shrink-0 bg-white border-r border-gray-200 p-5 lg:p-6 flex-col justify-between overflow-y-auto">
        <div>
          <div className="font-serif text-2xl font-bold mb-1 text-gray-900">✦ Admin Studio</div>
          <p className="flex items-center gap-1.5 text-xs text-gray-500 mb-7">
            <StatusDot status={cloudStatus} />
            {STATUS_LABEL[cloudStatus]}
          </p>
          <nav aria-label="Admin">{navList('desktop')}</nav>
          <div className="mt-5 pt-5 border-t border-gray-100">{toolButtons('desktop')}</div>
        </div>
        <div className="pt-5 border-t border-gray-100 mt-6">{footerLinks}</div>
      </aside>

      {/* Page content */}
      <main className="flex-1 min-w-0 px-4 py-6 sm:px-6 md:px-8 lg:px-10 md:py-10 pb-28 md:pb-16">
        {cloudStatus === 'offline' && (
          <div role="status" className="mb-6 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span className="flex-1">The cloud database isn&apos;t answering properly, so some changes may not save. Lists may show the copy stored on this device.</span>
            <button type="button" onClick={() => setShowDbModal(true)} className="self-start sm:self-auto shrink-0 rounded-xl bg-white border border-amber-200 px-3 py-1.5 text-xs font-semibold hover:bg-amber-100">
              Check connection
            </button>
          </div>
        )}
        {children}
      </main>

      {showDbModal && <CloudDatabaseModal onClose={closeDbModal} onStatusChange={handleStatusChange} />}
    </div>
  )
}
