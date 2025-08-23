'use client'

import { useState } from 'react'
import Dashboard from '@/components/Dashboard'

export default function TestDashboardPage() {
  const [showInstructions, setShowInstructions] = useState(true)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Test Page</h1>
          <p className="mt-2 text-gray-600">
            Test the dashboard functionality with different data sources
          </p>
        </div>

        {showInstructions && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Testing Instructions
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>The dashboard shows live data from the API</li>
                    <li>If the API is unavailable, an error message will be displayed</li>
                    <li>You can manually retry the API connection using the "Retry" button</li>
                    <li>The dashboard shows "Live Data" indicator when connected</li>
                    <li>Data automatically refreshes every 5 minutes</li>
                  </ul>
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => setShowInstructions(false)}
                    className="text-sm font-medium text-blue-800 hover:text-blue-600"
                  >
                    Hide instructions
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <Dashboard />
      </div>
    </div>
  )
}
