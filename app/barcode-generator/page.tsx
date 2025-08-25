'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { generateBarcodeDataUrl, BarcodeFormat } from '@/lib/barcode-utils'
import { pdf } from '@react-pdf/renderer'
import BarcodeSheetPDF, { SheetItem } from '@/components/BarcodeSheetPDF'
import PdfPreviewModal from '@/components/PdfPreviewModal'
import toast from 'react-hot-toast'

const sizePresets = {
  small: { w: 140, h: 90, barW: 1, barH: 48 },
  medium: { w: 180, h: 120, barW: 2, barH: 64 },
  large: { w: 240, h: 160, barW: 3, barH: 80 },
}

type SizeKey = keyof typeof sizePresets

export default function BarcodeGeneratorPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Form state
  const [count, setCount] = useState<number>(100)
  const [repeat, setRepeat] = useState<number>(10)
  const [format, setFormat] = useState<BarcodeFormat>('CODE128')
  const [prefix, setPrefix] = useState<string>('BC')
  const [size, setSize] = useState<SizeKey>('medium')
  const [showText, setShowText] = useState<boolean>(true)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  // Preview modal
  const [openPreview, setOpenPreview] = useState(false)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [filename, setFilename] = useState<string>('')

  const uniqueCount = useMemo(() => Math.ceil((count || 0) / (repeat || 1)), [count, repeat])

  // Sync content padding with sidebar collapsed state
  useEffect(() => {
    try {
      const v = localStorage.getItem('sidebar_collapsed')
      if (v != null) setSidebarCollapsed(v === '1')
    } catch {}
    function onCollapseChanged(e: any) {
      try {
        if (e && e.detail && typeof e.detail.collapsed === 'boolean') {
          setSidebarCollapsed(e.detail.collapsed)
        }
      } catch {}
    }
    window.addEventListener('sidebar:collapse-changed', onCollapseChanged as EventListener)
    return () => {
      window.removeEventListener('sidebar:collapse-changed', onCollapseChanged as EventListener)
    }
  }, [])

  const generateValues = () => {
    const values: string[] = []
    const ts = new Date()
    const y = ts.getFullYear()
    const m = String(ts.getMonth() + 1).padStart(2, '0')
    const d = String(ts.getDate()).padStart(2, '0')
    const base = `${prefix}-${y}${m}${d}`
    for (let i = 1; i <= uniqueCount; i++) {
      values.push(`${base}-${String(i).padStart(4, '0')}`)
    }
    return values
  }

  const handleGenerate = async () => {
    try {
      const values = generateValues()
      const preset = sizePresets[size]
      const items: SheetItem[] = []
      for (const v of values) {
        const dataUrl = await generateBarcodeDataUrl(v, format, preset.barW, preset.barH, showText)
        for (let i = 0; i < repeat; i++) {
          items.push({ src: dataUrl, label: showText ? v : undefined, w: preset.w, h: preset.h })
        }
      }
      const doc = <BarcodeSheetPDF items={items} orientation={orientation} />
      const inst = pdf(doc)
      const out = await inst.toBlob()
      const stamp = new Date().toISOString().replace(/[:.]/g, '-')
      setFilename(`barcodes_${stamp}.pdf`)
      setBlob(out)
      setOpenPreview(true)
    } catch (e) {
      console.error(e)
      toast.error('Failed to generate barcodes')
    }
  }

  return (
    <div>
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className={sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'}>
        <Header setSidebarOpen={setSidebarOpen} />
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            <h1 className="text-lg font-semibold text-gray-900 mb-4">Barcode Generator</h1>
            <div className="bg-white rounded-xl shadow p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Barcode Configuration</h3>
                  <div className="space-y-3">
                    <label className="block text-sm">Number of barcodes needed
                      <input type="number" min={1} value={count} onChange={(e) => setCount(Number(e.target.value||'0'))} className="input-field mt-1 w-full" />
                    </label>
                    <label className="block text-sm">Repeat count for each barcode
                      <input type="number" min={1} value={repeat} onChange={(e) => setRepeat(Number(e.target.value||'0'))} className="input-field mt-1 w-full" />
                    </label>
                    <label className="block text-sm">Barcode type
                      <select value={format} onChange={(e) => setFormat(e.target.value as BarcodeFormat)} className="input-field mt-1 w-full">
                        <option value="CODE128">Code 128</option>
                        <option value="EAN13">EAN-13</option>
                        <option value="codabar">Codabar</option>
                      </select>
                    </label>
                    <label className="block text-sm">Barcode value prefix (optional)
                      <input type="text" value={prefix} onChange={(e) => setPrefix(e.target.value)} className="input-field mt-1 w-full" />
                    </label>
                  </div>
                </section>
                <section>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Display Settings</h3>
                  <div className="space-y-3">
                    <label className="block text-sm">Barcode size
                      <select value={size} onChange={(e) => setSize(e.target.value as SizeKey)} className="input-field mt-1 w-full">
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </select>
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={showText} onChange={(e) => setShowText(e.target.checked)} />
                      Show barcode value text
                    </label>
                    <label className="block text-sm">Page layout
                      <select value={orientation} onChange={(e) => setOrientation(e.target.value as any)} className="input-field mt-1 w-full">
                        <option value="portrait">Portrait</option>
                        <option value="landscape">Landscape</option>
                      </select>
                    </label>
                  </div>
                </section>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">Unique barcodes: <span className="font-medium">{uniqueCount}</span> × Repeat <span className="font-medium">{repeat}</span> = Total <span className="font-semibold">{uniqueCount * repeat}</span></div>
                <button onClick={handleGenerate} className="btn-primary">Generate & Preview</button>
              </div>
            </div>
          </div>
        </main>
      </div>
      <PdfPreviewModal open={openPreview} onClose={() => setOpenPreview(false)} blob={blob} filename={filename} title="Barcode PDF Preview" />
    </div>
  )
}
