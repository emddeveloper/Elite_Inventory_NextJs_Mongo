import { NextRequest, NextResponse } from 'next/server'
import { validateCredentials, AUTH_COOKIE } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()
  if (!username || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  }
  const user = validateCredentials(username, password)
  if (!user) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true, user })
  // Store minimal user info in cookie for edge-safe middleware consumption
  const encoded = Buffer.from(JSON.stringify(user)).toString('base64')
  res.cookies.set(AUTH_COOKIE, encoded, { httpOnly: true, sameSite: 'lax', path: '/' })
  return res
}
