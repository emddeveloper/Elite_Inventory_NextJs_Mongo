import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import Transaction from '@/models/Transaction'

function generateInvoiceNumber() {
	const now = new Date()
	return `INV-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-${Math.random().toString(36).slice(2,8).toUpperCase()}`
}

export async function GET(request: NextRequest) {
	try {
		await dbConnect()
		const { searchParams } = new URL(request.url)
		const page = parseInt(searchParams.get('page') || '1')
		const limit = parseInt(searchParams.get('limit') || '10')
		const skip = (page - 1) * limit

		const [transactions, total] = await Promise.all([
			Transaction.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
			Transaction.countDocuments({})
		])

		return NextResponse.json({
			transactions,
			pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
		})
	} catch (error) {
		console.error('Error fetching transactions:', error)
		return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	try {
		await dbConnect()
		const body = await request.json()

	const { client, items, tax = 0, discount = 0, discountPercent = 0 } = body
		if (!client || !client.name || !client.address || !client.email || !client.whatsapp) {
			return NextResponse.json({ error: 'Missing client information' }, { status: 400 })
		}
		if (!Array.isArray(items) || items.length === 0) {
			return NextResponse.json({ error: 'At least one item is required' }, { status: 400 })
		}

		// Fetch products and validate quantities
		const productIds = items.map((it: any) => it.productId)
		const products = await Product.find({ _id: { $in: productIds } })
		const productMap = new Map(products.map(p => [String(p._id), p]))

		let subtotal = 0
		const finalizedItems = [] as any[]
		for (const it of items) {
			const prod = productMap.get(String(it.productId))
			if (!prod) {
				return NextResponse.json({ error: `Product not found: ${it.productId}` }, { status: 400 })
			}
			const qty = Number(it.quantity)
			if (!Number.isFinite(qty) || qty <= 0) {
				return NextResponse.json({ error: `Invalid quantity for product ${prod.name}` }, { status: 400 })
			}
			if (qty > prod.quantity) {
				return NextResponse.json({ error: `Insufficient stock for ${prod.name}` }, { status: 400 })
			}
			const unitPrice = Number(prod.price)
			const gstPercent = Number(prod.gstPercent ?? 5)
			const lineTotal = unitPrice * qty
			const lineTax = lineTotal * (gstPercent / 100)
			subtotal += lineTotal
			finalizedItems.push({
				productId: prod._id,
				sku: prod.sku,
				name: prod.name,
				unitPrice,
				quantity: qty,
				lineTotal,
				gstPercent,
				lineTax
			})
		}

		// Prefer server-side calculation of discount when percent is provided
		let discountAmount = Number(discount || 0)
		if (Number(discountPercent) && Number(discountPercent) > 0) {
			discountAmount = +(subtotal * (Number(discountPercent) / 100))
		}
		const total = subtotal + Number(tax || 0) - discountAmount
		const invoiceNumber = generateInvoiceNumber()

		// Create transaction
		const transaction = await Transaction.create({
			invoiceNumber,
			client,
			items: finalizedItems,
			subtotal,
			tax,
			discount: discountAmount,
			discountPercent: Number(discountPercent) || 0,
			total
		})

		// Decrement inventory
		for (const it of finalizedItems) {
			await Product.updateOne({ _id: it.productId }, {
				$inc: { quantity: -it.quantity },
				$set: { updatedAt: new Date() }
			})
		}

		return NextResponse.json({ success: true, transaction }, { status: 201 })
	} catch (error) {
		console.error('Error creating transaction:', error)
		return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
	}
}


