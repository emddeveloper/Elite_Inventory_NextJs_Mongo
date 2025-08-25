"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

type ListedUser = { username: string; role: string; menus?: string[] }

type Me = { username: string; role: string; menus?: string[] } | null

type ApiListResp = { users: ListedUser[]; roles: string[]; allMenus: string[] }

export default function AdminUsersPage() {
  const [me, setMe] = useState<Me>(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<ListedUser[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [allMenus, setAllMenus] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Create form state
  const [nUsername, setNUsername] = useState('')
  const [nPassword, setNPassword] = useState('')
  const [nRole, setNRole] = useState('viewer')
  const [nMenus, setNMenus] = useState<string[]>([])

  // Edit access state
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editMenus, setEditMenus] = useState<string[]>([])

  const isAdmin = useMemo(() => me?.role === 'admin', [me])

  async function loadAll() {
    setLoading(true)
    setError(null)
    try {
      const meRes = await fetch('/api/auth/me')
      const meJson = await meRes.json()
      setMe(meJson?.user ?? null)

      const res = await fetch('/api/admin/users')
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || `Failed to load users (${res.status})`)
      }
      const data: ApiListResp = await res.json()
      setUsers(data.users)
      setRoles(data.roles)
      setAllMenus(data.allMenus || [])
      // default create selection to all menus (optional): setNMenus(data.allMenus || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: nUsername.trim(), password: nPassword, role: nRole, menus: nMenus })
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || 'Failed to create user')
      }
      setNUsername('')
      setNPassword('')
      setNRole('viewer')
      setNMenus([])
      await loadAll()
    } catch (e: any) {
      setError(e?.message || 'Failed to create user')
    }
  }

  async function changeRole(username: string, role: string) {
    if (username === me?.username) {
      setError("You cannot modify your own role")
      return
    }
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(username)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || 'Failed to update role')
      }
      await loadAll()
    } catch (e: any) {
      setError(e?.message || 'Failed to update role')
    }
  }

  async function deleteUser(username: string) {
    if (username === me?.username) {
      setError("You cannot delete yourself")
      return
    }
    if (!confirm(`Delete user ${username}?`)) return
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(username)}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || 'Failed to delete user')
      }
      await loadAll()
    } catch (e: any) {
      setError(e?.message || 'Failed to delete user')
    }
  }

  function toggleCreateMenu(m: string) {
    setNMenus(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  }

  function startEditMenus(u: ListedUser) {
    setEditingUser(u.username)
    setEditMenus(u.menus || [])
  }

  function toggleEditMenu(m: string) {
    setEditMenus(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  }

  async function saveEditMenus(username: string) {
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(username)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menus: editMenus })
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || 'Failed to update access')
      }
      setEditingUser(null)
      await loadAll()
    } catch (e: any) {
      setError(e?.message || 'Failed to update access')
    }
  }

  if (!isAdmin && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Forbidden</h1>
          <p className="text-gray-600 mt-2">Admin access required.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-1 text-sm text-primary-700 hover:text-primary-800">
              <ArrowLeftIcon className="h-5 w-5" />
              Back to Dashboard
            </Link>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold">Admin · User Management</h1>
            <p className="text-sm text-gray-500">Manage users, roles, and access</p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-2">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 card p-6">
            <h2 className="font-semibold mb-4">Add New User</h2>
            <form onSubmit={createUser} className="space-y-4">
              <div>
                <label className="label">Username</label>
                <input className="input-field" value={nUsername} onChange={e=>setNUsername(e.target.value)} required />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" className="input-field" value={nPassword} onChange={e=>setNPassword(e.target.value)} required />
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input-field" value={nRole} onChange={e=>setNRole(e.target.value)}>
                  {roles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Module Access</label>
                <div className="rounded-md border p-2 max-h-48 overflow-auto bg-white">
                  {allMenus.map(m => (
                    <label key={m} className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={nMenus.includes(m)}
                        onChange={() => toggleCreateMenu(m)}
                      />
                      <span className="text-sm text-gray-700">{m}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn-primary w-full">Create</button>
            </form>
          </div>

          <div className="lg:col-span-2 card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Existing Users</h2>
              <button onClick={loadAll} className="btn-secondary">Refresh</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 pr-4">Username</th>
                    <th className="py-2 pr-4">Role</th>
                    <th className="py-2 pr-4">Access</th>
                    <th className="py-2 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.username} className="border-t">
                      <td className="py-2 pr-4 font-medium">{u.username}</td>
                      <td className="py-2 pr-4">
                        <select
                          className="input-field py-1"
                          value={u.role}
                          onChange={e => changeRole(u.username, e.target.value)}
                          disabled={u.username === me?.username}
                        >
                          {roles.map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        {u.username === me?.username && (
                          <div className="text-xs text-gray-500 mt-1">You cannot change your own role</div>
                        )}
                      </td>
                      <td className="py-2 pr-4 align-top">
                        {editingUser === u.username ? (
                          <div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-auto p-2 border rounded-md bg-white">
                              {allMenus.map(m => (
                                <label key={m} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4"
                                    checked={editMenus.includes(m)}
                                    onChange={() => toggleEditMenu(m)}
                                  />
                                  <span className="text-xs text-gray-700">{m}</span>
                                </label>
                              ))}
                            </div>
                            <div className="mt-2 flex gap-2">
                              <button className="btn-primary" onClick={() => saveEditMenus(u.username)}>Save</button>
                              <button className="btn-secondary" onClick={() => setEditingUser(null)}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {(u.menus || []).slice(0, 6).map(m => (
                              <span key={m} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">{m}</span>
                            ))}
                            {(u.menus && u.menus.length > 6) && (
                              <span className="text-xs text-gray-500">+{u.menus.length - 6} more</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            className="btn-secondary"
                            onClick={() => startEditMenus(u)}
                            disabled={u.username === me?.username}
                          >
                            Edit Access
                          </button>
                          <button
                            className="btn-danger"
                            onClick={() => deleteUser(u.username)}
                            disabled={u.username === me?.username}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
