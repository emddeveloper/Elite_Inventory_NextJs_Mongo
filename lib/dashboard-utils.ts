import { DashboardData } from '@/types/dashboard'

export async function fetchDashboardData(): Promise<{ success: boolean; data: DashboardData | null; error?: string }> {
  try {
    console.log('🔄 Fetching data from API...')
    const response = await fetch('/api/dashboard', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    
    if (result.success) {
      console.log('✅ API data fetched successfully')
      return { success: true, data: result.data }
    } else {
      throw new Error(result.error || 'API returned unsuccessful response')
    }
  } catch (error) {
    console.error('❌ API fetch failed:', error)
    const errorMsg = error && typeof error === 'object' && 'message' in (error as any) ? (error as any).message : String(error)
    return {
      success: false,
      data: null,
      error: `Failed to load dashboard data from API: ${errorMsg}`
    }
  }
}

export function getDataStatusIndicator() {
  return {
    label: 'Live Data',
    color: 'green',
    icon: 'wifi'
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}
