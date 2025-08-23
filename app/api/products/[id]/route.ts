import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import InventoryLedger from '@/models/InventoryLedger'
import { AUTH_COOKIE, decodeAuthCookie } from '@/lib/auth-cookie'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    
    const product = await Product.findById(params.id).populate('supplier', 'name email')
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    
    const body = await request.json()
    const prev = await Product.findById(params.id)
    
    // Check if SKU already exists (excluding current product)
    if (body.sku) {
      const existingProduct = await Product.findOne({ 
        sku: body.sku, 
        _id: { $ne: params.id } 
      })
      if (existingProduct) {
        return NextResponse.json(
          { error: 'SKU already exists' },
          { status: 400 }
        )
      }
    }

    const product = await Product.findByIdAndUpdate(
      params.id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('supplier', 'name email')

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // If quantity changed via edit, record an ADJUSTMENT entry setting absolute stock level
    try {
      const raw = request.cookies.get(AUTH_COOKIE)?.value
      const actor = decodeAuthCookie(raw)
      const hasQty = Object.prototype.hasOwnProperty.call(body, 'quantity')
      if (product && prev && hasQty) {
        const newQty = Number(product.quantity)
        const oldQty = Number(prev.quantity)
        if (Number.isFinite(newQty) && newQty !== oldQty) {
          await InventoryLedger.create({
            productId: product._id,
            sku: product.sku,
            productName: product.name,
            type: 'ADJUSTMENT',
            quantity: newQty, // ADJUSTMENT uses absolute quantity
            balanceAfter: newQty,
            source: 'adjustment',
            note: `Stock adjusted via product edit (was ${oldQty})`,
            username: actor.username,
            userRole: actor.role,
          })
        }
      }
    } catch (e) {
      console.error('Failed to write ledger on product edit:', e)
    }

    return NextResponse.json(product)
  } catch (error: any) {
    console.error('Error updating product:', error)
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message)
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    const prev = await Product.findById(params.id)
    const product = await Product.findByIdAndUpdate(
      params.id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    )

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    try {
      // Log a ledger entry to record who deactivated the product (no stock change)
      const raw = request.cookies.get(AUTH_COOKIE)?.value
      const actor = decodeAuthCookie(raw)
      if (prev) {
        await InventoryLedger.create({
          productId: prev._id,
          sku: prev.sku,
          productName: prev.name,
          type: 'ADJUSTMENT',
          quantity: Number(prev.quantity), // keep as absolute quantity
          balanceAfter: Number(prev.quantity),
          source: 'adjustment',
          note: 'Product deactivated',
          username: actor.username,
          userRole: actor.role,
        })
      }
    } catch (e) {
      console.error('Failed to write ledger on product delete:', e)
    }

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
