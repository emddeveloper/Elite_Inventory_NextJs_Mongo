import fs from 'fs'
import path from 'path'
import { verifyPassword } from './auth-admin'

export type UserRecord = {
  username: string
  password: string
  role: 'admin' | 'manager' | 'staff' | string
  menus?: string[]
}

export type AuthUser = {
  username: string
  role: string
  menus: string[]
}

const AUTH_FILE = path.join(process.cwd(), 'auth.json')

function readAuthFile(): { users: UserRecord[] } {
  const raw = fs.readFileSync(AUTH_FILE, 'utf-8')
  return JSON.parse(raw)
}

export function validateCredentials(username: string, password: string): AuthUser | null {
  try {
    const { users } = readAuthFile()
    const user = users.find(u => u.username === username)
    if (!user) return null
    // Verify hashed or legacy plaintext password
    if (!verifyPassword(user.password, password)) return null
    return {
      username: user.username,
      role: user.role,
      menus: user.menus ?? ['/']
    }
  } catch (e) {
    console.error('Auth file read/parse error', e)
    return null
  }
}

export function getUser(username: string): AuthUser | null {
  try {
    const { users } = readAuthFile()
    const user = users.find(u => u.username === username)
    if (!user) return null
    return {
      username: user.username,
      role: user.role,
      menus: user.menus ?? ['/']
    }
  } catch (e) {
    console.error('Auth file read/parse error', e)
    return null
  }
}

export const AUTH_COOKIE = 'auth_user'
