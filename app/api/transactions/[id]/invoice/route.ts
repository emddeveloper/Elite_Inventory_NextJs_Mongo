import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Transaction from '@/models/Transaction'
import Product from '@/models/Product'

export async function GET(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		await dbConnect()
		const tx = await Transaction.findById(params.id).populate('items.productId')
		
		if (!tx) {
			return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
		}

		// Return transaction data for client-side PDF generation
		return NextResponse.json({ 
			success: true,
			transaction: {
				_id: tx._id,
				invoiceNumber: tx.invoiceNumber,
				client: tx.client,
				items: tx.items,
				subtotal: tx.subtotal,
				tax: tx.tax,
				discount: tx.discount,
				total: tx.total,
				createdAt: tx.createdAt,
				shipTo: tx.shipTo
			}
		})
	} catch (error) {
		console.error('Transaction fetch error:', error)
		return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 })
	}
}


