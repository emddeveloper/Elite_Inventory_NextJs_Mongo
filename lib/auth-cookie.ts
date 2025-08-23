export const AUTH_COOKIE = 'auth_user'

// Decode the auth cookie payload safely on the server (Node)
export function decodeAuthCookie(raw?: string): { username?: string; role?: string } {
  try {
    if (!raw) return {}
    const json = Buffer.from(raw, 'base64').toString('utf8')
    const u = JSON.parse(json)
    return { username: u?.username, role: u?.role }
  } catch {
    return {}
  }
}
