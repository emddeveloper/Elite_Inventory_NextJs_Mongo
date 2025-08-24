'use client'

import { useEffect, useMemo, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Dialog } from '@headlessui/react'
import { CheckCircleIcon, MinusIcon, PlusIcon, QrCodeIcon, TrashIcon } from '@heroicons/react/24/outline'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'

const Scanner = dynamic(() => import('@/components/Scanner'), { ssr: false })

interface Product {
  _id: string
  name: string
  sku: string
  quantity: number
}

interface CountItem {
  product: Product
  count: number
}

export default function InventoryCountingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [scanOpen, setScanOpen] = useState(false)
  const [items, setItems] = useState<Record<string, CountItem>>({}) // key by SKU
  const totalSkus = useMemo(() => Object.keys(items).length, [items])
  const totalUnits = useMemo(() => Object.values(items).reduce((s, i) => s + i.count, 0), [items])

  const addOrIncrement = (product: Product, inc = 1) => {
    setItems(prev => {
      const existing = prev[product.sku]
      const nextCount = (existing?.count || 0) + inc
      return {
        ...prev,
        [product.sku]: { product, count: Math.max(0, nextCount) },
      }
    })
  }

  const removeSku = (sku: string) => {
    setItems(prev => {
      const copy = { ...prev }
      delete copy[sku]
      return copy
    })
  }

  const handleScan = async (code: string) => {
    try {
      const res = await fetch(`/api/products/lookup?code=${encodeURIComponent(code)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Lookup failed')
      if (!data.product) {
        toast.error('No product found for scanned code')
        return
      }
      const p = data.product as Product
      addOrIncrement(p, 1)
      toast.success(`${p.name} (${p.sku}) +1`)
    } catch (e: any) {
      toast.error(e?.message || 'Scan error')
    }
  }

  const commitCounts = async () => {
    const entries = Object.values(items)
    if (entries.length === 0) return toast('Nothing to commit')

    try {
      const loadingId = toast.loading('Committing counts...')
      for (const { product, count } of entries) {
        await fetch('/api/ledger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product._id,
            sku: product.sku,
            productName: product.name,
            type: 'ADJUSTMENT',
            quantity: count, // absolute level
            source: 'adjustment',
            note: 'Stock count via scanner',
          }),
        })
      }
      toast.dismiss(loadingId)
      toast.success('Inventory counts committed')
      setItems({})
    } catch (e: any) {
      toast.error(e?.message || 'Commit failed')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="lg:pl-72">
        <Header setSidebarOpen={setSidebarOpen} />
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Inventory Counting</h1>
                <p className="mt-1 text-sm text-gray-500">Scan products to set their current stock level. Each scan increments by 1. Adjust counts before committing.</p>
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary flex items-center" onClick={() => setScanOpen(true)}>
                  <QrCodeIcon className="h-5 w-5 mr-2" /> Scan
                </button>
                <button className="btn-primary flex items-center" onClick={commitCounts}>
                  <CheckCircleIcon className="h-5 w-5 mr-2" /> Commit Counts
                </button>
              </div>
            </div>

            <div className="mt-6 card">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">SKUs: {totalSkus} • Units: {totalUnits}</p>
                <button className="text-sm text-gray-500 hover:text-gray-700" onClick={() => setItems({})}>Clear All</button>
              </div>
              <div className="mt-4 divide-y divide-gray-200">
                {Object.values(items).length === 0 ? (
                  <p className="text-sm text-gray-500">No items scanned yet.</p>
                ) : (
                  Object.values(items).map(({ product, count }) => (
                    <div key={product.sku} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="btn-secondary" onClick={() => addOrIncrement(product, -1)}>
                          <MinusIcon className="h-4 w-4" />
                        </button>
                        <input
                          type="number"
                          value={count}
                          onChange={(e) => {
                            const v = Math.max(0, parseInt(e.target.value || '0', 10))
                            setItems(prev => ({ ...prev, [product.sku]: { product, count: v } }))
                          }}
                          className="input-field w-20 text-center"
                        />
                        <button className="btn-secondary" onClick={() => addOrIncrement(product, 1)}>
                          <PlusIcon className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-800" onClick={() => removeSku(product.sku)}>
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Dialog open={scanOpen} onClose={() => setScanOpen(false)} className="relative z-50">
              <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
              <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6 w-full">
                  <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">Scan Products</Dialog.Title>
                  <Scanner onDetected={(code) => { handleScan(code); }} onClose={() => setScanOpen(false)} />
                </Dialog.Panel>
              </div>
            </Dialog>

          </div>
        </main>
      </div>
    </div>
  )
}
