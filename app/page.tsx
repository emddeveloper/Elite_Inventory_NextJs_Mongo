'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import Dashboard from '@/components/Dashboard'

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Sync padding with sidebar collapse (desktop only)
  useEffect(() => {
    try {
      const v = localStorage.getItem('sidebar_collapsed')
      if (v != null) setSidebarCollapsed(v === '1')
    } catch {}
    const handler = (e: any) => setSidebarCollapsed(Boolean(e?.detail?.collapsed))
    window.addEventListener('sidebar:collapse-changed', handler as any)
    return () => window.removeEventListener('sidebar:collapse-changed', handler as any)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className={sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'}>
        <Header setSidebarOpen={setSidebarOpen} />
        
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <Dashboard />
          </div>
        </main>
      </div>
    </div>
  )
}
