'use client'

import React from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts'

type ChartDataItem = {
  name: string
  sales: number
  inventory: number
}

type PieItem = { name: string; value: number; color: string }

export default function DashboardCharts({ chartData, pieData }: { chartData: ChartDataItem[]; pieData: PieItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Sales & Inventory Chart */}
      <div className="overflow-hidden rounded-xl border border-primary-100 bg-white/80 backdrop-blur shadow-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Sales & Inventory Overview</h2>
          </div>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any, name: any) => [
                    name === 'sales' ? `₹${Number(value).toLocaleString()}` : Number(value).toLocaleString(),
                    name === 'sales' ? 'Sales (₹)' : 'Inventory (units)'
                  ]}
                />
                <Bar dataKey="sales" fill="#3B82F6" name="sales" />
                <Bar dataKey="inventory" fill="#10B981" name="inventory" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="overflow-hidden rounded-xl border border-primary-100 bg-white/80 backdrop-blur shadow-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Product Categories</h2>
          </div>
          <div className="mt-6 h-80">
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
                  formatter={(value: any) => [
                    `${value} products`,
                    'Count'
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
