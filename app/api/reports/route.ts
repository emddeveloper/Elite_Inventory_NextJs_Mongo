import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import Transaction from '@/models/Transaction'
import InventoryLedger from '@/models/InventoryLedger'

// Helper: parse period and date range
function getDateRange(period: string | null, daysParam?: string | null) {
  const now = new Date()
  const end = new Date(now)
  let start: Date
  const days = daysParam ? parseInt(daysParam) : undefined

  switch (period) {
    case 'daily': {
      // last 30 days for daily view
      start = new Date(now)
      start.setDate(start.getDate() - 30)
      start.setHours(0, 0, 0, 0)
      return { start, end }
    }
    case 'weekly': {
      // last 12 weeks
      start = new Date(now)
      start.setDate(start.getDate() - 7 * 12)
      start.setHours(0, 0, 0, 0)
      return { start, end }
    }
    case 'monthly': {
      // last 12 months
      start = new Date(now)
      start.setMonth(start.getMonth() - 12)
      start.setHours(0, 0, 0, 0)
      return { start, end }
    }
    default: {
      const d = Number.isFinite(days) && days && days > 0 ? days : 30
      start = new Date(now)
      start.setDate(start.getDate() - d)
      start.setHours(0, 0, 0, 0)
      return { start, end }
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const metric = (searchParams.get('metric') || '').toLowerCase()
    const period = (searchParams.get('period') || '').toLowerCase()
    const daysParam = searchParams.get('days')
    const { start, end } = getDateRange(period, daysParam)

    // Sales Trends (weekly or monthly)
    if (metric === 'sales-trends') {
      const unit = period === 'monthly' ? 'month' : period === 'daily' ? 'day' : 'week'
      const labelFormat = period === 'monthly' ? '%Y-%m' : period === 'daily' ? '%Y-%m-%d' : '%G-W%V'

      const data = await Transaction.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: {
          _id: { period: { $dateTrunc: { date: '$createdAt', unit } } },
          total: { $sum: '$total' },
          count: { $sum: 1 },
        }},
        { $project: {
          _id: 0,
          period: '$_id.period',
          total: 1,
          count: 1,
          label: { $dateToString: { date: '$_id.period', format: labelFormat } }
        }},
        { $sort: { period: 1 } },
      ])
      return NextResponse.json({ success: true, data })
    }

    // Profit margins (gross profit over time and per-product snapshot)
    if (metric === 'profit-margins') {
      // Time series profit (by day within range)
      const timeSeries = await Transaction.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $unwind: '$items' },
        // Join to product to get current cost (fallback 0 if not found)
        { $lookup: { from: 'products', localField: 'items.sku', foreignField: 'sku', as: 'prod' } },
        { $unwind: { path: '$prod', preserveNullAndEmptyArrays: true } },
        { $addFields: { itemCost: { $ifNull: ['$prod.cost', 0] } } },
        { $project: {
          createdAt: 1,
          // compute revenue and COGS via explicit fields below
          revenue: { $multiply: ['$items.unitPrice', '$items.quantity'] },
          // compute cogs and profit explicitly
          qty: '$items.quantity',
          unitPrice: '$items.unitPrice',
          cost: '$itemCost'
        }},
        { $addFields: {
          lineRevenue: { $multiply: ['$unitPrice', '$qty'] },
          lineCOGS: { $multiply: ['$cost', '$qty'] },
          day: { $dateTrunc: { date: '$createdAt', unit: 'day' } }
        }},
        { $group: {
          _id: '$day',
          revenue: { $sum: '$lineRevenue' },
          cogs: { $sum: '$lineCOGS' },
        }},
        { $project: {
          _id: 0,
          day: '$_id',
          label: { $dateToString: { date: '$_id', format: '%Y-%m-%d' } },
          revenue: 1,
          cogs: 1,
          profit: { $subtract: ['$revenue', '$cogs'] }
        }},
        { $sort: { day: 1 } }
      ])

      // Per-product margin snapshot using product fields
      const perProduct = await Product.aggregate([
        { $project: {
          _id: 0,
          sku: 1,
          name: '$name',
          price: 1,
          cost: 1,
          quantity: 1,
          profitMarginPercent: {
            $cond: [ { $gt: ['$cost', 0] }, { $multiply: [{ $divide: [{ $subtract: ['$price', '$cost'] }, '$cost'] }, 100] }, 0 ]
          }
        }},
        { $sort: { profitMarginPercent: -1 } },
        { $limit: 50 }
      ])

      return NextResponse.json({ success: true, data: { timeSeries, perProduct } })
    }

    // Low stock alerts
    if (metric === 'low-stock') {
      const items = await Product.find({ $expr: { $lte: ['$quantity', '$minQuantity'] } }, {
        _id: 0, sku: 1, name: 1, quantity: 1, minQuantity: 1, location: 1
      }).sort({ quantity: 1 }).limit(200).lean()
      return NextResponse.json({ success: true, data: items })
    }

    // Best-selling products
    if (metric === 'best-sellers') {
      const data = await Transaction.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $unwind: '$items' },
        { $group: {
          _id: { sku: '$items.sku', name: '$items.name' },
          unitsSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.unitPrice', '$items.quantity'] } },
        }},
        { $project: {
          _id: 0,
          sku: '$_id.sku',
          name: '$_id.name',
          unitsSold: 1,
          revenue: 1,
        }},
        { $sort: { unitsSold: -1, revenue: -1 } },
        { $limit: 20 }
      ])
      return NextResponse.json({ success: true, data })
    }

    // Inventory turnover rates (approximation using ledger balances)
    if (metric === 'turnover') {
      // Use ledger OUT as sales units; estimate starting and ending balances per product in range
      const results = await InventoryLedger.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $sort: { createdAt: 1 } },
        { $group: {
          _id: '$productId',
          sku: { $first: '$sku' },
          name: { $first: '$productName' },
          firstBal: { $first: '$balanceAfter' },
          lastBal: { $last: '$balanceAfter' },
          unitsSold: { $sum: { $cond: [{ $eq: ['$type', 'OUT'] }, '$quantity', 0] } }
        }},
        { $addFields: {
          // If we only have balanceAfter after OUT, approximate starting by adding OUT qty back
          approxStarting: { $add: ['$firstBal', '$unitsSold'] },
          approxEnding: '$lastBal',
        }},
        { $addFields: {
          avgInventory: { $max: [{ $divide: [{ $add: ['$approxStarting', '$approxEnding'] }, 2] }, 1] },
          turnover: { $divide: ['$unitsSold', { $max: [{ $divide: [{ $add: ['$approxStarting', '$approxEnding'] }, 2] }, 1] }] }
        }},
        { $project: { _id: 0, productId: '$_id', sku: 1, name: 1, unitsSold: 1, avgInventory: 1, turnover: 1 } },
        { $sort: { turnover: -1 } },
        { $limit: 50 }
      ])
      return NextResponse.json({ success: true, data: results })
    }

    return NextResponse.json({ success: false, error: 'Unknown or missing metric' }, { status: 400 })
  } catch (error) {
    console.error('Reports API Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch report' }, { status: 500 })
  }
}
