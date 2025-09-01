'use client'

import { useState, useEffect } from 'react'
import { 
  CubeIcon, 
  CurrencyRupeeIcon, 
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  WifiIcon
} from '@heroicons/react/24/outline'
import { DashboardData } from '@/types/dashboard'
import { fetchDashboardData } from '@/lib/dashboard-utils'
import dynamic from 'next/dynamic'

const DashboardCharts = dynamic(() => import('@/components/DashboardCharts'), { ssr: false })

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      if (process.env.NODE_ENV !== 'production') console.log('🔄 Dashboard: Starting data load...')
      const result = await fetchDashboardData()
      
      if (process.env.NODE_ENV !== 'production') console.log('📊 Dashboard: Fetch result:', { success: result.success })
      
      if (result.success && result.data) {
        setData(result.data)
        setError(null)
        if (process.env.NODE_ENV !== 'production') console.log('✅ Dashboard: Data loaded successfully')
      } else {
        setError(result.error || 'Failed to load dashboard data')
        if (process.env.NODE_ENV !== 'production') console.error('❌ Dashboard: Failed to load data:', result.error)
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('❌ Dashboard: Unexpected error during data load:', err)
      setError('An unexpected error occurred while loading dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    if (process.env.NODE_ENV !== 'production') console.log('🔄 Dashboard: Manual refresh triggered')
    await loadDashboardData()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back! Here's what's happening with your inventory today.
            </p>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <WifiIcon className="h-4 w-4" />
            <span>Live Data</span>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back! Here's what's happening with your inventory today.
            </p>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <WifiIcon className="h-4 w-4" />
            <span>Live Data</span>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center py-12">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading dashboard</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <div className="mt-6">
              <button
                onClick={refreshData}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  // Transform category stats for pie chart
  const pieData = data.categoryStats.map((category, index) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
    return {
      name: category._id,
      value: category.count,
      color: colors[index % colors.length]
    }
  })

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here's what's happening with your inventory today.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Data Source Indicator */}
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <WifiIcon className="h-4 w-4" />
            <span>Live Data</span>
          </div>
          <button
            onClick={refreshData}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats (cards) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {data.stats.map((item) => {
          const money = item.name === 'Total Value' || item.name === 'Monthly Sales' || item.name === 'Daily Sales'
          const value = (() => {
            const s = String(item.stat ?? '').trim()
            if (!money) return s || '—'
            if (!s) return '₹0.00'
            if (s.startsWith('₹')) return s
            if (s.startsWith('$')) return s.replace(/^\$\s?/, '₹')
            return `₹${s}`
          })()
          const badge = item.changeType === 'increase'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
          const Icon = item.name === 'Total Products' ? CubeIcon
                      : item.name === 'Total Value' ? CurrencyRupeeIcon
                      : item.name === 'Low Stock Items' ? ExclamationTriangleIcon
                      : item.name === 'Monthly Sales' ? ArrowTrendingUpIcon
                      : CurrencyRupeeIcon
          return (
            <div key={item.name} className="rounded-xl border border-gray-200 bg-white shadow-sm">
              {/* Header */}
              <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                </div>
                <button className="p-1 text-gray-400 hover:text-gray-600" aria-label="More">
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm4 2a2 2 0 100-4 2 2 0 000 4z"/></svg>
                </button>
              </div>
              <div className="px-4">
                <div className="border-t border-gray-100"></div>
              </div>
              {/* Info row */}
              <div className="px-4 pt-3 text-sm text-gray-600 flex items-center justify-between">
                <span className="text-gray-500">Change</span>
                <span className="text-gray-500">from last month</span>
              </div>
              {/* Value row */}
              <div className="px-4 pb-4 pt-1 flex items-center justify-between">
                <div className="text-lg font-semibold text-gray-900">{value}</div>
                {item.change && (
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge}`}>
                    {item.changeType === 'increase' ? 'Increase' : 'Decrease'} {item.change}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts (code-split) */}
      <DashboardCharts chartData={data.chartData as any} pieData={pieData as any} />

      {/* Recent Activity */}
      <div className="bg-white/80 backdrop-blur shadow-lg overflow-hidden sm:rounded-xl border border-primary-100">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Latest inventory updates and transactions</p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="flow-root">
            <ul role="list" className="-mb-8">
              {data.recentActivity.map((activity, activityIdx) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {activityIdx !== data.recentActivity.length - 1 ? (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                          activity.type === 'add' ? 'bg-green-500' :
                          activity.type === 'update' ? 'bg-blue-500' :
                          activity.type === 'alert' ? 'bg-yellow-500' :
                          activity.type === 'sale' ? 'bg-purple-500' :
                          'bg-gray-500'
                        }`}>
                          <span className="text-white text-xs font-medium">
                            {activity.type === 'add' ? '+' :
                             activity.type === 'update' ? '↻' :
                             activity.type === 'alert' ? '!' :
                             activity.type === 'sale' ? '₹' :
                             '→'}
                          </span>
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div>
                          <p className="text-sm text-gray-500">
                            {activity.action} <span className="font-medium text-gray-900">{activity.item}</span>
                          </p>
                        </div>
                        <div className="whitespace-nowrap text-right text-sm text-gray-500">
                          {activity.time}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
