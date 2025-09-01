'use client'

import { useEffect, useMemo, useState } from 'react'
import { Dialog } from '@headlessui/react'
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

interface SupplierAddress {
  street: string
  city: string
  state: string
  zipCode: string
  country?: string
}

interface SupplierContact {
  name: string
  email: string
  phone: string
}

interface Supplier {
  _id: string
  name: string
  email: string
  phone: string
  address: SupplierAddress
  contactPerson: SupplierContact
  paymentTerms?: string
  isActive: boolean
  notes?: string
  createdAt?: string
}

export default function SuppliersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'city' | 'isActive'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active')

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    fetchSuppliers(page, pageSize, debounced)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, debounced, sortBy, sortOrder, statusFilter])

  async function fetchSuppliers(p: number, limit: number, q: string) {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', String(p))
      params.set('limit', String(limit))
      if (q) params.set('search', q)
      params.set('sortBy', sortBy === 'city' ? 'address.city' : sortBy)
      params.set('sortOrder', sortOrder)
      params.set('status', statusFilter)
      const res = await fetch(`/api/suppliers?${params.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')
      setSuppliers(data.suppliers)
      setTotal(data.pagination?.total || data.suppliers?.length || 0)
    } catch (e: any) {
      console.error(e)
      toast.error('Failed to load suppliers')
    } finally {
      setLoading(false)
    }
  }

  const openAdd = () => { setEditing(null); setIsModalOpen(true) }
  const openEdit = (s: Supplier) => { setEditing(s); setIsModalOpen(true) }

  async function handleSubmit(id: string | null, payload: any) {
    try {
      const res = await fetch(id ? `/api/suppliers/${id}` : '/api/suppliers', {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Request failed')
      toast.success(id ? 'Supplier updated' : 'Supplier created')
      setIsModalOpen(false)
      fetchSuppliers(page, pageSize, debounced)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save supplier')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deactivate this supplier?')) return
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to deactivate')
      }
      toast.success('Supplier deactivated')
      fetchSuppliers(page, pageSize, debounced)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to deactivate')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="lg:pl-72">
        <Header setSidebarOpen={setSidebarOpen} />
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
                <p className="mt-1 text-sm text-gray-500">Manage supplier directory and contacts</p>
              </div>
              <button onClick={openAdd} className="btn-primary flex items-center">
                <PlusIcon className="h-5 w-5 mr-2" /> Add Supplier
              </button>
            </div>

            {/* Filters */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => { setPage(1); setSearch(e.target.value) }}
                  className="input-field pl-10 w-full"
                  placeholder="Search by name, email, phone, or city"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="input-field w-36"
                  value={sortBy}
                  onChange={(e) => { setPage(1); setSortBy(e.target.value as any) }}
                  title="Sort By"
                >
                  <option value="name">Sort: Name</option>
                  <option value="city">Sort: City</option>
                  <option value="isActive">Sort: Status</option>
                </select>
                <select
                  className="input-field w-36"
                  value={statusFilter}
                  onChange={(e) => { setPage(1); setStatusFilter(e.target.value as any) }}
                  title="Status"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="all">All</option>
                </select>
                <select
                  className="input-field w-28"
                  value={sortOrder}
                  onChange={(e) => { setPage(1); setSortOrder(e.target.value as any) }}
                  title="Order"
                >
                  <option value="asc">Asc</option>
                  <option value="desc">Desc</option>
                </select>
                <select
                  className="input-field w-28"
                  value={pageSize}
                  onChange={(e) => { setPage(1); setPageSize(parseInt(e.target.value, 10)) }}
                >
                  {[10, 20, 50].map(n => <option key={n} value={n}>{n}/page</option>)}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="mt-6 card">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="table-header">Name</th>
                      <th className="table-header">Email</th>
                      <th className="table-header">Phone</th>
                      <th className="table-header">City</th>
                      <th className="table-header">Status</th>
                      <th className="table-header">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr><td colSpan={6} className="table-cell text-center">Loading...</td></tr>
                    ) : suppliers.length === 0 ? (
                      <tr><td colSpan={6} className="table-cell text-center">No suppliers</td></tr>
                    ) : (
                      suppliers.map(s => (
                        <tr key={s._id} className="hover:bg-gray-50">
                          <td className="table-cell">
                            <div className="font-medium text-gray-900">{s.name}</div>
                            <div className="text-xs text-gray-500">{s.contactPerson?.name}</div>
                          </td>
                          <td className="table-cell">{s.email}</td>
                          <td className="table-cell">{s.phone}</td>
                          <td className="table-cell">{s.address?.city}</td>
                          <td className="table-cell">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${s.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                              {s.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="table-cell">
                            <div className="flex gap-2">
                              <button className="text-blue-600 hover:text-blue-800" onClick={() => openEdit(s)} title="Edit">
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              {s.isActive && (
                                <button className="text-red-600 hover:text-red-800" onClick={() => handleDelete(s._id)} title="Deactivate">
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between p-3">
                <div className="text-sm text-gray-600">Page {page} of {totalPages} • {total} suppliers</div>
                <div className="flex items-center gap-2">
                  <button className="btn-secondary" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
                  <button className="btn-secondary" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        supplier={editing}
        onSubmit={(id, data) => handleSubmit(id, data)}
      />
    </div>
  )
}

function SupplierModal({ isOpen, onClose, supplier, onSubmit }: {
  isOpen: boolean
  onClose: () => void
  supplier: Supplier | null
  onSubmit: (id: string | null, data: any) => void
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: { street: '', city: '', state: '', zipCode: '', country: 'USA' },
    contactPerson: { name: '', email: '', phone: '' },
    paymentTerms: 'Net 30',
    isActive: true,
    notes: '',
  })

  useEffect(() => {
    if (supplier) {
      setForm({
        name: supplier.name || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: {
          street: supplier.address?.street || '',
          city: supplier.address?.city || '',
          state: supplier.address?.state || '',
          zipCode: supplier.address?.zipCode || '',
          country: supplier.address?.country || 'USA',
        },
        contactPerson: {
          name: supplier.contactPerson?.name || '',
          email: supplier.contactPerson?.email || '',
          phone: supplier.contactPerson?.phone || '',
        },
        paymentTerms: supplier.paymentTerms || 'Net 30',
        isActive: supplier.isActive,
        notes: supplier.notes || '',
      })
    } else {
      setForm({
        name: '', email: '', phone: '',
        address: { street: '', city: '', state: '', zipCode: '', country: 'USA' },
        contactPerson: { name: '', email: '', phone: '' },
        paymentTerms: 'Net 30', isActive: true, notes: '',
      })
    }
  }, [supplier])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(supplier?._id ?? null, form)
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-blue-100">
          <div className="rounded-t-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600 px-6 py-3 text-white">
            <Dialog.Title className="text-base md:text-lg font-semibold tracking-wide">
              {supplier ? 'Edit Supplier' : 'Add Supplier'}
            </Dialog.Title>
            <p className="text-xs opacity-90">Maintain supplier contact and billing details</p>
          </div>

          <form onSubmit={submit} className="px-6 py-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                <input className="input-field" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="input-field" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                <input className="input-field" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Street</label>
                  <input className="input-field" required value={form.address.street} onChange={e => setForm({ ...form, address: { ...form.address, street: e.target.value } })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                  <input className="input-field" required value={form.address.city} onChange={e => setForm({ ...form, address: { ...form.address, city: e.target.value } })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                  <input className="input-field" required value={form.address.state} onChange={e => setForm({ ...form, address: { ...form.address, state: e.target.value } })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">ZIP</label>
                  <input className="input-field" required value={form.address.zipCode} onChange={e => setForm({ ...form, address: { ...form.address, zipCode: e.target.value } })} />
                </div>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contact Name</label>
                  <input className="input-field" required value={form.contactPerson.name} onChange={e => setForm({ ...form, contactPerson: { ...form.contactPerson, name: e.target.value } })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contact Email</label>
                  <input type="email" className="input-field" required value={form.contactPerson.email} onChange={e => setForm({ ...form, contactPerson: { ...form.contactPerson, email: e.target.value } })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contact Phone</label>
                  <input className="input-field" required value={form.contactPerson.phone} onChange={e => setForm({ ...form, contactPerson: { ...form.contactPerson, phone: e.target.value } })} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Payment Terms</label>
                <input className="input-field" value={form.paymentTerms} onChange={e => setForm({ ...form, paymentTerms: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Active</label>
                <select className="input-field" value={String(form.isActive)} onChange={e => setForm({ ...form, isActive: e.target.value === 'true' })}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea className="input-field" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">{supplier ? 'Update' : 'Add'} Supplier</button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
