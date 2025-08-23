import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import Transaction from '@/models/Transaction'

export async function GET() {
  try {
    await dbConnect()

    // Compute live aggregates
    const totalProducts = await Product.countDocuments()
    const totalValueAgg = await Product.aggregate([
      { $project: { totalValue: { $multiply: ['$price', '$quantity'] } } },
      { $group: { _id: null, total: { $sum: '$totalValue' } } }
    ])
    const totalValue = (totalValueAgg[0] && totalValueAgg[0].total) || 0

    const lowStockCount = await Product.countDocuments({ $expr: { $lt: ['$quantity', '$minQuantity'] } })

    // Monthly sales (sum of transactions in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const monthlySalesAgg = await Transaction.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, totalSales: { $sum: '$total' } } }
    ])
    const monthlySales = (monthlySalesAgg[0] && monthlySalesAgg[0].totalSales) || 0

    // Category stats
    const categoryStats = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])

    // Chart data: last 7 days sales and inventory
    const days = 7
    const chartData: Array<any> = []
    for (let i = days - 1; i >= 0; i--) {
      const from = new Date()
      from.setDate(from.getDate() - i)
      from.setHours(0,0,0,0)
      const to = new Date(from)
      to.setHours(23,59,59,999)
      const salesAgg = await Transaction.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: null, sales: { $sum: '$total' } } }
      ])
      const sales = (salesAgg[0] && salesAgg[0].sales) || 0
      const inventoryAgg = await Product.aggregate([
        { $group: { _id: null, inventory: { $sum: '$quantity' } } }
      ])
      const inventory = (inventoryAgg[0] && inventoryAgg[0].inventory) || 0
      chartData.push({ name: from.toLocaleDateString(), sales, inventory })
    }

    // Recent activity: latest 10 transactions and product updates
    const recentTransactions = await Transaction.find().sort({ createdAt: -1 }).limit(10).lean()
    const recentActivity = recentTransactions.map(t => ({ id: String(t._id), type: 'sale', action: 'Invoice created', item: t.invoiceNumber, time: new Date(t.createdAt).toLocaleString() }))

    const stats = [
      { name: 'Total Products', stat: totalProducts, change: '0%', changeType: 'increase' },
      { name: 'Total Value', stat: totalValue, change: '0%', changeType: 'increase' },
      { name: 'Low Stock Items', stat: lowStockCount, change: '0%', changeType: lowStockCount > 0 ? 'alert' : 'increase' },
      { name: 'Monthly Sales', stat: monthlySales, change: '0%', changeType: 'increase' }
    ]

    return NextResponse.json({ success: true, data: { stats, chartData, categoryStats, recentActivity, lastUpdated: new Date() } })

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
