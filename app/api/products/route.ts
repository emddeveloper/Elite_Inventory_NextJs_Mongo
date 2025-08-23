import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import InventoryLedger from '@/models/InventoryLedger'
import { AUTH_COOKIE, decodeAuthCookie } from '@/lib/auth-cookie'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
  const lowStock = searchParams.get('lowStock') === 'true'
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build query
    let query: any = { isActive: true }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    if (category) {
      query.category = category
    }

    if (lowStock) {
      // Match documents where quantity <= minQuantity
      // Use $expr to compare fields
      query.$expr = { $lte: ['$quantity', '$minQuantity'] }
    }

    // Build sort object
    const sort: any = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1

    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('supplier', 'name email')

    const total = await Product.countDocuments(query)
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // Normalize and validate input
    const allowedCategories = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Other']

    const normalized = {
      name: typeof body.name === 'string' ? body.name.trim() : '',
      sku: typeof body.sku === 'string' ? body.sku.trim() : '',
      description: typeof body.description === 'string' ? body.description.trim() : '',
      category: typeof body.category === 'string' ? body.category.trim() : '',
  gstPercent: body.gstPercent !== undefined ? Number(body.gstPercent) : 5,
      price: Number(body.price),
      cost: Number(body.cost),
      quantity: body.quantity !== undefined ? Number(body.quantity) : 0,
      minQuantity: body.minQuantity !== undefined ? Number(body.minQuantity) : 10,
      location: typeof body.location === 'string' ? body.location.trim() : '',
      image: body.image ? String(body.image) : undefined,
      tags: Array.isArray(body.tags)
        ? body.tags.map((t: any) => String(t).trim()).filter(Boolean)
        : (typeof body.tags === 'string' ? body.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []),
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      supplier: body.supplier || undefined
    }

    // Basic field checks
    const missing: string[] = []
    if (!normalized.name) missing.push('name')
    if (!normalized.sku) missing.push('sku')
    if (!normalized.description) missing.push('description')
    if (!normalized.category) missing.push('category')
    if (!Number.isFinite(normalized.price)) missing.push('price')
  if (!Number.isFinite(normalized.gstPercent)) missing.push('gstPercent')
    if (!Number.isFinite(normalized.cost)) missing.push('cost')
    if (!Number.isFinite(normalized.quantity)) missing.push('quantity')
    if (!Number.isFinite(normalized.minQuantity)) missing.push('minQuantity')
    if (!normalized.location) missing.push('location')

    if (missing.length) {
      return NextResponse.json(
        { error: 'Missing or invalid fields', details: missing },
        { status: 400 }
      )
    }

    if (!allowedCategories.includes(normalized.category)) {
      return NextResponse.json(
        { error: 'Invalid category', details: [normalized.category] },
        { status: 400 }
      )
    }

    // Unique SKU check
    const existingProduct = await Product.findOne({ sku: normalized.sku })
    if (existingProduct) {
      return NextResponse.json(
        { error: 'SKU already exists' },
        { status: 400 }
      )
    }

  const product = await Product.create(normalized)
    // Record opening balance in ledger if initial stock provided
    try {
      // extract actor from cookie (Node-safe)
      const raw = request.cookies.get(AUTH_COOKIE)?.value
      const actor = decodeAuthCookie(raw)
      if (Number(product.quantity) > 0) {
        await InventoryLedger.create({
          productId: product._id,
          sku: product.sku,
          productName: product.name,
          type: 'ADJUSTMENT',
          quantity: Number(product.quantity),
          balanceAfter: Number(product.quantity),
          source: 'opening',
          note: 'Initial stock on product creation',
          username: actor.username,
          userRole: actor.role,
        })
      }
    } catch (e) {
      console.error('Failed to write opening ledger entry:', e)
      // Do not fail product creation if ledger write fails
    }
    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    console.error('Error creating product:', error)

    // Duplicate key error safety (in case of race condition)
    if (error?.code === 11000 || error?.name === 'MongoServerError') {
      return NextResponse.json(
        { error: 'SKU already exists' },
        { status: 400 }
      )
    }

    if (error?.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message)
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
