"use client"

import { FormEvent, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SparklesIcon } from '@heroicons/react/24/solid'
import { ComputerDesktopIcon, CpuChipIcon, DevicePhoneMobileIcon, CameraIcon } from '@heroicons/react/24/outline'
import company from '@/company.json'

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
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden bg-gradient-to-br from-indigo-50 via-fuchsia-50 to-emerald-50">
      {/* Decorative background icons */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-300 to-indigo-100 blur-3xl"></div>
        <div className="absolute -bottom-28 -right-28 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-violet-300 to-pink-100 blur-3xl"></div>
        <ComputerDesktopIcon className="absolute top-16 left-10 h-28 w-28 text-indigo-500/50" />
        <CpuChipIcon className="absolute top-1/3 right-16 h-24 w-24 text-fuchsia-500/50 rotate-12" />
        <DevicePhoneMobileIcon className="absolute bottom-28 left-1/4 h-20 w-20 text-emerald-500/50 -rotate-12" />
        <CameraIcon className="absolute bottom-12 right-1/4 h-28 w-28 text-slate-600/50" />
        {/* subtle repeated motif */}
        <CpuChipIcon className="absolute top-1/4 left-1/2 h-16 w-16 text-indigo-400/30" />
        <CameraIcon className="absolute bottom-1/3 left-8 h-16 w-16 text-slate-500/30" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary-600 via-fuchsia-600 to-violet-600 shadow-lg">
            <SparklesIcon className="h-6 w-6 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary-700 via-fuchsia-600 to-violet-700">
            Elite Inventory Manager
          </h1>
          {/* Company branding */}
          <div className="mt-3 flex flex-col items-center gap-1">
            <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
              Welcome to
            </span>
            <p className="text-3xl md:text-4xl font-black tracking-tight drop-shadow-sm bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600">
              {company.name}
            </p>
            {company.website && (
              <p className="text-xs text-gray-500">{company.website.replace(/^https?:\/\//, '')}</p>
            )}
          </div>
          <p className="mt-3 text-sm text-gray-600">Sign in to continue</p>
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

        {/* Footer credits */}
        <div className="mt-4 text-center text-[11px] text-gray-600">
          <span>Design and developed by </span>
          <span className="font-semibold text-gray-800">Elite Enterprise (EMD Developer)</span>
          <span> • </span>
          <a
            href="mailto:emd.developer@gmail.com"
            className="text-primary-700 hover:text-primary-800 underline underline-offset-2"
          >
            emd.developer@gmail.com
          </a>
        </div>
      </div>
    </div>
  )
}
