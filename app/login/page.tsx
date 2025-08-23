"use client"

import { FormEvent, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SparklesIcon } from '@heroicons/react/24/solid'

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // If already logged in, redirect to home
    fetch('/api/auth/me').then(r => r.json()).then(({ user }) => {
      if (user) {
        router.replace('/')
      }
    })
  }, [router])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Login failed')
        setLoading(false)
        return
      }
      const next = params.get('next') || (data.user?.menus?.[0] ?? '/')
      router.replace(next)
    } catch (err: any) {
      setError('Network error')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-indigo-50 via-fuchsia-50 to-emerald-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary-600 via-fuchsia-600 to-violet-600 shadow-lg">
            <SparklesIcon className="h-6 w-6 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary-700 via-fuchsia-600 to-violet-700">
            Elite Inventory Manager
          </h1>
          <p className="mt-2 text-sm text-gray-500">Sign in to continue</p>
        </div>

        <div className="rounded-2xl border border-primary-100 bg-white/80 backdrop-blur shadow-xl p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                className="mt-1 block w-full rounded-lg border border-primary-100 bg-white/70 px-3 py-2 shadow-sm focus:border-primary-300 focus:ring-2 focus:ring-primary-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                className="mt-1 block w-full rounded-lg border border-primary-100 bg-white/70 px-3 py-2 shadow-sm focus:border-primary-300 focus:ring-2 focus:ring-primary-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex justify-center items-center rounded-lg px-4 py-2 bg-gradient-to-r from-primary-600 via-fuchsia-600 to-violet-600 text-white font-semibold shadow hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">Demo users: admin/admin123, manager/manager123, staff/staff123</p>
      </div>
    </div>
  )
}
