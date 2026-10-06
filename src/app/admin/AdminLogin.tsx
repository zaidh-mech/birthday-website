'use client'

import { useState } from 'react'
import { loginAdmin } from '@/app/actions/auth'

export default function AdminLogin() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    try {
      await loginAdmin(formData)
    } catch (err: any) {
      setError('Invalid admin password')
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">Admin Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="password"
            name="password"
            placeholder="Admin Password"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white font-medium py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  )
}
