import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Customer from '@/models/Customer'

// GET /api/customers?search=&page=&limit=&sortBy=&sortOrder=&status=
export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = (searchParams.get('search') || '').trim()
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1
    const status = (searchParams.get('status') || '').toLowerCase() // 'active' | 'inactive' | 'all'

    const skip = (page - 1) * limit

    const query: any = {}
    if (status === 'active') query.isActive = true
    else if (status === 'inactive') query.isActive = false
    else if (status === 'all' || status === '') {
      // no isActive filter
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
        { 'contactPerson.name': { $regex: search, $options: 'i' } },
      ]
    }

    const sort: any = { [sortBy]: sortOrder }

    const customers = await Customer.find(query).sort(sort).skip(skip).limit(limit)
    const total = await Customer.countDocuments(query)

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (e) {
    console.error('Error fetching customers:', e)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

// POST /api/customers
export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const body = await request.json()

    const normalized = {
      name: String(body.name || '').trim(),
      email: String(body.email || '').trim().toLowerCase(),
      phone: String(body.phone || '').trim(),
      address: {
        street: String(body.address?.street || '').trim(),
        city: String(body.address?.city || '').trim(),
        state: String(body.address?.state || '').trim(),
        zipCode: String(body.address?.zipCode || '').trim(),
        country: String(body.address?.country || 'USA').trim(),
      },
      contactPerson: {
        name: String(body.contactPerson?.name || '').trim(),
        email: String(body.contactPerson?.email || '').trim(),
        phone: String(body.contactPerson?.phone || '').trim(),
      },
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      notes: body.notes ? String(body.notes) : undefined,
    }

    const missing: string[] = []
    if (!normalized.name) missing.push('name')
    if (!normalized.email) missing.push('email')
    if (!normalized.phone) missing.push('phone')
    if (!normalized.address.street) missing.push('address.street')
    if (!normalized.address.city) missing.push('address.city')
    if (!normalized.address.state) missing.push('address.state')
    if (!normalized.address.zipCode) missing.push('address.zipCode')
    if (!normalized.contactPerson.name) missing.push('contactPerson.name')
    if (!normalized.contactPerson.email) missing.push('contactPerson.email')
    if (!normalized.contactPerson.phone) missing.push('contactPerson.phone')

    if (missing.length) {
      return NextResponse.json(
        { error: 'Missing or invalid fields', details: missing },
        { status: 400 }
      )
    }

    const existing = await Customer.findOne({ email: normalized.email })
    if (existing) {
      return NextResponse.json(
        { error: 'Customer with this email already exists' },
        { status: 400 }
      )
    }

    const customer = await Customer.create(normalized)
    return NextResponse.json(customer, { status: 201 })
  } catch (e: any) {
    console.error('Error creating customer:', e)
    if (e?.name === 'ValidationError') {
      const errors = Object.values(e.errors).map((err: any) => err.message)
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}
