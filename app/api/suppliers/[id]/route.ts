import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Supplier from '@/models/Supplier'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const supplier = await Supplier.findById(params.id)
    if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    return NextResponse.json(supplier)
  } catch (e) {
    console.error('Error fetching supplier:', e)
    return NextResponse.json({ error: 'Failed to fetch supplier' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const body = await request.json()

    const update: any = { ...body, updatedAt: new Date() }

    // If email changes, ensure uniqueness
    if (body.email) {
      const exists = await Supplier.findOne({ email: body.email.toLowerCase(), _id: { $ne: params.id } })
      if (exists) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
      update.email = String(body.email).toLowerCase()
    }

    const supplier = await Supplier.findByIdAndUpdate(params.id, update, { new: true, runValidators: true })
    if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    return NextResponse.json(supplier)
  } catch (e: any) {
    console.error('Error updating supplier:', e)
    if (e?.name === 'ValidationError') {
      const errors = Object.values(e.errors).map((err: any) => err.message)
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const supplier = await Supplier.findByIdAndUpdate(
      params.id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    )
    if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    return NextResponse.json({ message: 'Supplier deactivated' })
  } catch (e) {
    console.error('Error deleting supplier:', e)
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 })
  }
}
