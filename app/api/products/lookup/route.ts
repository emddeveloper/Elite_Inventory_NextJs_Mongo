import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'

// GET /api/products/lookup?code=VALUE
// Looks up a product by exact SKU; falls back to regex search on name/description if not found
export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const code = (searchParams.get('code') || '').trim()
    if (!code) {
      return NextResponse.json({ error: 'Missing code param' }, { status: 400 })
    }

    let product = await Product.findOne({ sku: code }).populate('supplier', 'name email')
    if (!product) {
      product = await Product.findOne({
        $or: [
          { name: { $regex: code, $options: 'i' } },
          { description: { $regex: code, $options: 'i' } },
        ],
      }).populate('supplier', 'name email')
    }

    if (!product) return NextResponse.json({ product: null }, { status: 200 })
    return NextResponse.json({ product })
  } catch (e) {
    console.error('Lookup error', e)
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}
