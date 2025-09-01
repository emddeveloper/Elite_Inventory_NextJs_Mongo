import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Customer from '@/models/Customer'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const customer = await Customer.findById(params.id)
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    return NextResponse.json(customer)
  } catch (e) {
    console.error('Error fetching customer:', e)
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const body = await request.json()

    const update: any = { ...body, updatedAt: new Date() }

    if (body.email) {
      const exists = await Customer.findOne({ email: String(body.email).toLowerCase(), _id: { $ne: params.id } })
      if (exists) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
      update.email = String(body.email).toLowerCase()
    }

    const customer = await Customer.findByIdAndUpdate(params.id, update, { new: true, runValidators: true })
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    return NextResponse.json(customer)
  } catch (e: any) {
    console.error('Error updating customer:', e)
    if (e?.name === 'ValidationError') {
      const errors = Object.values(e.errors).map((err: any) => err.message)
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const customer = await Customer.findByIdAndUpdate(
      params.id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    )
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    return NextResponse.json({ message: 'Customer deactivated' })
  } catch (e) {
    console.error('Error deleting customer:', e)
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }
}
