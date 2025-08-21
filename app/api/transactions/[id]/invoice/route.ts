import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Transaction from '@/models/Transaction'
import Product from '@/models/Product'
export const runtime = 'nodejs'

export async function GET(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
 
 	// Small helper: convert number to english words (supports up to millions, basic)
 	function amountInWords(amount: number) {
 		if (!Number.isFinite(amount)) return 'Zero'
 		const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
 		const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
 		function convert(n: number): string {
 			if (n < 20) return ones[n]
 			if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' ' + ones[n%10] : '')
 			if (n < 1000) return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' ' + convert(n%100) : '')
 			if (n < 1000000) return convert(Math.floor(n/1000)) + ' Thousand' + (n%1000 ? ' ' + convert(n%1000) : '')
 			return convert(Math.floor(n/1000000)) + ' Million' + (n%1000000 ? ' ' + convert(n%1000000) : '')
 		}
 		const whole = Math.floor(Math.abs(amount))
 		const cents = Math.round((Math.abs(amount) - whole) * 100)
 		return `${convert(whole) || 'Zero'}${cents ? ' and ' + cents + '/100' : ''} ${amount < 0 ? 'Minus' : ''}`.trim()
 	}

	try {
		await dbConnect()
		const tx = await Transaction.findById(params.id)
		if (!tx) {
			return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
		}

		// Load pdfkit at runtime using require hidden from bundler to avoid Next.js bundling issues
		// (avoids webpack trying to resolve font data into .next vendor-chunks)
		const puppeteer = eval("require")('puppeteer')

		// Safe getters with fallbacks
		const client = tx.client || {}
		const items = Array.isArray(tx.items) ? tx.items : []
		const subtotalNum = Number(tx.subtotal || 0)
		const taxNum = Number(tx.tax || 0)
		const discountNum = Number(tx.discount || 0)
		const totalNum = Number(tx.total || subtotalNum + taxNum - discountNum)

		// Fallback company + sample data taken from the provided screenshot
		const company = {
			name: 'Akash Enterprises',
			address: '11, Main Market, Chandni Chowk, New Delhi, Delhi 110006',
			phone: '+91 9981278197',
			email: 'akashenterprises@gmail.com',
			website: 'www.akashenterprises.in',
			gstin: '08AALCR2857A1ZD',
			pan: 'AVHPC6971A'
		}

		const shipToSample = {
			name: 'Sampath singh',
			address: '06, BB Buildings, Ram Bagh, Karol Bagh, New Delhi, Delhi',
			pin: '110005'
		}

		const billToSample = {
			name: 'Sampath singh',
			address: '04, KK Buildings, Main Street, Karol Bagh, New Delhi, Delhi',
			pin: '110005'
		}

		const invoiceNumber = tx.invoiceNumber || 'S01'
		const invoiceDate = tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '01 May 2024'

		// Fetch related products for items so we can use product.gstPercent when item lacks gst info
		const productIdsForInvoice = items.map((it: any) => String(it.productId)).filter(Boolean)
		const productsForInvoice = productIdsForInvoice.length ? await Product.find({ _id: { $in: productIdsForInvoice } }) : []
		const productMapForInvoice = new Map(productsForInvoice.map((p: any) => [String(p._id), p]))

		// Build tax summary grouped by HSN and rate (prices are inclusive of GST)
		const taxMap = new Map<string, { hsn: string; taxable: number; rate: number; cgst: number; sgst: number; totalTax: number }>()
		for (const it of items) {
			const hsn = String((it && it.hsn) || '-')
			const qty = Number((it && it.quantity) || 0)
			const ratePerUnitIncl = Number((it && it.unitPrice) || 0) // price includes GST
			const lineTotalIncl = Number((it && it.lineTotal) ?? (qty * ratePerUnitIncl))
			// Determine GST percent: priority -> item.gstPercent -> product.gstPercent -> default 5%
			const prod = it && it.productId ? productMapForInvoice.get(String(it.productId)) : undefined
			const ratePercent = Number((it && (it.gstPercent ?? it.taxRate)) ?? (prod && prod.gstPercent) ?? 5)
			// Convert inclusive price to taxable amount: taxable = inclusive / (1 + r/100)
			const taxableForLine = lineTotalIncl / (1 + ratePercent / 100)
			const totalTaxForLine = lineTotalIncl - taxableForLine
			const cgstForLine = totalTaxForLine / 2
			const sgstForLine = totalTaxForLine / 2
			const key = `${hsn}|${ratePercent}`
			const existing = taxMap.get(key)
			if (existing) {
				existing.taxable += taxableForLine
				existing.cgst += cgstForLine
				existing.sgst += sgstForLine
				existing.totalTax += totalTaxForLine
				taxMap.set(key, existing)
			} else {
				const entry = {
					hsn,
					taxable: taxableForLine,
					rate: ratePercent,
					cgst: cgstForLine,
					sgst: sgstForLine,
					totalTax: totalTaxForLine
				}
				taxMap.set(key, entry)
			}
		}

		// Prepare tax table rows and totals
		let aggTaxable = 0
		let aggCgst = 0
		let aggSgst = 0
		let aggTotalTax = 0
		const taxRows = Array.from(taxMap.values()).map(e => {
			aggTaxable += e.taxable
			aggCgst += e.cgst
			aggSgst += e.sgst
			aggTotalTax += e.totalTax
			return `<tr><td>${escapeHtml(e.hsn)}</td><td> ${e.taxable.toFixed(2)}</td><td>${(e.rate/2).toFixed(2)}%</td><td> ${e.cgst.toFixed(2)}</td><td>${(e.rate/2).toFixed(2)}%</td><td> ${e.sgst.toFixed(2)}</td><td> ${e.totalTax.toFixed(2)}</td></tr>`
		}).join('')

		const taxSummaryTotalRow = `<tr style="font-weight:700"><td>Total</td><td> ${aggTaxable.toFixed(2)}</td><td></td><td> ${aggCgst.toFixed(2)}</td><td></td><td> ${aggSgst.toFixed(2)}</td><td> ${aggTotalTax.toFixed(2)}</td></tr>`

		const html = `
		<!doctype html>
		<html>
		<head>
		  <meta charset="utf-8">
		  <meta name="viewport" content="width=device-width, initial-scale=1">
		  <style>
		    body { font-family: 'font-mono', Arial, sans-serif; color:#222; font-size:12px; }
			.page { max-width: 98%; margin: 0 auto; padding: 1%; border: 1px solid #ddd }
		    .top { display:flex; justify-content:space-between; }
		    .company-block { width:58%; }
		    .company-name { font-size:20px; font-weight:800 }
		    .small { font-size:11px; color:#666 }
		    .invoice-block { width:38%; text-align:right }
		    .invoice-title { font-size:18px; font-weight:800 }
		    .meta { margin-top:6px; }
		    .section { display:flex; gap:12px; margin-top:12px }
		    .box { border:1px solid #ddd; padding:8px; }
		    table.items { width:100%; border-collapse:collapse; margin-top:12px }
		    table.items th, table.items td { border:1px solid #ddd; padding:6px; }
		    table.items th { background:#f9f9f9; font-weight:700; }
		    .right { text-align:right }
		    .center { text-align:center }
		    .totals { margin-top:8px; float:right; width:320px }
		    .totals table { width:100%; border-collapse:collapse }
		    .totals td { padding:6px }
		    .tax-table { width:100%; border-collapse:collapse; margin-top:18px }
		    .tax-table td, .tax-table th { border:1px solid #ddd; padding:6px }
		    .footer { margin-top:18px; display:flex; gap:12px }
		    .remark, .bank { border:1px solid #ddd; padding:8px; flex:1 }
		  </style>
		</head>
		<body>
		  <div class="page">
		    <div class="top">
		      <div class="company-block">
		        <div class="company-name">${escapeHtml(company.name)}</div>
		        <div class="small">${escapeHtml(company.address)}</div>
		        <div class="small">Phone: ${escapeHtml(company.phone)} &nbsp; Email: ${escapeHtml(company.email)} &nbsp; Website: ${escapeHtml(company.website)}</div>
		        <div class="small">GSTIN: ${escapeHtml(company.gstin)} &nbsp; PAN Number: ${escapeHtml(company.pan)}</div>
		      </div>
		      <div class="invoice-block">
		        <div class="invoice-title">TAX INVOICE</div>
		        <div class="meta small">Invoice No: <strong>${escapeHtml(invoiceNumber)}</strong></div>
		        <div class="meta small">Invoice Date: <strong>${escapeHtml(invoiceDate)}</strong></div>
		        <div class="meta small">Email Id: <strong>${escapeHtml(company.email)}</strong></div>
		        <div class="meta small">Website: <strong>${escapeHtml(company.website)}</strong></div>
		      </div>
		    </div>

		    <div class="section">
		      <div style="flex:1" class="box">
		        <div style="font-weight:700">BILL TO</div>
		        <div style="margin-top:6px">${escapeHtml(client.name || billToSample.name)}</div>
		        <div class="small">${escapeHtml(client.address || billToSample.address)}</div>
		        <div class="small">Pin: ${escapeHtml((client.pin || billToSample.pin) as any)}</div>
		        <div class="small">Phone: ${escapeHtml(client.whatsapp || company.phone)}</div>
		        <div class="small">GSTIN: ${escapeHtml(client.gstin || '08HULMPB2839A1AB')}</div>
		      </div>
		      <div style="flex:1" class="box">
		        <div style="font-weight:700">SHIP TO</div>
		        <div style="margin-top:6px">${escapeHtml((tx.shipTo && tx.shipTo.name) || shipToSample.name)}</div>
		        <div class="small">${escapeHtml((tx.shipTo && tx.shipTo.address) || shipToSample.address)}</div>
		        <div class="small">Pin: ${escapeHtml((tx.shipTo && tx.shipTo.pin) || shipToSample.pin)}</div>
		      </div>
		    </div>

		    <table class="items">
		      <thead>
		        <tr>
		          <th style="width:40px">S. No.</th>
		          <th style="width:200px">Item</th>
		          <th style="width:80px">HSN</th>
		          <th style="width:80px" class="center">Quantity</th>
		          <th style="width:100px" class="right">Rate</th>
		          <th style="width:120px" class="center">GST %</th>
		          <th style="width:120px" class="right">Amount</th>
		        </tr>
		      </thead>
		      <tbody>
						${items.length ? items.map((it:any, idx:number) => {
										const qty = Number(it.quantity || 0)
										const rateIncl = Number(it.unitPrice || 0)
										const lineTotalIncl = Number(it.lineTotal ?? qty * rateIncl)
										const prod = it && it.productId ? productMapForInvoice.get(String(it.productId)) : undefined
										const gstPercent = Number((it && (it.gstPercent ?? it.taxRate)) ?? (prod && prod.gstPercent) ?? 5)
										// taxable per unit and tax per unit from inclusive price
										const taxablePerUnit = rateIncl / (1 + gstPercent / 100)
										const taxPerUnit = rateIncl - taxablePerUnit
										const lineTax = taxPerUnit * qty
										const lineTaxDisplay = taxPerUnit.toFixed(2)
										const lineTotalTaxable = taxablePerUnit * qty
										return `
											<tr>
												<td class="center">${idx+1}</td>
												<td>${escapeHtml(it.name || it.sku || 'Item')}</td>
												<td class="center">${escapeHtml(it.hsn || '')}</td>
												<td class="center">${qty} ${escapeHtml(it.unit || '')}</td>
												<td class="right"> ${rateIncl.toFixed(2)}</td>
												<td class="center"> ${gstPercent}%</td>
												<td class="right"> ${lineTotalIncl.toFixed(2)}</td>
											</tr>`
								}).join('') : `
			  <tr>
			    <td class="center">1</td>
			    <td>Apple</td>
			    <td class="center">808</td>
			    <td class="center">5 KG</td>
			    <td class="right"> 100.00</td>
			    <td class="right"> 5.00 (5%)</td>
			    <td class="right"> 525.00</td>
			  </tr>
			  <tr>
			    <td class="center">2</td>
			    <td>Banana</td>
			    <td class="center">803</td>
			    <td class="center">5 KG</td>
			    <td class="right"> 100.00</td>
			    <td class="right"> 5.00 (5%)</td>
			    <td class="right"> 525.00</td>
			  </tr>
			  <tr>
			    <td class="center">3</td>
			    <td>Orange</td>
			    <td class="center">805</td>
			    <td class="center">5 KG</td>
			    <td class="right"> 100.00</td>
			    <td class="right"> 5.00 (5%)</td>
			    <td class="right"> 525.00</td>
			  </tr>`}
		      </tbody>
		    </table>

		    <div class="totals">
		      <table>
		        <tr><td>Subtotal:</td><td class="right"> ${subtotalNum.toFixed(2)}</td></tr>
		        <tr><td>Tax:</td><td class="right"> ${taxNum.toFixed(2)}</td></tr>
		        <tr><td>Discount:</td><td class="right">-  ${discountNum.toFixed(2)}</td></tr>
		        <tr style="font-weight:800;border-top:1px solid #ddd"><td>TOTAL</td><td class="right"> ${totalNum.toFixed(2)}</td></tr>
		      </table>
		    </div>

		    <div style="clear:both"></div>

				<table class="tax-table">
					<thead>
						<tr><th>HSN</th><th>Taxable Amount</th><th>CGST Rate</th><th>CGST Amount</th><th>SGST Rate</th><th>SGST Amount</th><th>Total GST Amount</th></tr>
					</thead>
					<tbody>
						${taxRows}
						${taxSummaryTotalRow}
					</tbody>
				</table>

		    <div class="footer">
		      <div class="remark">
		        <div style="font-weight:700">Remark</div>
		        <div class="small">This is remark</div>
		        <div style="margin-top:8px;font-size:11px">Terms & Conditions<br/>1. Customer will pay the GST<br/>2. Customer will pay the Delivery charges<br/>3. Pay due amount within 15 days</div>
		      </div>
		      <div class="bank">
		        <div style="font-weight:700">Bank Details</div>
		        <div class="small">Account holder: Akash Enterprises<br/>Account number: 38028101723<br/>Bank: SBI Branch: Jaipur<br/>IFSC code: SBIN0002836 UPI ID: 1281@paytm</div>
		      </div>
		    </div>

		    <div style="margin-top:18px;text-align:right;font-size:11px">Authorised Signatory For Akash Enterprises</div>
		  </div>
		</body>
		</html>
		`

		// Launch puppeteer and generate pdf
		const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
		const page = await browser.newPage()
		await page.setContent(html, { waitUntil: 'networkidle0' })
		const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '2mm', bottom: '2mm', left: '1mm', right: '1mm' } })
		await browser.close()

		return new NextResponse(pdfBuffer, {
			status: 200,
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="${tx.invoiceNumber || params.id}.pdf"`,
				'Cache-Control': 'no-store',
				'Content-Length': String(pdfBuffer.length)
			}
		})
	} catch (error) {
		console.error('Invoice generation error:', error)
		return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 })
	}

	// Escape HTML to safely inject into template
	function escapeHtml(input: string) {
		return String(input)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;')
	}
}


