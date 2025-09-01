'use client'

import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

const sections: { key: string; title: string; steps: string[] }[] = [
  {
    key: 'dashboard',
    title: 'Dashboard Overview',
    steps: [
      'See key KPIs like total products, low stock alerts, and recent activity.',
      'Click any metric card to navigate to its related module for deeper details.',
      'Use the global search bar (top) to quickly find products by name or SKU.'
    ],
  },
  {
    key: 'products',
    title: 'Products',
    steps: [
      'Browse the product list, search, and filter as needed.',
      'Add a product with name, SKU, price, and quantity.',
      'Edit a product to update stock levels or pricing.',
      'Scan barcodes using the scanner button in the top search area.',
      'On a successful scan, your device vibrates and a short success tune plays (sound can be disabled).'
    ],
  },
  {
    key: 'inventory',
    title: 'Inventory',
    steps: [
      'View current stock across products.',
      'Identify low stock items from alerts and apply restock actions in Purchases.',
      'Use the barcode generator to print labels for shelf or packaging.'
    ],
  },
  {
    key: 'sales',
    title: 'Sales',
    steps: [
      'Create a new sale by selecting products (scan or search).',
      'Adjust quantities and verify totals before saving.',
      'Stock reduces automatically and ledger entries are created.'
    ],
  },
  {
    key: 'purchases',
    title: 'Purchases',
    steps: [
      'Record stock received from suppliers.',
      'Enter supplier details, products, and quantities received.',
      'Stock increases automatically and ledger entries are created.'
    ],
  },
  {
    key: 'transactions',
    title: 'Transactions',
    steps: [
      'View a chronological log of movements like sales, purchases, and adjustments.',
      'Filter by date or type to audit specific changes.'
    ],
  },
  {
    key: 'ledger',
    title: 'Inventory Ledger',
    steps: [
      'See net in/out per product or time period.',
      'Export data if needed for reconciliation.'
    ],
  },
  {
    key: 'reports',
    title: 'Reports',
    steps: [
      'Generate summaries such as best-selling products and stock valuation.',
      'Apply date filters and export for sharing.'
    ],
  },
  {
    key: 'barcode',
    title: 'Barcode Generator',
    steps: [
      'Enter product info or SKU to generate printable barcodes.',
      'Print single labels or sheets for batch operations.'
    ],
  },
  {
    key: 'admin-export',
    title: 'Admin: Data Export',
    steps: [
      'Admins can export individual collections as CSV from the Admin Export API.',
      'Use the ZIP option to download all collections at once as a .zip archive of CSV files.',
      'The export is optimized for browsers (uses ArrayBuffer) to ensure downloads work during production builds.'
    ],
  },
  {
    key: 'admin-users',
    title: 'Admin: User Management',
    steps: [
      'Admins can create, update roles/menus, and delete users in User Management.',
      'On serverless hosts, changes are saved to a runtime-writable path (e.g., /tmp). Data may reset on new deployments/restarts.',
      'For persistent users across deploys, configure an external store or mount a writable volume.'
    ],
  },
]

export default function HelpPage() {
  const [open, setOpen] = useState<string | null>('dashboard')

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-primary-700 hover:text-primary-800">
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Dashboard
          </Link>
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 mb-2">User Guide</h1>
        <p className="text-gray-600 mb-6">Learn how to use the application effectively. This guide covers core modules for all users (admin-only features are excluded).</p>

        <div className="space-y-3">
          {sections.map((s) => {
            const isOpen = open === s.key
            return (
              <div key={s.key} className="rounded-lg border border-primary-100 bg-white shadow-sm">
                <button
                  className="w-full flex items-center justify-between px-4 py-3"
                  onClick={() => setOpen(isOpen ? null : s.key)}
                  aria-expanded={isOpen}
                >
                  <span className="text-left font-medium text-gray-800">{s.title}</span>
                  {isOpen ? <ChevronUpIcon className="h-5 w-5 text-gray-500" /> : <ChevronDownIcon className="h-5 w-5 text-gray-500" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4">
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                      {s.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-8 rounded-lg bg-primary-50 border border-primary-100 p-4">
          <div className="font-medium text-primary-900 mb-1">Quick Tips</div>
          <ul className="list-disc pl-5 text-sm text-primary-900/90 space-y-1">
            <li><span className="font-semibold">Search fast:</span> Use the top search bar to find products by name or SKU.</li>
            <li><span className="font-semibold">Scan barcodes:</span> Click the QR icon near the search input to open the scanner.</li>
            <li><span className="font-semibold">Scan feedback:</span> On success, your device vibrates and a short success tune plays (sound can be disabled).</li>
            <li><span className="font-semibold">Low stock alerts:</span> Open the bell icon to see items that need restocking.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
