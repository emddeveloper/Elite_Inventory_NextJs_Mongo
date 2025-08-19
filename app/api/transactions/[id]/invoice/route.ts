import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Transaction from '@/models/Transaction'
export const runtime = 'nodejs'

export async function GET(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		await dbConnect()
		const tx = await Transaction.findById(params.id)
		if (!tx) {
			return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
		}

		const PDFDocument = (await import('pdfkit')).default
		const doc = new PDFDocument({ size: 'A4', margin: 50 })
		const chunks: Buffer[] = []
		doc.on('data', (chunk) => chunks.push(chunk as Buffer))
		const endPromise = new Promise<Buffer>((resolve) => {
			doc.on('end', () => resolve(Buffer.concat(chunks)))
		})

		// Header
		doc.fontSize(20).text('Invoice', { align: 'right' })
		doc.moveDown()
		doc.fontSize(12)
		doc.text(`Invoice #: ${tx.invoiceNumber}`)
		doc.text(`Date: ${new Date(tx.createdAt).toLocaleDateString()}`)

		doc.moveDown()
		doc.fontSize(14).text('Bill To:')
		doc.fontSize(12)
		doc.text(tx.client.name)
		doc.text(tx.client.address)
		doc.text(tx.client.email)
		doc.text(`WhatsApp: ${tx.client.whatsapp}`)

		doc.moveDown()
		doc.fontSize(14).text('Items')
		doc.moveDown(0.5)
		doc.fontSize(12)
		doc.text('SKU', 50, doc.y)
		doc.text('Product', 150, doc.y)
		doc.text('Qty', 350, doc.y, { width: 50, align: 'right' })
		doc.text('Unit', 410, doc.y, { width: 80, align: 'right' })
		doc.text('Total', 500, doc.y, { width: 80, align: 'right' })
		doc.moveDown(0.5)
		doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()

		for (const item of tx.items) {
			doc.moveDown(0.4)
			doc.text(item.sku, 50, doc.y)
			doc.text(item.name, 150, doc.y)
			doc.text(String(item.quantity), 350, doc.y, { width: 50, align: 'right' })
			doc.text(`$${item.unitPrice.toFixed(2)}`, 410, doc.y, { width: 80, align: 'right' })
			doc.text(`$${item.lineTotal.toFixed(2)}`, 500, doc.y, { width: 80, align: 'right' })
		}

		doc.moveDown()
		doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
		doc.moveDown(0.5)
		doc.text(`Subtotal: $${tx.subtotal.toFixed(2)}`, 350, doc.y, { width: 230, align: 'right' })
		doc.text(`Tax: $${tx.tax.toFixed(2)}`, 350, doc.y, { width: 230, align: 'right' })
		doc.text(`Discount: $${tx.discount.toFixed(2)}`, 350, doc.y, { width: 230, align: 'right' })
		doc.fontSize(14).text(`Total: $${tx.total.toFixed(2)}`, 350, doc.y, { width: 230, align: 'right' })

		doc.end()
		const pdfBuffer = await endPromise
		return new NextResponse(pdfBuffer, {
			status: 200,
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="${tx.invoiceNumber}.pdf"`,
				'Cache-Control': 'no-store'
			}
		})
	} catch (error) {
		console.error('Invoice generation error:', error)
		return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 })
	}
}


