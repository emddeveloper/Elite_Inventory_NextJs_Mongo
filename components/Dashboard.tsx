'use client'

import { useState, useEffect } from 'react'
import { 
  CubeIcon, 
  CurrencyDollarIcon, 
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  WifiIcon,
  WifiIcon as WifiOffIcon
} from '@heroicons/react/24/outline'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { DashboardData } from '@/types/dashboard'
import { fetchDashboardData, getDataStatusIndicator } from '@/lib/dashboard-utils'

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<'api' | 'fallback'>('api')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      console.log('🔄 Dashboard: Starting data load...')
      const result = await fetchDashboardData()
      
      if (result.data) {
        console.log('✅ Dashboard: Data loaded successfully from', result.source)
        setData(result.data)
        setDataSource(result.source)
        setError(null)
      } else {
        console.error('❌ Dashboard: Failed to load data:', result.error)
        setError(result.error || 'Failed to load dashboard data')
      }
    } catch (err) {
      console.error('❌ Dashboard: Unexpected error during data load:', err)
      setError('An unexpected error occurred while loading dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    let intervalId: NodeJS.Timeout | null = null

    const load = async () => {
      try {
        if (!mounted) return
        setLoading(true)
        const res = await fetchDashboardData()
        if (!mounted) return
        if (res.success) {
          setData(res.data)
          setError(null)
        } else {
          setError(res.error || 'Failed to load dashboard')
        }
      } catch (e) {
        if (!mounted) return
        setError(String(e))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    // initial load
    load()

    // If using API as dataSource, poll every 5 seconds for live updates.
    if (dataSource === 'api') {
      intervalId = setInterval(load, 60*1000*5)
    }

    return () => {
      mounted = false
      if (intervalId) clearInterval(intervalId)
    }
  }, [dataSource])
  const retryApiConnection = async () => {
    try {
      setLoading(true)
      const result = await fetchDashboardData()
      
      if (result.data) {
        setData(result.data)
        setDataSource(result.source)
        setError(null)
      } else {
        setError(result.error || 'Failed to load dashboard data')
      }
    } catch (err) {
      console.error('Retry failed:', err)
      setError('Failed to reconnect to API')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    const statusIndicator = getDataStatusIndicator(dataSource)
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back! Here's what's happening with your inventory today.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {statusIndicator.label}
            </span>
            <div className="p-2 text-gray-400">
              {statusIndicator.icon === 'wifi' ? (
                <WifiIcon className="h-5 w-5" />
              ) : (
                <WifiOffIcon className="h-5 w-5" />
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error && !data) {
    const statusIndicator = getDataStatusIndicator(dataSource)
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back! Here's what's happening with your inventory today.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {statusIndicator.label}
            </span>
            <div className="p-2 text-gray-400">
              {statusIndicator.icon === 'wifi' ? (
                <WifiIcon className="h-5 w-5" />
              ) : (
                <WifiOffIcon className="h-5 w-5" />
              )}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="text-center py-12">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading dashboard</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <div className="mt-6 space-x-3">
              <button
                onClick={retryApiConnection}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try API again
              </button>
              <button
                onClick={loadDashboardData}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Reload Data
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

  const statusIndicator = getDataStatusIndicator(dataSource)

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
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">
            {statusIndicator.label}
          </span>
          <button
            onClick={retryApiConnection}
            className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              dataSource === 'api'
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
            }`}
          >
            {dataSource === 'api' ? (
              <>
                <WifiIcon className="h-4 w-4 mr-2" />
                Live
              </>
            ) : (
              <>
                <WifiOffIcon className="h-4 w-4 mr-2" />
                Demo
              </>
            )}
          </button>
        </div>
      </div>

      {/* Data source indicator */}
      {dataSource === 'fallback' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Demo Mode Active
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  The dashboard is currently displaying demo data. The API may be unavailable or there might be connectivity issues.
                  Click the "Live" button to try connecting to the API again.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {data.stats.map((item) => (
          <div key={item.name} className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {item.name === 'Total Products' && <CubeIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />}
                {item.name === 'Total Value' && <CurrencyDollarIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />}
                {item.name === 'Low Stock Items' && <ExclamationTriangleIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />}
                {item.name === 'Monthly Sales' && <ArrowTrendingUpIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />}
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{item.stat}</div>
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className={`flex items-center text-sm ${
                item.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {item.changeType === 'increase' ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                )}
                <span className="ml-1">{item.change}</span>
                <span className="ml-1 text-gray-500">from last month</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sales & Inventory Chart */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sales & Inventory Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'sales' ? `$${value.toLocaleString()}` : value.toLocaleString(),
                    name === 'sales' ? 'Sales ($)' : 'Inventory (units)'
                  ]}
                />
                <Bar dataKey="sales" fill="#3B82F6" name="sales" />
                <Bar dataKey="inventory" fill="#10B981" name="inventory" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Category Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [
                    `${value} products`,
                    'Count'
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
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
                           activity.type === 'sale' ? '$' :
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
  )
}
