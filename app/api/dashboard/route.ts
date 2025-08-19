import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Dashboard from '@/models/Dashboard'

export async function GET() {
  try {
    await dbConnect()

    // Fetch dashboard data from MongoDB
    const dashboardData = await Dashboard.findOne().sort({ lastUpdated: -1 })

    if (!dashboardData) {
      return NextResponse.json(
        { success: false, error: 'No dashboard data found. Please seed the database first.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        stats: dashboardData.stats,
        chartData: dashboardData.chartData,
        categoryStats: dashboardData.categoryStats,
        recentActivity: dashboardData.recentActivity,
        lastUpdated: dashboardData.lastUpdated
      }
    })

  } catch (error) {
    console.error('Dashboard API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    await dbConnect()

    // This endpoint can be used to update dashboard data
    // For now, we'll return a message indicating the endpoint exists
    return NextResponse.json({
      success: true,
      message: 'Dashboard update endpoint - implement your update logic here'
    })

  } catch (error) {
    console.error('Dashboard Update API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update dashboard data' },
      { status: 500 }
    )
  }
}
