'use client'

import { useEffect, useMemo, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import toast from 'react-hot-toast'

type LedgerType = 'IN' | 'OUT' | 'ADJUSTMENT'

interface LedgerItem {
  _id: string
  productId: string
  sku: string
  productName: string
  type: LedgerType
  quantity: number
  unitCost?: number
  unitPrice?: number
  balanceAfter?: number
  reference?: string
  source?: string
  note?: string
  username?: string
  createdAt: string
}

interface ProductRef { _id: string; name: string; sku: string }

export default function InventoryLedgerPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [items, setItems] = useState<LedgerItem[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [total, setTotal] = useState(0)

  // Filters
  const [sku, setSku] = useState('')
  const [type, setType] = useState<'' | LedgerType>('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [products, setProducts] = useState<ProductRef[]>([])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit])

  useEffect(() => {
    // Load a small list of products for filtering (first 100)
    ;(async () => {
      try {
        const res = await fetch(`/api/products?limit=100`)
        const data = await res.json()
        if (res.ok) {
          setProducts(data.products?.map((p: any)=>({ _id: p._id, name: p.name, sku: p.sku })) || [])
        }
      } catch {}
    })()
  }, [])

  // Prefill SKU from URL query (e.g., /ledger?sku=ABC123)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const initialSku = params.get('sku') || ''
      if (initialSku) {
        setSku(initialSku)
        setPage(1)
      }
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchLedger()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, sku, type, search, dateFrom, dateTo])

  const fetchLedger = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (sku) params.set('sku', sku)
      if (type) params.set('type', type)
      if (search) params.set('search', search)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      const res = await fetch(`/api/ledger?${params.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to load ledger')
      setItems(data.items || [])
      setTotal(data.pagination?.total || 0)
    } catch (e: any) {
      toast.error(e.message || 'Failed to load ledger')
    } finally {
      setLoading(false)
    }
  }

  const seedLedger = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/ledger/seed', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Seed failed')
      toast.success(`Seeded ${data.inserted} ledger entries`)
      setPage(1)
      fetchLedger()
    } catch (e: any) {
      toast.error(e.message || 'Seed failed')
    } finally {
      setLoading(false)
    }
  }

  // Export all filtered results to CSV, paging through the API
  const exportCsv = async () => {
    try {
      setLoading(true)
      const baseParams = new URLSearchParams()
      if (sku) baseParams.set('sku', sku)
      if (type) baseParams.set('type', type)
      if (search) baseParams.set('search', search)
      if (dateFrom) baseParams.set('dateFrom', dateFrom)
      if (dateTo) baseParams.set('dateTo', dateTo)

      const pageSize = 1000
      let currentPage = 1
      let all: LedgerItem[] = []
      let totalCount = 0

      while (true) {
        const params = new URLSearchParams(baseParams)
        params.set('page', String(currentPage))
        params.set('limit', String(pageSize))
        const res = await fetch(`/api/ledger?${params.toString()}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Failed to load ledger')
        const batch: LedgerItem[] = data.items || []
        totalCount = data.pagination?.total || batch.length
        all = all.concat(batch)
        if (all.length >= totalCount || batch.length === 0) break
        currentPage += 1
      }

      const headers = [
        'Date', 'SKU', 'Product', 'Type', 'Quantity', 'Unit Cost', 'Unit Price', 'Balance After', 'Source', 'Reference', 'Note', 'User'
      ]
      const csvRows = [headers.join(',')]
      const esc = (v: any) => {
        if (v == null) return ''
        const s = String(v)
        if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
        return s
      }
      for (const it of all) {
        csvRows.push([
          new Date(it.createdAt).toISOString(),
          esc(it.sku),
          esc(it.productName),
          it.type,
          it.quantity,
          it.unitCost != null ? it.unitCost.toFixed(2) : '',
          it.unitPrice != null ? it.unitPrice.toFixed(2) : '',
          it.balanceAfter ?? '',
          esc(it.source ?? ''),
          esc(it.reference ?? ''),
          esc(it.note ?? ''),
          esc(it.username ?? ''),
        ].join(','))
      }

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')
      a.download = `ledger-export-${ts}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`Exported ${all.length} rows`)
    } catch (e: any) {
      toast.error(e.message || 'Export failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="lg:pl-72">
        <Header setSidebarOpen={setSidebarOpen} />
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Inventory Ledger</h1>
                <p className="mt-1 text-sm text-gray-500">View all stock movements by product</p>
              </div>
              <div className="flex gap-2">
                <button onClick={exportCsv} className="btn-secondary">Export CSV</button>
                <button onClick={seedLedger} className="btn-secondary">Seed Dummy Data</button>
              </div>
            </div>

            {/* Filters */}
            <div className="card">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <div className="md:col-span-2">
                  <label className="label">Product</label>
                  <select value={sku} onChange={e=>{setSku(e.target.value); setPage(1)}} className="input-field">
                    <option value="">All products</option>
                    {products.map(p=> (
                      <option key={p._id} value={p.sku}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Type</label>
                  <select value={type} onChange={e=>{setType(e.target.value as any); setPage(1)}} className="input-field">
                    <option value="">All</option>
                    <option value="IN">IN</option>
                    <option value="OUT">OUT</option>
                    <option value="ADJUSTMENT">ADJUSTMENT</option>
                  </select>
                </div>
                <div>
                  <label className="label">Search</label>
                  <input value={search} onChange={e=>{setSearch(e.target.value); setPage(1)}} placeholder="Product name..." className="input-field"/>
                </div>
                <div>
                  <label className="label">From</label>
                  <input type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value); setPage(1)}} className="input-field"/>
                </div>
                <div>
                  <label className="label">To</label>
                  <input type="date" value={dateTo} onChange={e=>{setDateTo(e.target.value); setPage(1)}} className="input-field"/>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="card overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header">Date</th>
                    <th className="table-header">SKU</th>
                    <th className="table-header">Product</th>
                    <th className="table-header">Type</th>
                    <th className="table-header">Qty</th>
                    <th className="table-header">Unit Cost</th>
                    <th className="table-header">Unit Price</th>
                    <th className="table-header">Balance After</th>
                    <th className="table-header">Source</th>
                    <th className="table-header">Reference</th>
                    <th className="table-header">Note</th>
                    <th className="table-header">User</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr><td className="table-cell text-center" colSpan={12}>Loading...</td></tr>
                  ) : items.length === 0 ? (
                    <tr><td className="table-cell text-center" colSpan={12}>No entries</td></tr>
                  ) : items.map(it => (
                    <tr key={it._id} className="hover:bg-gray-50">
                      <td className="table-cell">{new Date(it.createdAt).toLocaleString()}</td>
                      <td className="table-cell font-mono">{it.sku}</td>
                      <td className="table-cell">{it.productName}</td>
                      <td className="table-cell">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          it.type === 'IN' ? 'bg-green-100 text-green-800' : it.type === 'OUT' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>{it.type}</span>
                      </td>
                      <td className="table-cell">{it.quantity}</td>
                      <td className="table-cell">{it.unitCost != null ? `$${it.unitCost.toFixed(2)}` : '-'}</td>
                      <td className="table-cell">{it.unitPrice != null ? `$${it.unitPrice.toFixed(2)}` : '-'}</td>
                      <td className="table-cell">{it.balanceAfter ?? '-'}</td>
                      <td className="table-cell">{it.source ?? '-'}</td>
                      <td className="table-cell">{it.reference ?? '-'}</td>
                      <td className="table-cell">{it.note ?? '-'}</td>
                      <td className="table-cell">{it.username ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">Total: {total}</div>
                <div className="flex items-center gap-2">
                  <button className="btn-secondary" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button>
                  <span className="text-sm">Page {page} / {totalPages}</span>
                  <button className="btn-secondary" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next</button>
                  <select className="input-field w-24" value={limit} onChange={e=>{setLimit(parseInt(e.target.value)); setPage(1)}}>
                    {[10,20,50,100].map(n=> <option key={n} value={n}>{n}/page</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
