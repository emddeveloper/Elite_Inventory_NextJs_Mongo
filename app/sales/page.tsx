'use client'

import { useEffect, useMemo, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { MagnifyingGlassIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { generateInvoicePDF, downloadPDF, getDefaultCompany } from '@/lib/pdf-utils'

type Product = {
	_id: string
	name: string
	sku: string
	price: number
	quantity: number
	gstPercent: number
}

export default function SalesPage() {
	const [sidebarOpen, setSidebarOpen] = useState(false)
	const [client, setClient] = useState({ name: '', address: '', email: '', whatsapp: '' })
	const [query, setQuery] = useState('')
	const [products, setProducts] = useState<Product[]>([])
	const [items, setItems] = useState<Array<{ productId: string; name: string; sku: string; unitPrice: number; quantity: number; lineTotal: number; gstPercent: number }>>([])
	const [loadingProducts, setLoadingProducts] = useState(false)
	const [submitting, setSubmitting] = useState(false)
	const [discountPercent, setDiscountPercent] = useState<number>(0)
	const [discountAmount, setDiscountAmount] = useState<number>(0)
	const [discountMode, setDiscountMode] = useState<'percent' | 'amount'>('percent')

	useEffect(() => {
		loadProducts('')
	}, [])

	const loadProducts = async (search: string) => {
		try {
			setLoadingProducts(true)
			const params = new URLSearchParams()
			if (search) params.append('search', search)
			const res = await fetch(`/api/products?${params}&limit=20`)
			const data = await res.json()
			if (res.ok) setProducts(data.products)
			else toast.error('Failed to load products')
		} catch {
			toast.error('Error loading products')
		} finally {
			setLoadingProducts(false)
		}
	}

	const addItem = (p: Product) => {
		if (items.find(i => i.productId === p._id)) {
			toast.error('Product already added')
			return
		}
		setItems(prev => [...prev, { productId: p._id, name: p.name, sku: p.sku, unitPrice: p.price, quantity: 1, lineTotal: p.price, gstPercent: p.gstPercent }])
	}

	const removeItem = (productId: string) => setItems(prev => prev.filter(i => i.productId !== productId))

	const updateQty = (productId: string, qty: number) => {
		setItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity: qty, lineTotal: Math.max(0, qty) * i.unitPrice } : i))
	}

	const subtotal = useMemo(() => items.reduce((s, i) => s + i.lineTotal, 0), [items])
	const tax = 0
	const discount = Number(
		(discountMode === 'percent'
			? ((subtotal * (discountPercent / 100)) || 0)
			: (discountAmount || 0))
	)
	const total = subtotal + tax - discount

	const submit = async () => {
		if (!client.name || !client.address || !client.email || !client.whatsapp) {
			toast.error('Please fill client details')
			return
		}
		if (items.length === 0) {
			toast.error('Please add at least one item')
			return
		}
		setSubmitting(true)
		try {
			const res = await fetch('/api/transactions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ client, items: items.map(i => ({ productId: i.productId, quantity: i.quantity })), tax, discount, discountPercent })
			})
			const data = await res.json()
			if (res.ok) {
				toast.success('Sale completed')
				
				// Generate and download invoice using client-side PDF generation
				try {
					const company = getDefaultCompany()
					const invoiceDate = new Date().toLocaleDateString()
					const invoiceItems = items.map(item => ({
						name: item.name,
						sku: item.sku,
						hsn: '', // You may want to add HSN to your product model
						quantity: item.quantity,
						unit: 'PCS',
						unitPrice: item.unitPrice,
						lineTotal: item.lineTotal,
						gstPercent: item.gstPercent // Use actual GST percentage from product
					}))
					
					const pdfBlob = await generateInvoicePDF({
						invoiceNumber: data.transaction.invoiceNumber,
						invoiceDate,
						client,
						items: invoiceItems,
						subtotal,
						tax,
						discount,
						total,
						company
					})
					
					downloadPDF(pdfBlob, `${data.transaction.invoiceNumber}.pdf`)
				} catch (pdfError) {
					console.error('PDF generation error:', pdfError)
					toast.error('Failed to generate PDF, but sale was completed')
				}
				
				setItems([])
			} else {
				toast.error(data.error || 'Failed to submit sale')
			}
		} catch {
			toast.error('Error submitting sale')
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
			<div className="lg:pl-72">
				<Header setSidebarOpen={setSidebarOpen} />
				<main className="py-10">
					<div className="px-4 sm:px-6 lg:px-8 space-y-6">
						<div className="flex items-center justify-between">
							<h1 className="text-2xl font-bold text-gray-900">Sales</h1>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
							{/* Client Details */}
							<div className="card lg:col-span-1">
								<h2 className="text-lg font-medium text-gray-900 mb-4">Client Details</h2>
								<div className="space-y-4">
									<input className="input-field" placeholder="Name" value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} />
									<textarea className="input-field" placeholder="Address" rows={3} value={client.address} onChange={(e) => setClient({ ...client, address: e.target.value })} />
									<input className="input-field" placeholder="Email" type="email" value={client.email} onChange={(e) => setClient({ ...client, email: e.target.value })} />
									<input className="input-field" placeholder="WhatsApp" value={client.whatsapp} onChange={(e) => setClient({ ...client, whatsapp: e.target.value })} />
								</div>
							</div>

							{/* Product Picker */}
							<div className="card lg:col-span-2">
								<div className="flex items-center justify-between mb-4">
									<h2 className="text-lg font-medium text-gray-900">Add Products</h2>
									<div className="relative w-80">
										<MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
										<input className="input-field pl-10" placeholder="Search products..." value={query} onChange={(e) => { setQuery(e.target.value); loadProducts(e.target.value) }} />
									</div>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-auto">
									{loadingProducts ? (
										<div className="text-sm text-gray-500">Loading...</div>
									) : products.length === 0 ? (
										<div className="text-sm text-gray-500">No products</div>
									) : products.map(p => (
										<div key={p._id} className="flex items-center justify-between border rounded-md p-3">
											<div>
												<div className="font-medium text-gray-900">{p.name}</div>
												<div className="text-xs text-gray-500">{p.sku}</div>
											</div>
											<div className="flex items-center space-x-3">
												<div className="text-sm text-gray-700">{`$${p.price.toFixed(2)}`}</div>
												<button onClick={() => addItem(p)} className="btn-primary flex items-center"><PlusIcon className="h-4 w-4 mr-1" /> Add</button>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>

						{/* Items & Overview */}
						<div className="card">
							<h2 className="text-lg font-medium text-gray-900 mb-4">Order Items</h2>
							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-gray-200">
									<thead className="bg-gray-50">
										<tr>
											<th className="table-header">Product</th>
											<th className="table-header">SKU</th>
											<th className="table-header">Qty</th>
											<th className="table-header">Unit</th>
											<th className="table-header">Total</th>
											<th className="table-header">Actions</th>
										</tr>
									</thead>
									<tbody className="bg-white divide-y divide-gray-200">
										{items.length === 0 ? (
											<tr>
												<td className="table-cell text-center" colSpan={6}>No items</td>
											</tr>
										) : items.map(it => (
											<tr key={it.productId}>
												<td className="table-cell">{it.name}</td>
												<td className="table-cell font-mono">{it.sku}</td>
												<td className="table-cell">
													<input type="number" min={1} value={it.quantity} onChange={(e) => updateQty(it.productId, parseInt(e.target.value || '1'))} className="input-field w-24" />
												</td>
												<td className="table-cell">{`$${it.unitPrice.toFixed(2)}`}</td>
												<td className="table-cell">{`$${it.lineTotal.toFixed(2)}`}</td>
												<td className="table-cell">
													<button onClick={() => removeItem(it.productId)} className="text-red-600 hover:text-red-800 inline-flex items-center"><TrashIcon className="h-4 w-4 mr-1" /> Remove</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							<div className="flex justify-end mt-4">
								<div className="w-80 space-y-2 text-sm">
										<div className="flex items-center justify-between">
											<label className="text-gray-600">Discount</label>
											<div className="flex items-center space-x-2">
												<select value={discountMode} onChange={(e) => setDiscountMode(e.target.value as any)} className="input-field w-36">
													<option value="percent">Percent (%)</option>
													<option value="amount">Amount</option>
												</select>
												{discountMode === 'percent' ? (
													<>
														<input type="number" min={0} max={100} value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value || '0'))} className="input-field w-24" />
														<span className="text-sm text-gray-500">%</span>
													</>
												) : (
													<>
														<input type="number" min={0} max={subtotal} value={discountAmount} onChange={(e) => setDiscountAmount(Number(e.target.value || '0'))} className="input-field w-36" />
														<span className="text-sm text-gray-500">{`$`}</span>
													</>
												)}
											</div>
										</div>
									<div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-medium">{`$${subtotal.toFixed(2)}`}</span></div>
									<div className="flex justify-between"><span className="text-gray-600">Tax</span><span className="font-medium">{`$${tax.toFixed(2)}`}</span></div>
									<div className="flex justify-between"><span className="text-gray-600">Discount</span><span className="font-medium">-{`$${discount.toFixed(2)}`}</span></div>
									<div className="flex justify-between text-base"><span>Total</span><span className="font-semibold">{`$${total.toFixed(2)}`}</span></div>
									<div className="pt-2 flex justify-end">
										<button disabled={submitting} onClick={submit} className="btn-primary">{submitting ? 'Submitting...' : 'Submit & Generate Invoice'}</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</main>
			</div>
		</div>
	)
}


