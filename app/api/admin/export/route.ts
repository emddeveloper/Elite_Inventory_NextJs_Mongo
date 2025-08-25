import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { AUTH_COOKIE } from '@/lib/auth-cookie'
import JSZip from 'jszip'

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

function toCSV(rows: Record<string, any>[]): string {
  if (!rows || rows.length === 0) return ''
  // Collect union of keys
  const cols = Array.from(rows.reduce<Set<string>>((set, r) => {
    Object.keys(r || {}).forEach(k => set.add(k))
    return set
  }, new Set<string>()))

  const escape = (v: any) => {
    if (v === null || v === undefined) return ''
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
    // Escape quotes and wrap in quotes if needed
    const needsQuote = /[",\n]/.test(s)
    const escaped = s.replace(/\"/g, '""')
    return needsQuote ? `"${escaped}"` : escaped
  }

  const header = cols.join(',')
  const lines = rows.map(r => cols.map(c => escape((r as any)[c])).join(','))
  return [header, ...lines].join('\n')
}

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req)
  if ('ok' in auth === false) return auth as NextResponse

  const { searchParams } = new URL(req.url)
  const collectionParam = searchParams.get('collection')

  const conn = await dbConnect()
  const db = conn.db
  if (!db) {
    return NextResponse.json({ error: 'Database not available' }, { status: 500 })
  }
  const collsInfo = await db.listCollections().toArray()
  const names = collsInfo
    .map((c: any) => c.name as string)
    .filter((n: string) => !n.startsWith('system.'))

  const zipParam = searchParams.get('zip')
  if (zipParam === '1') {
    const zip = new JSZip()
    for (const name of names) {
      const docs = await db.collection(name).find({}).toArray()
      const sanitized = docs.map(d => {
        const { _id, ...rest } = d as any
        return { _id: String(_id), ...rest }
      })
      const csv = toCSV(sanitized)
      zip.file(`${name}.csv`, csv || '')
    }
    const zipArrayBuffer = await zip.generateAsync({ type: 'arraybuffer' })
    const ts = new Date()
    const pad = (n: number) => n.toString().padStart(2, '0')
    const fname = `backup-${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}.zip`
    const res = new NextResponse(zipArrayBuffer)
    res.headers.set('Content-Type', 'application/zip')
    res.headers.set('Content-Disposition', `attachment; filename="${fname}"`)
    return res
  }

  if (!collectionParam) {
    // List available collections
    return NextResponse.json({ collections: names })
  }

  if (!names.includes(collectionParam)) {
    return NextResponse.json({ error: `Collection not found: ${collectionParam}` }, { status: 404 })
  }

  const docs = await db.collection(collectionParam).find({}).toArray()
  // Convert Mongo docs to plain objects and remove internal fields if needed
  const sanitized = docs.map(d => {
    const { _id, ...rest } = d
    return { _id: String(_id), ...rest }
  })
  const csv = toCSV(sanitized)

  const res = new NextResponse(csv)
  res.headers.set('Content-Type', 'text/csv; charset=utf-8')
  const filename = `${collectionParam}.csv`
  res.headers.set('Content-Disposition', `attachment; filename="${filename}"`)
  return res
}
