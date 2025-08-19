import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'

export async function GET() {
  try {
    await dbConnect()

    // Get total products count
    const totalProducts = await Product.countDocuments({ isActive: true })

    // Get total inventory value
    const products = await Product.find({ isActive: true })
    const totalValue = products.reduce((sum, product) => {
      return sum + (product.price * product.quantity)
    }, 0)

    // Get low stock items count
    const lowStockItems = await Product.countDocuments({
      isActive: true,
      $expr: { $lte: ['$quantity', '$minQuantity'] }
    })

    // Get category distribution
    const categoryStats = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$price', '$quantity'] } }
        }
      },
      { $sort: { count: -1 } }
    ])

    // Get monthly sales data (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyData = await Product.aggregate([
      {
        $match: {
          isActive: true,
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          sales: { $sum: { $multiply: ['$price', '$quantity'] } },
          inventory: { $sum: '$quantity' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])

    // Format monthly data for charts
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const chartData = monthlyData.map(item => ({
      name: monthNames[item._id.month - 1],
      sales: Math.round(item.sales),
      inventory: item.inventory
    }))

    // Get recent activity (last 10 products added/updated)
    const recentActivity = await Product.find({ isActive: true })
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('name updatedAt quantity minQuantity')
      .lean()

    const formattedActivity = recentActivity.map(product => {
      const timeDiff = Date.now() - new Date(product.updatedAt).getTime()
      const minutes = Math.floor(timeDiff / (1000 * 60))
      const hours = Math.floor(minutes / 60)
      const days = Math.floor(hours / 24)

      let timeAgo = ''
      if (days > 0) {
        timeAgo = `${days} day${days > 1 ? 's' : ''} ago`
      } else if (hours > 0) {
        timeAgo = `${hours} hour${hours > 1 ? 's' : ''} ago`
      } else if (minutes > 0) {
        timeAgo = `${minutes} minute${minutes > 1 ? 's' : ''} ago`
      } else {
        timeAgo = 'Just now'
      }

      let action = 'Product updated'
      let type = 'update'
      
      if (product.quantity <= product.minQuantity) {
        action = 'Low stock alert'
        type = 'alert'
      }

      return {
        id: product._id,
        action,
        item: product.name,
        time: timeAgo,
        type
      }
    })

    // Calculate percentage changes (mock data for now - you can implement real comparison logic)
    const stats = [
      {
        name: 'Total Products',
        stat: totalProducts.toLocaleString(),
        change: '+12%',
        changeType: 'increase'
      },
      {
        name: 'Total Value',
        stat: `$${totalValue.toLocaleString()}`,
        change: '+8.2%',
        changeType: 'increase'
      },
      {
        name: 'Low Stock Items',
        stat: lowStockItems.toString(),
        change: '-5%',
        changeType: 'decrease'
      },
      {
        name: 'Monthly Sales',
        stat: `$${Math.round(totalValue / 12).toLocaleString()}`,
        change: '+15.3%',
        changeType: 'increase'
      }
    ]

    return NextResponse.json({
      success: true,
      data: {
        stats,
        chartData,
        categoryStats,
        recentActivity: formattedActivity
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
