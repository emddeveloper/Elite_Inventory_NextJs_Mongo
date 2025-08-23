'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { generateInvoicePDF, downloadPDF, getDefaultCompany } from '@/lib/pdf-utils'
import toast from 'react-hot-toast'

type Transaction = {
	_id: string
	invoiceNumber: string
	client: { name: string }
	total: number
	createdAt: string
}

export default function TransactionsPage() {
	const [sidebarOpen, setSidebarOpen] = useState(false)
	const [transactions, setTransactions] = useState<Transaction[]>([])
	const [loading, setLoading] = useState(true)
	const [page, setPage] = useState<number>(1)
	const [limit, setLimit] = useState<number>(20)
	const [totalPages, setTotalPages] = useState<number>(1)
	const [total, setTotal] = useState<number>(0)
	const [query, setQuery] = useState<string>('')
	const [debouncedQuery, setDebouncedQuery] = useState<string>('')

	useEffect(() => { load() }, [page, limit, debouncedQuery])

	// simple debounce for search input
	useEffect(() => {
		const t = setTimeout(() => setDebouncedQuery(query), 400)
		return () => clearTimeout(t)
	}, [query])

	const load = async () => {
		try {
			setLoading(true)
			const params = new URLSearchParams({ page: String(page), limit: String(limit) })
			if (debouncedQuery) params.set('q', debouncedQuery)
			const res = await fetch(`/api/transactions?${params.toString()}`)
			const data = await res.json()
			if (res.ok) {
				setTransactions(data.transactions)
				setTotal(data.pagination?.total ?? 0)
				setTotalPages(data.pagination?.totalPages ?? 1)
			}
		} finally {
			setLoading(false)
		}
	}

	const download = async (id: string, name: string) => {
		setDownloadLoading((prev) => ({ ...prev, [id]: true }))
		try {
			// Fetch transaction details for PDF generation
			const txRes = await fetch(`/api/transactions/${id}`)
			const txData = await txRes.json()
			
			if (!txRes.ok) {
				toast.error('Failed to fetch transaction details')
				return
			}
			
			const transaction = txData.transaction
			const company = getDefaultCompany()
			const invoiceDate = new Date(transaction.createdAt).toLocaleDateString()
			
			// Map transaction items to PDF format - extract GST from populated product data
			const pdfItems = transaction.items.map((item: any) => {
				// Extract GST percentage from populated productId or direct field
				let gstPercent = item.gstPercent || 
								(item.productId && typeof item.productId === 'object' ? item.productId.gstPercent : null) || 
								5
				
				console.log('Transaction item GST data:', { 
					name: item.name, 
					directGstPercent: item.gstPercent,
					populatedGstPercent: item.productId?.gstPercent,
					finalGstPercent: gstPercent,
					productIdType: typeof item.productId
				})
				
				return {
					name: item.name,
					quantity: item.quantity,
					unitPrice: item.unitPrice,
					lineTotal: item.lineTotal,
					gstPercent: gstPercent
				}
			}) || []
			
			// Generate PDF using client-side rendering
			const pdfBlob = await generateInvoicePDF({
				invoiceNumber: transaction.invoiceNumber,
				invoiceDate,
				transactionId: transaction._id,
				client: transaction.client || { name: 'Unknown Client', address: '', email: '', whatsapp: '' },
				items: pdfItems,
				subtotal: transaction.subtotal || 0,
				tax: transaction.tax || 0,
				discount: transaction.discount || 0,
				total: transaction.total || 0,
				company,
				shipTo: transaction.shipTo
			})
			
			downloadPDF(pdfBlob, `${name}.pdf`)
			toast.success('PDF downloaded successfully')
		} catch (error) {
			console.error('PDF generation error:', error)
			toast.error('Failed to generate PDF')
		} finally {
			setDownloadLoading((prev) => ({ ...prev, [id]: false }))
		}
	}

	const [downloadLoading, setDownloadLoading] = useState<Record<string, boolean>>({})

	return (
		<div className="min-h-screen bg-gray-50">
			<Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
			<div className="lg:pl-72">
				<Header setSidebarOpen={setSidebarOpen} />
				<main className="py-10">
					<div className="px-4 sm:px-6 lg:px-8 space-y-6">
						<h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
						<div className="card">
							<div className="p-4 flex flex-col sm:flex-row sm:items-center gap-2">
								<label htmlFor="tx-search" className="sr-only">Search transactions</label>
								<div className="relative w-full max-w-md">
									{/* search icon */}
									<span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
										<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
											<path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
										</svg>
									</span>
									<input
										id="tx-search"
										value={query}
										onChange={(e) => { setQuery(e.target.value); setPage(1) }}
										onKeyDown={(e) => { if (e.key === 'Enter') { setDebouncedQuery(query); setPage(1) } }}
										placeholder="Search invoices, clients or items"
										className="input pl-10 pr-10 w-full"
									/>
									{/* inline loading spinner */}
									{loading ? (
										<span className="absolute inset-y-0 right-8 pr-3 flex items-center text-gray-400">
											<svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
										</span>
									) : null}
									{/* clear button */}
									{query ? (
										<button type="button" aria-label="Clear search" onClick={() => { setQuery(''); setDebouncedQuery(''); setPage(1) }} className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-500 hover:text-gray-700">
											<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
										</button>
									) : null}
									{/* small results summary */}
									<div className="sr-only" aria-live="polite">{debouncedQuery ? `Searching for ${debouncedQuery}` : ''}</div>
								</div>
								<div className="ml-auto flex items-center gap-2">
									<label className="text-sm text-gray-600">Per page</label>
									<select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }} className="input">
										<option value={10}>10</option>
										<option value={20}>20</option>
										<option value={50}>50</option>
									</select>
								</div>
								{/* visible small summary below input on small screens */}
								<div className="mt-2 sm:mt-0 text-sm text-gray-500">
									{debouncedQuery ? `Results for "${debouncedQuery}" — ${total} match${total === 1 ? '' : 'es'}` : `${total} total transactions`}
								</div>
							</div>
							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-gray-200">
									<thead className="bg-gray-50">
										<tr>
											<th className="table-header">Invoice #</th>
											<th className="table-header">Client</th>
											<th className="table-header">Total</th>
											<th className="table-header">Date</th>
											<th className="table-header">Actions</th>
										</tr>
									</thead>
									<tbody className="bg-white divide-y divide-gray-200">
										{loading ? (
											<tr><td className="table-cell text-center" colSpan={5}>Loading...</td></tr>
										) : transactions.length === 0 ? (
											<tr><td className="table-cell text-center" colSpan={5}>No transactions</td></tr>
										) : transactions.map(tx => (
											<tr key={tx._id}>
												<td className="table-cell font-mono">{tx.invoiceNumber}</td>
												<td className="table-cell">{tx.client.name}</td>
												<td className="table-cell">{`${Number(tx.total ?? 0).toFixed(2)}`}</td>
												<td className="table-cell">{new Date(tx.createdAt).toLocaleString()}</td>
												<td className="table-cell">
													<button onClick={() => download(tx._id, tx.invoiceNumber)} className="btn-secondary" disabled={!!downloadLoading[tx._id]}>
														{downloadLoading[tx._id] ? (
															<span className="inline-flex items-center gap-2">
																<svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
																<span>Downloading...</span>
															</span>
														) : (
															<span>Download Invoice</span>
														)}
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
							{/* pagination */}
							<div className="mt-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
								<div className="text-sm text-gray-600">Showing {(page-1)*limit + 1} - {Math.min(page*limit, total)} of {total}</div>
								<div className="flex items-center gap-2">
									<button className="btn" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1 || loading}>Previous</button>
									<div className="inline-flex items-center gap-1">
										{Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
											const displayStart = Math.max(1, Math.min(page - 3 + i, totalPages - 6))
											const pnum = displayStart + i
											return pnum <= totalPages ? (
												<button key={pnum} className={`btn ${pnum === page ? 'btn-primary' : ''}`} onClick={() => setPage(pnum)} disabled={loading}>{pnum}</button>
											) : null
										})}
									</div>
									<button className="btn" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page >= totalPages || loading}>Next</button>
								</div>
							</div>
						</div>
					</div>
				</main>
			</div>
		</div>
	)
}


