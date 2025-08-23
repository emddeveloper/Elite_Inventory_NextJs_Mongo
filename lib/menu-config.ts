export const roleMenus: Record<string, string[]> = {
  admin: [
    '/',
    '/products',
    '/sales',
    '/transactions',
    '/ledger',
    '/inventory',
    '/suppliers',
    '/customers',
    '/reports',
    '/settings',
  ],
  manager: ['/', '/products', '/sales', '/transactions', '/ledger', '/reports'],
  staff: ['/', '/products', '/sales'],
}

export function getMenusForRole(role: string): string[] {
  return roleMenus[role] ?? ['/']
}
