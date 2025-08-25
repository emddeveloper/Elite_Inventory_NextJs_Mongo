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
    '/barcode-generator',
  ],
  manager: ['/', '/products', '/sales', '/transactions', '/ledger', '/reports', '/barcode-generator'],
  staff: ['/', '/products', '/sales'],
}

export function getMenusForRole(role: string): string[] {
  return roleMenus[role] ?? ['/']
}
