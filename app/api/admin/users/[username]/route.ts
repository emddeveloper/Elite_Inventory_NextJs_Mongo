import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE } from '@/lib/auth-cookie'
import { upsertUser, deleteUser, ROLES, readAuthFile } from '@/lib/auth-admin'

export const runtime = 'nodejs'

function getAdmin(req: NextRequest): { username: string } | null {
  const raw = req.cookies.get(AUTH_COOKIE)?.value
  if (!raw) return null
  try {
    const user = JSON.parse(globalThis.atob(raw))
    if (user?.role !== 'admin') return null
    return { username: user.username }
  } catch {
    return null
  }
}

export async function PUT(req: NextRequest, { params }: { params: { username: string } }) {
  const admin = getAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const target = params.username
  const body = await req.json()
  const { role, password, menus } = body || {}

  if (target === admin.username && role && role !== 'admin') {
    return NextResponse.json({ error: 'Cannot modify your own role' }, { status: 400 })
  }
  if (role && !ROLES.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  try {
    // Ensure user exists
    const data = readAuthFile()
    const exists = data.users.find(u => u.username === target)
    if (!exists) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    upsertUser({ username: target, role: role ?? exists.role, password, menus })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { username: string } }) {
  const admin = getAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const target = params.username
  if (target === admin.username) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
  }
  try {
    deleteUser(target)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to delete user' }, { status: 500 })
  }
}
