import { checkAdmin } from '@/lib/auth'
import AdminLogin from './AdminLogin'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAuthorized = await checkAdmin()

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <AdminLogin />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
        <div className="font-serif text-2xl font-bold mb-10 text-gray-900">Admin Panel</div>
        
        <nav className="space-y-2 flex-1">
          <Link href="/admin/letters" className="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900">
            Manage Letters
          </Link>
          <Link href="/admin/memories" className="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900">
            Manage Memories
          </Link>
          <a href="/" className="block px-4 py-2 rounded-lg text-gray-400 hover:text-gray-600 mt-8 border-t border-gray-100 pt-4">
            ← Back to Site
          </a>
        </nav>

        <form action={logout}>
          <button className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg">
            Logout
          </button>
        </form>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
