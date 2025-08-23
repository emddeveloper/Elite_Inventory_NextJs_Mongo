'use client'

import { Fragment, useEffect, useState } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { Bars3Icon, BellIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { UserCircleIcon } from '@heroicons/react/24/solid'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Header({ setSidebarOpen }: { setSidebarOpen: (open: boolean) => void }) {
  const [lowStock, setLowStock] = useState<any[]>([])
  const [openNotifs, setOpenNotifs] = useState(false)

  // Poll low-stock products every 10s
  useEffect(() => {
    let mounted = true
    async function fetchLow() {
      try {
        const res = await fetch('/api/products?lowStock=true&limit=50')
        if (!res.ok) return
        const data = await res.json()
        if (mounted) setLowStock(Array.isArray(data.products) ? data.products : [])
      } catch (e) {
        // ignore
      }
    }
    fetchLow()
    const iv = setInterval(fetchLow, 10000)
    return () => { mounted = false; clearInterval(iv) }
  }, [])

  const notifCount = lowStock.length

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">
            Search
          </label>
          <MagnifyingGlassIcon
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400"
            aria-hidden="true"
          />
          <input
            id="search-field"
            className="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
            placeholder="Search..."
            type="search"
            name="search"
          />
        </form>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <div className="relative">
            <button type="button" onClick={() => setOpenNotifs(!openNotifs)} className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-10 w-8" aria-hidden="true" />
            </button>
            {notifCount > 0 && (
              <span className="absolute -top-0 -right-0 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-600 text-white text-xs">{notifCount}</span>
            )}

            {openNotifs && (
              <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg z-20">
                <div className="p-3 border-b font-semibold">Low Stock Products ({notifCount})</div>
                <div className="max-h-64 overflow-auto">
                  {lowStock.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">No low stock items</div>
                  ) : (
                    lowStock.map((p:any) => (
                      <div key={p._id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                        <div>
                          <div className="font-medium text-sm">{p.name}</div>
                          <div className="text-xs text-gray-500">SKU: {p.sku} • Qty: {p.quantity}</div>
                        </div>
                        <div>
                          <a href={`/products`} className="text-blue-600 text-sm">Open</a>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 text-center border-t">
                  <button onClick={() => { setOpenNotifs(false) }} className="text-sm text-gray-600">Close</button>
                </div>
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

          {/* Profile dropdown */}
          <Menu as="div" className="relative">
            <Menu.Button className="-m-1.5 flex items-center p-1.5">
              <span className="sr-only">Open user menu</span>
              <UserCircleIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
              <span className="hidden lg:flex lg:items-center">
                <span className="ml-4 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                  Admin User
                </span>
              </span>
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="#"
                      className={classNames(
                        active ? 'bg-gray-50' : '',
                        'block px-3 py-1 text-sm leading-6 text-gray-900'
                      )}
                    >
                      Your profile
                    </a>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="#"
                      className={classNames(
                        active ? 'bg-gray-50' : '',
                        'block px-3 py-1 text-sm leading-6 text-gray-900'
                      )}
                    >
                      Sign out
                    </a>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </div>
  )
}
