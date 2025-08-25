import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIE } from './lib/auth-cookie'

const PUBLIC_PATHS = new Set<string>(['/login', '/api/auth/login', '/api/auth/logout', '/api/auth/me', '/_next', '/favicon.ico', '/public'])

function isPublic(pathname: string) {
  if (pathname === '/login') return true
  if (pathname.startsWith('/api/auth')) return true
  // Allow all API routes to avoid HTML redirects on JSON requests
  if (pathname.startsWith('/api/')) return true
  if (pathname.startsWith('/_next')) return true
  if (pathname.startsWith('/favicon')) return true
  if (pathname.startsWith('/public')) return true
  return false
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (isPublic(pathname)) return NextResponse.next()

  const raw = req.cookies.get(AUTH_COOKIE)?.value
  if (!raw) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  let user: { username: string; role: string; menus?: string[] } | null = null
  try {
    const json = globalThis.atob(raw)
    user = JSON.parse(json)
  } catch (_) {
    user = null
  }
  if (!user) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Enforce menu-based access if provided (admins bypass)
  if (user.role !== 'admin' && user.menus && user.menus.length > 0) {
    const allowed = user.menus.some(m => pathname === m || pathname.startsWith(m + '/'))
    if (!allowed) {
      const url = req.nextUrl.clone()
      url.pathname = user.menus[0] || '/'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}
