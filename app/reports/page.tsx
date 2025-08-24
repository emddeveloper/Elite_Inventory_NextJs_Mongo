'use client'

import { useEffect, useMemo, useState } from 'react'
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, Legend } from 'recharts'
import { WifiIcon } from '@heroicons/react/24/outline'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

type SalesPoint = { label: string; total: number; count: number }

type BestSeller = { sku: string; name: string; unitsSold: number; revenue: number }

type LowStock = { sku: string; name: string; quantity: number; minQuantity: number; location?: string }

type Turnover = { productId: string; sku: string; name: string; unitsSold: number; avgInventory: number; turnover: number }

export default function ReportsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [sales, setSales] = useState<SalesPoint[]>([])
  const [best, setBest] = useState<BestSeller[]>([])
  const [low, setLow] = useState<LowStock[]>([])
  const [turnover, setTurnover] = useState<Turnover[]>([])
  const [profitSeries, setProfitSeries] = useState<{ label: string; revenue: number; cogs: number; profit: number }[]>([])
  const [perProductMargins, setPerProductMargins] = useState<{ sku: string; name: string; price: number; cost: number; quantity: number; profitMarginPercent: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        setError(null)

        const [salesRes, bestRes, lowRes, turnRes, profitRes] = await Promise.all([
          fetch(`/api/reports?metric=sales-trends&period=${period}`),
          fetch(`/api/reports?metric=best-sellers&period=${period}`),
          fetch(`/api/reports?metric=low-stock`),
          fetch(`/api/reports?metric=turnover&period=${period}`),
          fetch(`/api/reports?metric=profit-margins&period=${period}`),
        ])

        const [salesJson, bestJson, lowJson, turnJson, profitJson] = await Promise.all([
          salesRes.json(), bestRes.json(), lowRes.json(), turnRes.json(), profitRes.json()
        ])

        if (!salesJson.success) throw new Error('Failed to load sales trends')
        if (!bestJson.success) throw new Error('Failed to load best sellers')
        if (!lowJson.success) throw new Error('Failed to load low stock')
        if (!turnJson.success) throw new Error('Failed to load turnover')
        if (!profitJson.success) throw new Error('Failed to load profit margins')

        setSales(salesJson.data)
        setBest(bestJson.data)
        setLow(lowJson.data)
        setTurnover(turnJson.data)
        setProfitSeries(profitJson.data.timeSeries)
        setPerProductMargins(profitJson.data.perProduct || [])
      } catch (e: any) {
        setError(e?.message || 'Failed to load reports')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [period])

  const profitSummary = useMemo(() => {
    if (!profitSeries?.length) return { revenue: 0, cogs: 0, profit: 0, margin: 0 }
    const revenue = profitSeries.reduce((a, b) => a + (b.revenue || 0), 0)
    const cogs = profitSeries.reduce((a, b) => a + (b.cogs || 0), 0)
    const profit = revenue - cogs
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0
    return { revenue, cogs, profit, margin }
  }, [profitSeries])

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="lg:pl-72">
        <Header setSidebarOpen={setSidebarOpen} />
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8 space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                <p className="mt-1 text-sm text-gray-500">Analytics overview</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <WifiIcon className="h-4 w-4" />
                  <span>Live Data</span>
                </div>
                <div className="inline-flex rounded-md shadow-sm overflow-hidden border" role="group">
                  <button onClick={() => setPeriod('daily')} className={`px-3 py-1 text-sm ${period==='daily'?'bg-blue-600 text-white':'bg-white text-gray-700'}`}>Daily</button>
                  <button onClick={() => setPeriod('weekly')} className={`px-3 py-1 text-sm border-l ${period==='weekly'?'bg-blue-600 text-white':'bg-white text-gray-700'}`}>Weekly</button>
                  <button onClick={() => setPeriod('monthly')} className={`px-3 py-1 text-sm border-l ${period==='monthly'?'bg-blue-600 text-white':'bg-white text-gray-700'}`}>Monthly</button>
                </div>
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            {error && (
              <div className="bg-white shadow rounded-lg p-4 text-red-600 text-sm">{error}</div>
            )}

            {!loading && !error && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Quick panel */}
                <aside className="lg:col-span-3 space-y-4">
                  <nav className="overflow-hidden rounded-xl border border-primary-100 bg-white/80 backdrop-blur shadow-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-sm font-semibold text-gray-700">Quick Links</h3>
                      <ul className="mt-3 space-y-2 text-sm text-blue-600">
                        <li><a href="#trends" className="hover:underline">Sales Trends</a></li>
                        <li><a href="#profit" className="hover:underline">Profit Analysis</a></li>
                        <li><a href="#best" className="hover:underline">Best Sellers</a></li>
                        <li><a href="#low" className="hover:underline">Low Stock</a></li>
                        <li><a href="#turnover" className="hover:underline">Inventory Turnover</a></li>
                      </ul>
                    </div>
                  </nav>
                  <div className="overflow-hidden rounded-xl border border-primary-100 bg-white/80 backdrop-blur shadow-lg p-6">
                    <h3 className="text-sm font-medium text-gray-500">Profit Margin</h3>
                    <div className="mt-2 text-2xl font-semibold">{profitSummary.margin.toFixed(1)}%</div>
                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Revenue</div>
                        <div className="font-medium">${profitSummary.revenue.toLocaleString(undefined,{maximumFractionDigits:0})}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">COGS</div>
                        <div className="font-medium">${profitSummary.cogs.toLocaleString(undefined,{maximumFractionDigits:0})}</div>
                      </div>
                    </div>
                  </div>
                </aside>

                {/* Main content */}
                <main className="lg:col-span-9 space-y-6">
            {/* Sales Trends */}
            <div id="trends" className="overflow-hidden rounded-xl border border-primary-100 bg-white/80 backdrop-blur shadow-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900">Sales Trends ({period})</h2>
                <div className="mt-4 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sales}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
                      <Line type="monotone" dataKey="total" stroke="#3B82F6" name="Sales" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Profit Analysis */}
            <div id="profit" className="overflow-hidden rounded-xl border border-primary-100 bg-white/80 backdrop-blur shadow-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900">Profit Analysis</h2>
                <div className="mt-4 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={profitSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip formatter={(v: any, n: any) => n==='profit'?`$${Number(v).toLocaleString()}`:`$${Number(v).toLocaleString()}`} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#3B82F6" name="Revenue" strokeWidth={2} />
                      <Line type="monotone" dataKey="cogs" stroke="#EF4444" name="COGS" strokeWidth={2} />
                      <Line type="monotone" dataKey="profit" stroke="#10B981" name="Profit" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Per-product margins */}
                <div className="mt-6 overflow-x-auto">
                  <h3 className="text-md font-medium text-gray-800 mb-2">Per-Product Margins</h3>
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">Product</th>
                        <th className="px-3 py-2 text-right font-semibold">Price</th>
                        <th className="px-3 py-2 text-right font-semibold">Cost</th>
                        <th className="px-3 py-2 text-right font-semibold">Qty</th>
                        <th className="px-3 py-2 text-right font-semibold">Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {perProductMargins.map((p) => (
                        <tr key={p.sku} className="hover:bg-gray-50">
                          <td className="px-3 py-2">{p.name}</td>
                          <td className="px-3 py-2 text-right">${p.price?.toLocaleString?.() ?? p.price}</td>
                          <td className="px-3 py-2 text-right">${p.cost?.toLocaleString?.() ?? p.cost}</td>
                          <td className="px-3 py-2 text-right">{p.quantity}</td>
                          <td className="px-3 py-2 text-right">{Number(p.profitMarginPercent || 0).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Best Sellers & Low Stock */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div id="best" className="overflow-hidden rounded-xl border border-primary-100 bg-white/80 backdrop-blur shadow-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900">Best Sellers</h2>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">Product</th>
                          <th className="px-3 py-2 text-right font-semibold">Units</th>
                          <th className="px-3 py-2 text-right font-semibold">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {best.map((b) => (
                          <tr key={b.sku} className="hover:bg-gray-50">
                            <td className="px-3 py-2">{b.name}</td>
                            <td className="px-3 py-2 text-right">{b.unitsSold.toLocaleString()}</td>
                            <td className="px-3 py-2 text-right">${b.revenue.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div id="low" className="overflow-hidden rounded-xl border border-primary-100 bg-white/80 backdrop-blur shadow-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900">Low Stock Alerts</h2>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">Product</th>
                          <th className="px-3 py-2 text-right font-semibold">Qty</th>
                          <th className="px-3 py-2 text-right font-semibold">Min</th>
                          <th className="px-3 py-2 text-left font-semibold">Location</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {low.map((l) => (
                          <tr key={l.sku} className="hover:bg-gray-50">
                            <td className="px-3 py-2">{l.name}</td>
                            <td className="px-3 py-2 text-right">{l.quantity}</td>
                            <td className="px-3 py-2 text-right">{l.minQuantity}</td>
                            <td className="px-3 py-2">{l.location || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory Turnover */}
            <div id="turnover" className="overflow-hidden rounded-xl border border-primary-100 bg-white/80 backdrop-blur shadow-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900">Inventory Turnover</h2>
                <div className="mt-4 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={turnover}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="sku" tick={false} />
                      <YAxis />
                      <Tooltip formatter={(v: any) => Number(v).toFixed(2)} labelFormatter={(l) => `SKU: ${l}`} />
                      <Bar dataKey="turnover" fill="#10B981" name="Turnover" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
                </main>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
