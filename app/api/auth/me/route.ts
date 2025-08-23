import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE } from '@/lib/auth-cookie'

export async function GET(req: NextRequest) {
  const raw = req.cookies.get(AUTH_COOKIE)?.value
  if (!raw) return NextResponse.json({ user: null })
  try {
    const user = JSON.parse(globalThis.atob(raw))
    return NextResponse.json({ user })
  } catch (e) {
    return NextResponse.json({ user: null })
  }
}
