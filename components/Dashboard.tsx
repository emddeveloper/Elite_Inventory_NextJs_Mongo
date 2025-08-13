'use client'

import { useState } from 'react'
import { 
  CubeIcon, 
  CurrencyDollarIcon, 
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

const stats = [
  { name: 'Total Products', stat: '1,234', icon: CubeIcon, change: '+12%', changeType: 'increase' },
  { name: 'Total Value', stat: '$45,678', icon: CurrencyDollarIcon, change: '+8.2%', changeType: 'increase' },
  { name: 'Low Stock Items', stat: '23', icon: ExclamationTriangleIcon, change: '-5%', changeType: 'decrease' },
  { name: 'Monthly Sales', stat: '$12,345', icon: ArrowTrendingUpIcon, change: '+15.3%', changeType: 'increase' },
]

const chartData = [
  { name: 'Jan', sales: 4000, inventory: 2400 },
  { name: 'Feb', sales: 3000, inventory: 1398 },
  { name: 'Mar', sales: 2000, inventory: 9800 },
  { name: 'Apr', sales: 2780, inventory: 3908 },
  { name: 'May', sales: 1890, inventory: 4800 },
  { name: 'Jun', sales: 2390, inventory: 3800 },
]

const pieData = [
  { name: 'Electronics', value: 400, color: '#3B82F6' },
  { name: 'Clothing', value: 300, color: '#10B981' },
  { name: 'Books', value: 200, color: '#F59E0B' },
  { name: 'Home & Garden', value: 100, color: '#EF4444' },
]

const recentActivity = [
  { id: 1, action: 'Product added', item: 'iPhone 15 Pro', time: '2 minutes ago', type: 'add' },
  { id: 2, action: 'Stock updated', item: 'MacBook Air', time: '15 minutes ago', type: 'update' },
  { id: 3, action: 'Low stock alert', item: 'AirPods Pro', time: '1 hour ago', type: 'alert' },
  { id: 4, action: 'Product sold', item: 'iPad Air', time: '2 hours ago', type: 'sale' },
  { id: 5, action: 'Supplier order', item: 'Samsung Galaxy', time: '3 hours ago', type: 'order' },
]

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's what's happening with your inventory today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <item.icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
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
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sales" fill="#3B82F6" />
                <Bar dataKey="inventory" fill="#10B981" />
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
                <Tooltip />
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
            {recentActivity.map((activity, activityIdx) => (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {activityIdx !== recentActivity.length - 1 ? (
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
