import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import InventoryLedger from '@/models/InventoryLedger'
import Product from '@/models/Product'
import { AUTH_COOKIE, decodeAuthCookie } from '@/lib/auth-cookie'

// GET /api/ledger?sku=&type=&search=&dateFrom=&dateTo=&page=1&limit=20
export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const sku = searchParams.get('sku') || ''
    const type = searchParams.get('type') || '' // IN|OUT|ADJUSTMENT
    const search = searchParams.get('search') || '' // productName
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const query: any = {}
    if (sku) query.sku = sku
    if (type) query.type = type
    if (search) query.productName = { $regex: search, $options: 'i' }

    if (dateFrom || dateTo) {
      query.createdAt = {}
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom)
      if (dateTo) {
        const to = new Date(dateTo)
        // include the full day
        to.setHours(23, 59, 59, 999)
        query.createdAt.$lte = to
      }
    }

    const [items, total] = await Promise.all([
      InventoryLedger.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      InventoryLedger.countDocuments(query),
    ])

    return NextResponse.json({
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (e) {
    console.error('Ledger GET error', e)
    return NextResponse.json({ error: 'Failed to fetch ledger' }, { status: 500 })
  }
}

// POST /api/ledger  body: { productId, sku, productName, type, quantity, unitCost?, unitPrice?, reference?, source?, note? }
export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const body = await request.json()

    const { productId, sku, productName, type, quantity } = body || {}
    if (!productId || !sku || !productName || !type || !Number.isFinite(Number(quantity))) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const product = await Product.findById(productId)
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    // Compute new balance and update product.quantity
    const q = Number(quantity)
    let newBalance = product.quantity
    if (type === 'IN') newBalance = product.quantity + q
    else if (type === 'OUT') newBalance = product.quantity - q
    else if (type === 'ADJUSTMENT') newBalance = q // in adjustment, quantity is treated as absolute stock level

    if (newBalance < 0) newBalance = 0

    // extract actor from cookie (Node-safe)
    const raw = request.cookies.get(AUTH_COOKIE)?.value
    const actor = decodeAuthCookie(raw)

    const entry = await InventoryLedger.create({
      productId,
      sku,
      productName,
      type,
      quantity: q,
      unitCost: body.unitCost,
      unitPrice: body.unitPrice,
      reference: body.reference,
      source: body.source,
      note: body.note,
      balanceAfter: newBalance,
      username: actor.username,
      userRole: actor.role,
    })

    product.quantity = newBalance
    await product.save()

    return NextResponse.json(entry, { status: 201 })
  } catch (e) {
    console.error('Ledger POST error', e)
    return NextResponse.json({ error: 'Failed to create ledger entry' }, { status: 500 })
  }
}
