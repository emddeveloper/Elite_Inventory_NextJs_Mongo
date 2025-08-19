'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

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

	useEffect(() => { load() }, [])

	const load = async () => {
		try {
			setLoading(true)
			const res = await fetch('/api/transactions?limit=20')
			const data = await res.json()
			if (res.ok) setTransactions(data.transactions)
		} finally {
			setLoading(false)
		}
	}

	const download = async (id: string, name: string) => {
		const pdf = await fetch(`/api/transactions/${id}/invoice`)
		const blob = await pdf.blob()
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `${name}.pdf`
		a.click()
		URL.revokeObjectURL(url)
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
			<div className="lg:pl-72">
				<Header setSidebarOpen={setSidebarOpen} />
				<main className="py-10">
					<div className="px-4 sm:px-6 lg:px-8 space-y-6">
						<h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
						<div className="card">
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
												<td className="table-cell">${'{'}tx.total.toFixed(2){'}'}</td>
												<td className="table-cell">{new Date(tx.createdAt).toLocaleString()}</td>
												<td className="table-cell">
													<button onClick={() => download(tx._id, tx.invoiceNumber)} className="btn-secondary">Download Invoice</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</main>
			</div>
		</div>
	)
}


