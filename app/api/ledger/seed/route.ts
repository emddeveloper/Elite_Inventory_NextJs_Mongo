import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import InventoryLedger from '@/models/InventoryLedger'
import Product from '@/models/Product'

export async function POST() {
  try {
    await dbConnect()

    const products = await Product.find({}).limit(5)
    if (!products.length) {
      return NextResponse.json({ error: 'Seed products first (scripts/seed-data.js)' }, { status: 400 })
    }

    // Clear existing ledger for a clean demo
    await InventoryLedger.deleteMany({})

    const entries: any[] = []
    const now = new Date()

    for (const p of products) {
      // Opening balance
      entries.push({
        productId: p._id,
        sku: p.sku,
        productName: p.name,
        type: 'ADJUSTMENT',
        quantity: Math.max(0, p.quantity),
        source: 'opening',
        note: 'Opening balance',
        balanceAfter: p.quantity,
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
      })
      // Purchase IN
      entries.push({
        productId: p._id,
        sku: p.sku,
        productName: p.name,
        type: 'IN',
        quantity: 5,
        unitCost: p.cost,
        source: 'purchase',
        reference: 'PO-1001',
        note: 'Supplier restock',
        balanceAfter: p.quantity + 5,
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
      })
      // Sale OUT
      entries.push({
        productId: p._id,
        sku: p.sku,
        productName: p.name,
        type: 'OUT',
        quantity: 2,
        unitPrice: p.price,
        source: 'sale',
        reference: 'INV-5001',
        note: 'Customer sale',
        balanceAfter: p.quantity + 3, // +5 -2
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24), // 1 day ago
      })
    }

    await InventoryLedger.insertMany(entries)

    // Optionally sync product quantities to the last balanceAfter per product
    const latestBySku = await InventoryLedger.aggregate([
      { $sort: { createdAt: 1 } },
      { $group: { _id: '$sku', balanceAfter: { $last: '$balanceAfter' } } },
    ])
    for (const row of latestBySku) {
      await Product.updateOne({ sku: row._id }, { $set: { quantity: row.balanceAfter } })
    }

    return NextResponse.json({ inserted: entries.length })
  } catch (e) {
    console.error('Ledger seed error', e)
    return NextResponse.json({ error: 'Failed to seed ledger' }, { status: 500 })
  }
}
