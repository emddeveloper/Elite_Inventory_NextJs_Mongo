'use client'

import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  CubeIcon,
  TruckIcon,
  UsersIcon,
  ChartBarIcon,
  CogIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  QrCodeIcon,
} from '@heroicons/react/24/outline'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { SparklesIcon } from '@heroicons/react/24/solid'

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Products', href: '/products', icon: CubeIcon },
  { name: 'Sales', href: '/sales', icon: ChartBarIcon },
  { name: 'Transactions', href: '/transactions', icon: DocumentTextIcon },
  { name: 'Ledger', href: '/ledger', icon: DocumentTextIcon },
  { name: 'Inventory Update 👑', href: '/inventory', icon: DocumentTextIcon },
  { name: 'Suppliers', href: '/suppliers', icon: TruckIcon },
  { name: 'Customers', href: '/customers', icon: UsersIcon },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
  { name: 'Barcode Generator 👑', href: '/barcode-generator', icon: QrCodeIcon },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Sidebar({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const pathname = usePathname()
  const [menus, setMenus] = useState<string[]>([])
  const [collapsed, setCollapsed] = useState<boolean>(false)

  useEffect(() => {
    let mounted = true
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then(({ user }) => {
        if (!mounted) return
        setMenus(user?.menus ?? [])
      })
      .catch(() => setMenus([]))
    return () => {
      mounted = false
    }
  }, [])

  // Load and persist collapse state (desktop only)
  useEffect(() => {
    try {
      const v = localStorage.getItem('sidebar_collapsed')
      if (v != null) setCollapsed(v === '1')
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('sidebar_collapsed', collapsed ? '1' : '0')
    } catch {}
    // Notify listeners (pages) that collapse state changed
    try {
      const event = new CustomEvent('sidebar:collapse-changed', { detail: { collapsed } })
      window.dispatchEvent(event)
    } catch {}
  }, [collapsed])

  const navToRender = menus && menus.length > 0
    ? navigation.filter((item) => menus.some((m) => item.href === m || item.href.startsWith(m + '/')))
    : navigation

  return (
    <>
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button type="button" className="-m-2.5 p-2.5" onClick={() => setOpen(false)}>
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gradient-to-b from-primary-50/80 via-fuchsia-50/70 to-emerald-50/70 backdrop-blur-xl px-6 pb-4 border-r border-primary-100">
                  <div className="flex h-20 shrink-0 items-center">
                    <Link href="/" className="group outline-none">
                      <div>
                        <h1 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary-700 via-fuchsia-600 to-violet-700 group-hover:from-primary-800 group-hover:via-fuchsia-700 group-hover:to-violet-800">Elite Inventory Manager</h1>
                        <div className="mt-2 inline-flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-primary-600 via-fuchsia-600 to-violet-600 shadow-md">
                          <SparklesIcon className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </Link>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {navToRender.map((item) => (
                            <li key={item.name}>
                              <Link
                                href={item.href}
                                className={classNames(
                                  pathname === item.href
                                    ? 'bg-primary-50/70 text-primary-700 border border-primary-100'
                                    : 'text-gray-700 hover:text-primary-700 hover:bg-primary-50/60',
                                  'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors'
                                )}
                              >
                                <item.icon
                                  className={classNames(
                                    pathname === item.href ? 'text-primary-700' : 'text-gray-400 group-hover:text-primary-700',
                                    'h-6 w-6 shrink-0'
                                  )}
                                  aria-hidden="true"
                                />
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <div className={`hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex ${collapsed ? 'lg:w-20' : 'lg:w-72'} lg:flex-col transition-[width] duration-200`}>
        <div className="flex grow flex-col gap-y-3 overflow-y-auto border-r border-gray-800/60 bg-gradient-to-b from-[#1f2533] via-[#1c2230] to-[#151a24] text-gray-200 px-3 pb-3">
          {/* Header with brand and collapse toggle */}
          <div className="flex h-20 shrink-0 items-center justify-between">
            <Link href="/" className="group outline-none flex items-center gap-3">
              <div className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-white/10">
                <SparklesIcon className="h-5 w-5 text-white" />
              </div>
              {!collapsed && (
                <h1 className="text-lg font-semibold text-white">Inventory</h1>
              )}
            </Link>
            <button
              onClick={() => setCollapsed(v => !v)}
              className="hidden lg:inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-200 hover:bg-white/10"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRightIcon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />}
            </button>
          </div>

          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-6">
              <li>
                <ul role="list" className="-mx-1 space-y-1">
                  {navToRender.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.name : undefined}
                        className={classNames(
                          pathname === item.href
                            ? 'bg-[#3b82f6] text-white'
                            : 'text-gray-300 hover:text-white hover:bg-white/10',
                          'group flex items-center rounded-xl py-2 text-sm font-medium transition-colors',
                          collapsed ? 'justify-center px-2' : 'gap-x-3 px-3'
                        )}
                      >
                        <item.icon
                          className={classNames(
                            pathname === item.href ? 'text-white' : 'text-gray-400 group-hover:text-white',
                            'h-5 w-5 shrink-0'
                          )}
                          aria-hidden="true"
                        />
                        {!collapsed && <span className="truncate">{item.name}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>

          {/* Bottom collapse toggle for easier access */}
          <div className="mt-auto flex items-center justify-center py-2">
            <button
              onClick={() => setCollapsed(v => !v)}
              className="inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-200 hover:bg-white/10"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRightIcon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
