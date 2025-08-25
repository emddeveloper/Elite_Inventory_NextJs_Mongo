'use client'

import { useEffect, useRef, useState } from 'react'
import { Bars3Icon, BellIcon, MagnifyingGlassIcon, QrCodeIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { UserCircleIcon } from '@heroicons/react/24/solid'
import { useRouter } from 'next/navigation'
import Scanner from '@/components/Scanner'

export default function Header({ setSidebarOpen }: { setSidebarOpen: (open: boolean) => void }) {
  const [lowStock, setLowStock] = useState<any[]>([])
  const [openNotifs, setOpenNotifs] = useState(false)
  const [user, setUser] = useState<{ username: string; role: string } | null>(null)
  const [openUserMenu, setOpenUserMenu] = useState(false)
  const [loginStartAt, setLoginStartAt] = useState<number | null>(null)
  const [loginDuration, setLoginDuration] = useState<string>('')
  const router = useRouter()
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const searchBoxRef = useRef<HTMLDivElement | null>(null)

  // Global product search state
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [openScanner, setOpenScanner] = useState(false)
  // Desktop clock
  const [now, setNow] = useState<Date | null>(null)

  // Poll low-stock products every 10s
  useEffect(() => {
    let mounted = true
    async function fetchLow() {
      try {
        const res = await fetch('/api/products?lowStock=true&limit=50')
        if (!res.ok) return
        const data = await res.json()
        if (mounted) setLowStock(Array.isArray(data.products) ? data.products : [])
      } catch (e) {
        // ignore
      }
    }
    fetchLow()
    const iv = setInterval(fetchLow, 10000)
    return () => { mounted = false; clearInterval(iv) }
  }, [])

  // Debounced global search
  useEffect(() => {
    let abort = false
    let t: any
    async function run() {
      const q = search.trim()
      if (!q) {
        setResults([])
        setSearchLoading(false)
        return
      }
      setSearchLoading(true)
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&limit=10`)
        if (!res.ok) throw new Error('Failed')
        const data = await res.json()
        if (!abort) setResults(Array.isArray(data.products) ? data.products : [])
      } catch {
        if (!abort) setResults([])
      } finally {
        if (!abort) setSearchLoading(false)
      }
    }
    t = setTimeout(run, 250)
    return () => { abort = true; clearTimeout(t) }
  }, [search])

  // Tick clock every second (desktop-only display)
  useEffect(() => {
    setNow(new Date())
    const iv = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])

  // Close search dropdown on outside click or Escape
  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      const box = searchBoxRef.current
      if (!box) return
      if (e.target instanceof Node && !box.contains(e.target)) setSearchOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setSearchOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  // Fetch current user once
  useEffect(() => {
    let mounted = true
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(({ user }) => { if (mounted) setUser(user ? { username: user.username, role: user.role } : null) })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  // Track login duration using localStorage timestamp
  useEffect(() => {
    const KEY = 'login_started_at'
    function ensureStart() {
      try {
        let v = localStorage.getItem(KEY)
        if (!v) {
          const now = Date.now()
          localStorage.setItem(KEY, String(now))
          v = String(now)
        }
        setLoginStartAt(Number(v))
      } catch {}
    }
    function fmt(ms: number) {
      const totalSec = Math.max(0, Math.floor(ms / 1000))
      const h = Math.floor(totalSec / 3600)
      const m = Math.floor((totalSec % 3600) / 60)
      const s = totalSec % 60
      if (h > 0) return `${h}h ${m}m`
      if (m > 0) return `${m}m ${s}s`
      return `${s}s`
    }
    function tick() {
      if (loginStartAt) setLoginDuration(fmt(Date.now() - loginStartAt))
    }
    ensureStart()
    tick()
    const iv = setInterval(tick, 30000)
    return () => clearInterval(iv)
  }, [loginStartAt])

  // Close user menu when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const el = userMenuRef.current
      if (!el) return
      if (e.target instanceof Node && !el.contains(e.target)) {
        setOpenUserMenu(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  async function onLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      router.replace('/login')
    }
  }

  const notifCount = lowStock.length

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-primary-100 bg-white/70 backdrop-blur-xl px-4 shadow sm:gap-x-6 sm:px-6 lg:px-8">
      <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 items-center justify-between lg:gap-x-6">
        {/* Global Search */}
        <div ref={searchBoxRef} className="hidden lg:block flex-1 max-w-2xl">
          <div className="relative">
            <div className="flex items-center rounded-lg border border-primary-100 bg-white shadow-sm focus-within:ring-2 focus-within:ring-primary-200">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 ml-3" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSearchOpen(true) }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search products by name or SKU..."
                className="w-full bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
              {search && (
                <button
                  onClick={() => { setSearch(''); setResults([]); setSearchOpen(false) }}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
              <div className="h-6 w-px bg-gray-200" />
              <button
                onClick={() => setOpenScanner(true)}
                className="px-3 py-2 text-primary-700 hover:text-primary-800"
                title="Scan barcode"
              >
                <QrCodeIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Dropdown */}
            {searchOpen && (
              <div className="absolute z-50 mt-1 w-full rounded-lg bg-white shadow-lg ring-1 ring-gray-900/5">
                <div className="max-h-80 overflow-auto">
                  {searchLoading ? (
                    <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
                  ) : results.length > 0 ? (
                    <ul className="divide-y">
                      {results.map((p) => (
                        <li
                          key={p._id}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            try { setSearch(`${p.sku} - ${p.name}`) } catch {}
                            setSearchOpen(false)
                            router.push(`/products?search=${encodeURIComponent(p.sku || p.name)}`)
                          }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{p.name}</div>
                              <div className="text-xs text-gray-500">SKU: {p.sku}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-700">₹{Number(p.price).toFixed(2)}</div>
                              <div className="text-xs text-gray-500">Qty: {p.quantity}</div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">No matching products</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Desktop clock */}
          <div className="hidden lg:flex items-center text-sm font-medium text-gray-700 tabular-nums" aria-label="Current time">
            {now ? now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
          </div>
          <div className="relative">
            <button type="button" onClick={() => setOpenNotifs(!openNotifs)} className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-10 w-8" aria-hidden="true" />
            </button>
            {notifCount > 0 && (
              <span className="absolute -top-0 -right-0 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-600 text-white text-xs">{notifCount}</span>
            )}
            {openNotifs && (
              <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-lg bg-white/95 backdrop-blur shadow-xl ring-1 ring-gray-900/5">
                <div className="p-3 max-h-72 overflow-auto">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Low stock products</div>
                  {lowStock.length === 0 ? (
                    <div className="text-sm text-gray-500">No low stock alerts.</div>
                  ) : (
                    <ul className="divide-y">
                      {lowStock.map((p: any) => (
                        <li key={p._id} className="py-2 flex items-center justify-between gap-3">
                          <div>
                            <div className="font-medium text-sm">{p.name}</div>
                            <div className="text-xs text-gray-500">SKU: {p.sku} • Qty: {p.quantity}</div>
                          </div>
                          <a href="/products" className="text-primary-700 hover:text-primary-800 text-sm">Open</a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="p-2 text-center border-t">
                  <button onClick={() => { setOpenNotifs(false) }} className="text-sm text-gray-600">Close</button>
                </div>
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

          {user && (
            <div ref={userMenuRef} className="relative hidden sm:block">
              <button
                onClick={() => setOpenUserMenu(v => !v)}
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-primary-100 shadow hover:bg-white"
              >
                <UserCircleIcon className="h-5 w-5 text-primary-600" />
                <span className="text-sm font-medium text-gray-700">{user.username}</span>
                <span className="text-xs text-gray-500">({user.role})</span>
              </button>
              {openUserMenu && (
                <div className="absolute right-0 top-full w-48 rounded-md bg-white shadow ring-1 ring-gray-900/5 py-1">
                  <div className="px-3 py-2 text-xs text-gray-500 border-b">Logged in for: <span className="font-medium text-gray-700">{loginDuration || '—'}</span></div>
                  <button
                    onClick={() => { setOpenUserMenu(false); router.push('/profile') }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Profile
                  </button>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => { setOpenUserMenu(false); router.push('/admin/users') }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Manage Users
                    </button>
                  )}
                  <button
                    onClick={() => { setOpenUserMenu(false); onLogout() }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}

          
        </div>
      </div>

      {/* Scanner Modal */}
      {openScanner && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpenScanner(false)} />
          <div className="relative z-[61] w-full max-w-lg mx-4 rounded-xl bg-white p-4 shadow-2xl ring-1 ring-gray-900/5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-gray-700">Scan Barcode</div>
              <button className="p-2 text-gray-500 hover:text-gray-700" onClick={() => setOpenScanner(false)}>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <Scanner
              onDetected={(code) => {
                setSearch(code)
                setOpenScanner(false)
                setSearchOpen(true)
              }}
              onClose={() => setOpenScanner(false)}
              className=""
              closeOnDetect
            />
          </div>
        </div>
      )}
    </div>
  )
}
