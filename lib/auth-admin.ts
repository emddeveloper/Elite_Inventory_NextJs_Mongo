import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export type Role = 'admin' | 'manager' | 'staff' | 'viewer'
export const ROLES: Role[] = ['admin', 'manager', 'staff', 'viewer']

export type UserRecord = {
  username: string
  password: string // hashed format: scrypt:<salt>:<hash> or legacy plaintext
  role: Role | string
  menus?: string[]
}

const AUTH_FILE_PRIMARY = path.join(process.cwd(), 'auth.json')
const RUNTIME_DIR = process.env.AUTH_RUNTIME_DIR || '/tmp'
const AUTH_FILE_RUNTIME = path.join(RUNTIME_DIR, 'auth.json')

function pickAuthReadPath() {
  // Prefer runtime copy if it exists (e.g., after first write on serverless)
  try {
    if (fs.existsSync(AUTH_FILE_RUNTIME)) return AUTH_FILE_RUNTIME
  } catch {}
  return AUTH_FILE_PRIMARY
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

export type AuthJson = { users: UserRecord[]; AllMenus?: string[]; [k: string]: any }

export function readAuthFile(): AuthJson {
  const readPath = pickAuthReadPath()
  const raw = fs.readFileSync(readPath, 'utf-8')
  return JSON.parse(raw)
}

export function writeAuthFileWithBackup(users: UserRecord[]) {
  // Determine base dir by target. Try primary first; on failure, fall back to runtime dir.
  const attemptWrite = (targetFile: string) => {
    const baseDir = path.dirname(targetFile)
    const backupDir = path.join(baseDir, 'backups')
    ensureDir(baseDir)
    ensureDir(backupDir)

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = path.join(backupDir, `auth.backup.${timestamp}.json`)

    // Backup existing file if present
    if (fs.existsSync(targetFile)) {
      const current = fs.readFileSync(targetFile)
      fs.writeFileSync(backupPath, current)
    }

    // Preserve other fields like AllMenus
    let currentJson: AuthJson = { users: [] }
    try {
      currentJson = JSON.parse(fs.readFileSync(targetFile, 'utf-8'))
    } catch {}
    const merged: AuthJson = { ...currentJson, users }
    const data = JSON.stringify(merged, null, 2)

    // Simple integrity: compute sha256
    const checksum = crypto.createHash('sha256').update(data).digest('hex')
    const tmp = targetFile + '.tmp'
    fs.writeFileSync(tmp, data)
    // Verify write
    const written = fs.readFileSync(tmp, 'utf-8')
    const writtenChecksum = crypto.createHash('sha256').update(written).digest('hex')
    if (checksum !== writtenChecksum) {
      fs.unlinkSync(tmp)
      throw new Error('Integrity check failed while writing auth file')
    }
    fs.renameSync(tmp, targetFile)
  }

  try {
    attemptWrite(AUTH_FILE_PRIMARY)
  } catch (e: any) {
    if (e?.code === 'EROFS' || e?.code === 'EPERM' || e?.code === 'EACCES') {
      ensureDir(RUNTIME_DIR)
      attemptWrite(AUTH_FILE_RUNTIME)
    } else {
      throw e
    }
  }
}

// Password hashing utilities (Node built-in scrypt)
export function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const derived = crypto.scryptSync(plain, salt, 64).toString('hex')
  return `scrypt:${salt}:${derived}`
}

export function verifyPassword(stored: string, attempt: string): boolean {
  if (stored.startsWith('scrypt:')) {
    const [, salt, derived] = stored.split(':')
    const check = crypto.scryptSync(attempt, salt, 64).toString('hex')
    return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(check, 'hex'))
  }
  // Legacy plaintext fallback
  return stored === attempt
}

export function upsertUser(user: { username: string; password?: string; role: Role | string; menus?: string[] }) {
  const data = readAuthFile()
  const idx = data.users.findIndex(u => u.username === user.username)
  if (idx === -1) {
    data.users.push({
      username: user.username,
      password: user.password ? hashPassword(user.password) : hashPassword(crypto.randomBytes(8).toString('hex')),
      role: (user.role as Role) || 'viewer',
      menus: user.menus
    })
  } else {
    const existing = data.users[idx]
    data.users[idx] = {
      ...existing,
      role: (user.role as Role) || existing.role,
      menus: user.menus ?? existing.menus,
      password: user.password ? hashPassword(user.password) : existing.password,
    }
  }
  writeAuthFileWithBackup(data.users)
}

export function deleteUser(username: string) {
  const data = readAuthFile()
  const next = data.users.filter(u => u.username !== username)
  writeAuthFileWithBackup(next)
}

export function listUsers(): Array<Pick<UserRecord, 'username'|'role'|'menus'>> {
  const data = readAuthFile()
  return data.users.map(u => ({ username: u.username, role: u.role, menus: u.menus }))
}

export function getAllMenus(): string[] {
  const data = readAuthFile()
  return Array.isArray(data.AllMenus) ? data.AllMenus : []
}
