import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Transaction from '@/models/Transaction'

export async function GET(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		await dbConnect()
		const transaction = await Transaction.findById(params.id).populate('items.productId')
		
		if (!transaction) {
			return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
		}

		// Return transaction data for client-side PDF generation
		return NextResponse.json({ 
			success: true,
			transaction: {
				_id: transaction._id,
				invoiceNumber: transaction.invoiceNumber,
				client: transaction.client,
				items: transaction.items,
				subtotal: transaction.subtotal,
				tax: transaction.tax,
				discount: transaction.discount,
				total: transaction.total,
				createdAt: transaction.createdAt,
				shipTo: transaction.shipTo
			}
		})
	} catch (error) {
		console.error('Transaction fetch error:', error)
		return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 })
	}
}
