'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, QrCodeIcon } from '@heroicons/react/24/outline'
import { Dialog } from '@headlessui/react'
import toast from 'react-hot-toast'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import Barcode from '@/components/Barcode'

// Lazy-load camera-heavy components on client only
const Scanner = dynamic(() => import('@/components/Scanner'), { ssr: false })

interface Product {
  _id: string
  name: string
  sku: string
  description: string
  category: string
  price: number
  gstPercent?: number
  cost: number
  quantity: number
  minQuantity: number
  location: string
  stockStatus: string
  totalValue: number
  profitMargin: string
  supplier?: {
    name: string
    email: string
    _id?: string
  }
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')
  const [aborter, setAborter] = useState<AbortController | null>(null)
  const [showSupplierColumn, setShowSupplierColumn] = useState<boolean>(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [scanSearchOpen, setScanSearchOpen] = useState(false)
  const [barcodeProduct, setBarcodeProduct] = useState<Product | null>(null)

  const categories = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Other']

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedTerm(searchTerm.trim())
      setPage(1) // reset to first page on new search
    }, 350)
    return () => clearTimeout(t)
  }, [searchTerm])

  useEffect(() => {
    // load persisted toggle
    try {
      const saved = localStorage.getItem('ui.products.showSupplierColumn')
      if (saved != null) setShowSupplierColumn(saved === 'true')
    } catch {}
  }, [])

  useEffect(() => {
    // persist toggle
    try { localStorage.setItem('ui.products.showSupplierColumn', String(showSupplierColumn)) } catch {}
  }, [showSupplierColumn])

  // Fetch products when debounced term or category changes, with cancellation
  useEffect(() => {
    const controller = new AbortController()
    setAborter((prev) => {
      try { prev?.abort() } catch {}
      return controller
    })
    fetchProducts(debouncedTerm, selectedCategory, controller.signal)
    return () => {
      try { controller.abort() } catch {}
    }
  }, [debouncedTerm, selectedCategory])

  const fetchProducts = async (term?: string, category?: string, signal?: AbortSignal) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (term) params.append('search', term)
      if (category) params.append('category', category)
      
      const response = await fetch(`/api/products?${params}`, { signal })
      const data = await response.json()
      
      if (response.ok) {
        setProducts(data.products)
      } else {
        toast.error('Failed to fetch products')
      }
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        toast.error('Error fetching products')
      }
    } finally {
      setLoading(false)
    }
  }

  // Immediately refresh products for a given term/category (used by scanner)
  const fetchProductsWith = async (term: string, category: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (term) params.append('search', term)
      if (category) params.append('category', category)
      const controller = new AbortController()
      setAborter((prev) => { try { prev?.abort() } catch {}; return controller })
      const response = await fetch(`/api/products?${params}`, { signal: controller.signal })
      const data = await response.json()
      if (response.ok) {
        setProducts(data.products)
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        // no-op; searchTerm state will still trigger fetchProducts via useEffect
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddProduct = async (productData: any) => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      })

      if (response.ok) {
        toast.success('Product added successfully')
        setIsAddModalOpen(false)
        fetchProducts()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add product')
      }
    } catch (error) {
      toast.error('Error adding product')
    }
  }

  const handleUpdateProduct = async (id: string, productData: any) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      })

      if (response.ok) {
        toast.success('Product updated successfully')
        setEditingProduct(null)
        fetchProducts()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update product')
      }
    } catch (error) {
      toast.error('Error updating product')
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Product deleted successfully')
        fetchProducts()
      } else {
        toast.error('Failed to delete product')
      }
    } catch (error) {
      toast.error('Error deleting product')
    }
  }

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock':
        return 'bg-green-100 text-green-800'
      case 'Low Stock':
        return 'bg-yellow-100 text-yellow-800'
      case 'Out of Stock':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Client-side pagination slice
  const totalItems = products.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const pagedProducts = products.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="lg:pl-72">
        <Header setSidebarOpen={setSidebarOpen} />
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              {/* Page header */}
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage your product inventory
                  </p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="btn-primary flex items-center"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Product
                </button>
              </div>

              {/* Filters */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input-field pl-10"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setScanSearchOpen(true)}
                  className="btn-secondary flex items-center"
                  title="Scan to search"
                >
                  <QrCodeIcon className="h-5 w-5 mr-2" />
                  Scan
                </button>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input-field w-48"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Products table */}
              <div className="card">
                <div className="overflow-x-auto">
                  <div className="flex items-center justify-end p-2">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" className="rounded border-gray-300" checked={showSupplierColumn} onChange={(e) => setShowSupplierColumn(e.target.checked)} />
                      Show Supplier column
                    </label>
                  </div>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="table-header">Product</th>
                        <th className="table-header">SKU</th>
                        <th className="table-header">Category</th>
                        {showSupplierColumn && <th className="table-header">Supplier</th>}
                        <th className="table-header">Price</th>
                        <th className="table-header">GST %</th>
                        <th className="table-header">Quantity</th>
                        <th className="table-header">Status</th>
                        <th className="table-header">Total Value</th>
                        <th className="table-header">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan={9} className="table-cell text-center">
                            Loading...
                          </td>
                        </tr>
                      ) : products.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="table-cell text-center">
                            No products found
                          </td>
                        </tr>
                      ) : (
                        pagedProducts.map((product) => (
                          <tr key={product._id} className="hover:bg-gray-50">
                            <td className="table-cell">
                              <div>
                                <div className="font-medium text-gray-900">{product.name}</div>
                                <div className="text-sm text-gray-500">{product.description}</div>
                              </div>
                            </td>
                            <td className="table-cell font-mono">{product.sku}</td>
                            <td className="table-cell">{product.category}</td>
                            {showSupplierColumn && (
                              <td className="table-cell">{product.supplier?.name || '-'}</td>
                            )}
                            <td className="table-cell">₹{product.price.toFixed(2)}</td>
                            <td className="table-cell">{product.gstPercent ?? 5}%</td>
                            <td className="table-cell">{product.quantity}</td>
                            <td className="table-cell">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStockStatusColor(product.stockStatus)}`}>
                                {product.stockStatus}
                              </span>
                            </td>
                            <td className="table-cell">₹{product.totalValue.toFixed(2)}</td>
                            <td className="table-cell">
                              <div className="flex space-x-2">
                                <Link
                                  href={`/ledger?sku=${encodeURIComponent(product.sku)}`}
                                  className="text-indigo-600 hover:text-indigo-900"
                                  title="View Ledger"
                                >
                                  <MagnifyingGlassIcon className="h-4 w-4" />
                                </Link>
                                <button
                                  onClick={() => setBarcodeProduct(product)}
                                  className="text-gray-700 hover:text-gray-900"
                                  title="Show Barcode"
                                >
                                  <QrCodeIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setEditingProduct(product)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(product._id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Pagination controls */}
                <div className="flex items-center justify-between p-3">
                  <div className="text-sm text-gray-600">Page {page} of {totalPages} • {totalItems} items</div>
                  <div className="flex items-center gap-2">
                    <select
                      className="input-field w-28"
                      value={pageSize}
                      onChange={(e) => { setPage(1); setPageSize(parseInt(e.target.value, 10)) }}
                    >
                      {[10, 20, 50, 100].map(sz => (
                        <option key={sz} value={sz}>{sz} / page</option>
                      ))}
                    </select>
                    <button className="btn-secondary" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
                    <button className="btn-secondary" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
                  </div>
                </div>
              </div>

              {/* Add/Edit Product Modal */}
              <ProductModal
                isOpen={isAddModalOpen || !!editingProduct}
                onClose={() => {
                  setIsAddModalOpen(false)
                  setEditingProduct(null)
                }}
                onSubmit={editingProduct ? handleUpdateProduct : (_id: string, data: any) => handleAddProduct(data)}
                product={editingProduct}
                categories={categories}
              />

              {/* Scan-to-search Modal */}
              <Dialog open={scanSearchOpen} onClose={() => setScanSearchOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                  <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6 w-full">
                    <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">Scan to Search</Dialog.Title>
                    <Scanner
                      onDetected={(code) => {
                        setSearchTerm(code)
                        fetchProductsWith(code, selectedCategory)
                        setScanSearchOpen(false)
                        toast.success(`Scanned: ${code}`)
                      }}
                      onClose={() => setScanSearchOpen(false)}
                    />
                  </Dialog.Panel>
                </div>
              </Dialog>

              {/* Barcode Modal */}
              <Dialog open={!!barcodeProduct} onClose={() => setBarcodeProduct(null)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                  <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6 w-full">
                    <Dialog.Title className="text-lg font-medium text-gray-900">Barcode</Dialog.Title>
                    {barcodeProduct && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-700 mb-2">{barcodeProduct.name}</p>
                        <Barcode value={barcodeProduct.sku} />
                      </div>
                    )}
                    <div className="mt-4 flex justify-end">
                      <button className="btn-secondary" onClick={() => setBarcodeProduct(null)}>Close</button>
                    </div>
                  </Dialog.Panel>
                </div>
              </Dialog>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

// Product Modal Component
function ProductModal({ isOpen, onClose, onSubmit, product, categories }: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (id: string, data: any) => void
  product: Product | null
  categories: string[]
}) {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    price: '',
    cost: '',
    quantity: '',
    minQuantity: '',
    gstPercent: '5',
    location: '',
    supplier: '' as string,
  })
  const [suppliers, setSuppliers] = useState<Array<{ _id: string; name: string }>>([])
  const [scanSkuOpen, setScanSkuOpen] = useState(false)
  const [showBarcode, setShowBarcode] = useState(false)

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        sku: product.sku,
        description: product.description,
        category: product.category,
        price: product.price.toString(),
        cost: product.cost.toString(),
        quantity: product.quantity.toString(),
        minQuantity: product.minQuantity.toString(),
        gstPercent: (product.gstPercent ?? 5).toString(),
        location: product.location,
        supplier: product.supplier?._id || '',
      })
    } else {
      setFormData({
        name: '',
        sku: '',
        description: '',
        category: '',
        price: '',
        cost: '',
        quantity: '',
        minQuantity: '',
        gstPercent: '5',
        location: '',
        supplier: '',
      })
    }
  }, [product])

  useEffect(() => {
    // Load suppliers when modal opens
    if (!isOpen) return
    ;(async () => {
      try {
        const res = await fetch('/api/suppliers?activeOnly=true&limit=1000')
        const data = await res.json()
        if (res.ok) {
          setSuppliers((data.suppliers || []).map((s: any) => ({ _id: s._id, name: s.name })))
        }
      } catch {}
    })()
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      ...formData,
      price: parseFloat(formData.price),
      cost: parseFloat(formData.cost),
      quantity: parseInt(formData.quantity),
      minQuantity: parseInt(formData.minQuantity),
      supplier: formData.supplier || undefined,
    }
    
    if (product) {
      onSubmit(product._id, data)
    } else {
      onSubmit('', data)
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Centered, compact, no-scroll modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-blue-100">
          {/* Colorful header */}
          <div className="rounded-t-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600 px-6 py-3 text-white">
            <Dialog.Title className="text-base md:text-lg font-semibold tracking-wide">
              {product ? 'Edit Product' : 'Add Product'}
            </Dialog.Title>
            <p className="text-xs opacity-90">Quickly add essential details. Advanced fields are condensed.</p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5">
            {/* Two-column compact grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="Product name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">SKU</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="input-field flex-1"
                    placeholder="e.g. ABC-001"
                  />
                  <button
                    type="button"
                    className="btn-secondary flex items-center whitespace-nowrap"
                    onClick={() => setScanSkuOpen(true)}
                    title="Scan SKU"
                  >
                    <QrCodeIcon className="h-5 w-5 mr-1" /> Scan
                  </button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows={2}
                  placeholder="Short description"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Supplier</label>
                <select
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="input-field"
                >
                  <option value="">No Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">GST %</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.gstPercent}
                    onChange={(e) => setFormData({ ...formData, gstPercent: e.target.value })}
                    className="input-field"
                    placeholder="5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="input-field"
                    placeholder="Rack A-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="input-field"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Cost</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="input-field"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="input-field"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Min Qty</label>
                <input
                  type="number"
                  required
                  value={formData.minQuantity}
                  onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                  className="input-field"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Optional: collapsed barcode preview to keep height small */}
            {formData.sku && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowBarcode(v => !v)}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  {showBarcode ? 'Hide' : 'Show'} barcode preview
                </button>
                {showBarcode && (
                  <div className="mt-2 p-2 rounded border border-gray-200 inline-block">
                    <Barcode value={formData.sku} height={48} />
                  </div>
                )}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">
                {product ? 'Update' : 'Add'} Product
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>

      {/* Scan SKU Modal */}
      <Dialog open={scanSkuOpen} onClose={() => setScanSkuOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6 w-full">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">Scan SKU</Dialog.Title>
            <Scanner
              onDetected={(code) => {
                setFormData((prev) => ({ ...prev, sku: code }))
                setScanSkuOpen(false)
                toast.success(`SKU scanned: ${code}`)
              }}
              onClose={() => setScanSkuOpen(false)}
            />
          </Dialog.Panel>
        </div>
      </Dialog>
    </Dialog>
  )
}
