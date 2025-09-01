export type VersionEntry = {
  version: string
  date: string // ISO string
  changes: string[]
}

// IMPORTANT: Update this on every user-visible change. Keep the latest at the top.
export const versionHistory: VersionEntry[] = [
  {
    version: '1.1.0',
    date: new Date().toISOString(),
    changes: [
      'Sales: Product search and Scan button placed side by side for faster workflow',
      'Sales: Phone suggestions dropdown and auto-fill based on Mobile/WhatsApp input',
      'UI: Removed duplicate product search input on Sales page',
    ],
  },
  // Example previous entry (adjust as needed)
  {
    version: '1.0.0',
    date: '2025-08-25T00:00:00.000Z',
    changes: ['Initial public release'],
  },
]

export const currentVersion = versionHistory[0]
