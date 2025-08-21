import { DashboardData } from '@/types/dashboard'

export async function fetchDashboardData(): Promise<{ success: boolean; data: DashboardData | null; source: 'api' | 'fallback'; error?: string }> {
  try {
    // Try to fetch from API first
    console.log('🔄 Attempting to fetch data from API...')
    const response = await fetch('/api/dashboard', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout for better UX
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    
    if (result.success) {
      console.log('✅ API data fetched successfully')
      return { success: true, data: result.data, source: 'api' }
    } else {
      throw new Error(result.error || 'API returned unsuccessful response')
    }
  } catch (error) {
    console.warn('⚠️ API fetch failed, falling back to demo data:', error)
    
    // Fallback to demo data
    try {
      console.log('🔄 Loading fallback data from /data/dashboard-data.json...')
      const fallbackResponse = await fetch('/data/dashboard-data.json', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout for fallback
      })

      if (!fallbackResponse.ok) {
        throw new Error(`Fallback HTTP error! status: ${fallbackResponse.status}`)
      }

      const fallbackData = await fallbackResponse.json()
      console.log('✅ Fallback data loaded successfully')
      return { success: true, data: fallbackData, source: 'fallback' }
    } catch (fallbackError) {
        console.error('❌ Both API and fallback failed:', fallbackError)
        const apiMsg = error && typeof error === 'object' && 'message' in (error as any) ? (error as any).message : String(error)
        const fbMsg = fallbackError && typeof fallbackError === 'object' && 'message' in (fallbackError as any) ? (fallbackError as any).message : String(fallbackError)
        return {
          success: false,
          data: null,
          source: 'fallback',
          error: `Failed to load dashboard data from both API and fallback sources. API error: ${apiMsg}, Fallback error: ${fbMsg}`
        }
    }
  }
}

export function getDataStatusIndicator(source: 'api' | 'fallback') {
  return {
    label: source === 'api' ? 'Live Data' : 'Demo Data',
    color: source === 'api' ? 'green' : 'yellow',
    icon: source === 'api' ? 'wifi' : 'wifi-off'
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}
