export interface DashboardData {
  stats: Array<{
    name: string
    stat: string
    change: string
    changeType: 'increase' | 'decrease'
  }>
  chartData: Array<{
    name: string
    sales: number
    inventory: number
  }>
  categoryStats: Array<{
    _id: string
    count: number
    totalValue: number
  }>
  recentActivity: Array<{
    id: string
    action: string
    item: string
    time: string
    type: string
  }>
}

export interface DashboardStats {
  totalProducts: number
  totalValue: number
  lowStockItems: number
  monthlySales: number
}

export interface ChartDataPoint {
  name: string
  sales: number
  inventory: number
}

export interface CategoryStat {
  _id: string
  count: number
  totalValue: number
}

export interface ActivityItem {
  id: string
  action: string
  item: string
  time: string
  type: 'add' | 'update' | 'alert' | 'sale' | 'order'
}
