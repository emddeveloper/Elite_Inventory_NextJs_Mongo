"use client"

import { useMemo, useState } from 'react'
import { currentVersion, versionHistory } from '@/lib/version'
import Link from 'next/link'

export default function Footer() {
  const [open, setOpen] = useState(false)
  const latest = currentVersion
  const history = useMemo(() => versionHistory.slice(0, 5), [])

  return (
    <footer className="mt-8 border-t bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <span className="font-medium">Version:</span>
          <span className="font-mono">{latest.version}</span>
          <span className="text-gray-400">•</span>
          <span>{new Date(latest.date).toLocaleString()}</span>
          <button
            type="button"
            className="ml-3 px-2 py-1 rounded border text-gray-700 hover:bg-gray-50"
            onClick={() => setOpen(v => !v)}
            aria-expanded={open}
            aria-controls="version-changes"
            title="Show recent changes"
          >
            {open ? 'Hide changes' : 'Show changes'}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/help" className="text-blue-600 hover:underline">Help</Link>
          <span className="text-gray-300">|</span>
          <span>© {new Date().getFullYear()} Elite Inventory</span>
        </div>
      </div>
      {open && (
        <div id="version-changes" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-4">
          <div className="rounded border bg-gray-50 p-3">
            <div className="text-sm font-semibold mb-2">Recent Changes</div>
            <ul className="space-y-3">
              {history.map((entry) => (
                <li key={entry.version} className="text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-mono font-semibold">{entry.version}</span>
                    <span className="text-gray-400">•</span>
                    <span>{new Date(entry.date).toLocaleString()}</span>
                  </div>
                  <ul className="list-disc pl-5 text-gray-700 mt-1">
                    {entry.changes.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </footer>
  )
}
