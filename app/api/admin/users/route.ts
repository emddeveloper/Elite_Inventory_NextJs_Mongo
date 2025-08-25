import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE } from '@/lib/auth-cookie'
import { listUsers, upsertUser, ROLES, getAllMenus } from '@/lib/auth-admin'

export const runtime = 'nodejs'

function requireAdmin(req: NextRequest): { ok: true } | NextResponse {
  const raw = req.cookies.get(AUTH_COOKIE)?.value
  if (!raw) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const user = JSON.parse(globalThis.atob(raw))
    if (user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return { ok: true }
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req)
  if ('ok' in auth === false) return auth as NextResponse
  return NextResponse.json({ users: listUsers(), roles: ROLES, allMenus: getAllMenus() })
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req)
  if ('ok' in auth === false) return auth as NextResponse
  const body = await req.json()
  const { username, password, role, menus } = body || {}
  if (!username || !password || !role) {
    return NextResponse.json({ error: 'username, password and role are required' }, { status: 400 })
  }
  if (!ROLES.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }
  try {
    upsertUser({ username, password, role, menus })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create user' }, { status: 500 })
  }
}
