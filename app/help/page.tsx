'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { currentVersion, versionHistory } from '@/lib/version'

export default function HelpPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    try {
      const v = localStorage.getItem('sidebar_collapsed')
      if (v != null) setSidebarCollapsed(v === '1')
    } catch {}
    const handler = (e: any) => {
      if (typeof e?.detail?.collapsed === 'boolean') setSidebarCollapsed(e.detail.collapsed)
    }
    window.addEventListener('sidebar:collapse-changed', handler as any)
    return () => window.removeEventListener('sidebar:collapse-changed', handler as any)
  }, [])

  const contentPadding = sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className={contentPadding}>
        <Header setSidebarOpen={setSidebarOpen} />
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8 space-y-8">
            <header>
              <h1 className="text-2xl font-bold text-gray-900">Help & Guide</h1>
              <p className="mt-1 text-sm text-gray-600">How to use the app and understand recent updates.</p>
            </header>

            <section className="card">
              <h2 className="text-lg font-semibold text-gray-900">Versioning Policy</h2>
              <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li><strong>Always updated:</strong> On every user-visible change, the version number and history are updated.</li>
                <li><strong>Global footer:</strong> Current version and recent changes are visible in the footer on every page.</li>
                <li><strong>Help page:</strong> This page is updated to reflect new features and behavior changes immediately.</li>
              </ul>
            </section>

            <section className="card">
              <h2 className="text-lg font-semibold text-gray-900">Current Version</h2>
              <div className="mt-2 text-sm text-gray-700">
                <div><span className="font-medium">Version:</span> <span className="font-mono">{currentVersion.version}</span></div>
                <div><span className="font-medium">Date:</span> {new Date(currentVersion.date).toLocaleString()}</div>
              </div>
              <div className="mt-3">
                <div className="text-sm font-semibold mb-1">Changes</div>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                  {currentVersion.changes.map((c, i) => (<li key={i}>{c}</li>))}
                </ul>
              </div>
            </section>

            <section className="card">
              <h2 className="text-lg font-semibold text-gray-900">Recent Versions</h2>
              <ul className="mt-3 space-y-4">
                {versionHistory.slice(0, 5).map(v => (
                  <li key={v.version} className="text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">{v.version}</span>
                      <span className="text-gray-400">•</span>
                      <span>{new Date(v.date).toLocaleString()}</span>
                    </div>
                    <ul className="list-disc pl-5 mt-1">
                      {v.changes.map((c, i) => (<li key={i}>{c}</li>))}
                    </ul>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}