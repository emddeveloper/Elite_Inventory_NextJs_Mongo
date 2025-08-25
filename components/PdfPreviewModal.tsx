"use client"

import React, { useMemo, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon, PrinterIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { downloadPDF } from '@/lib/pdf-utils'

export default function PdfPreviewModal({ open, onClose, blob, filename, title = 'PDF Preview' }: {
  open: boolean
  onClose: () => void
  blob: Blob | null
  filename: string
  title?: string
}) {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : ''), [blob])
  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])

  const onPrint = () => {
    if (!url) return
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'; iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = '0'
    iframe.src = url
    document.body.appendChild(iframe)
    iframe.onload = () => { try { iframe.contentWindow?.print() } catch {} setTimeout(() => document.body.removeChild(iframe), 1000) }
  }

  const onDownload = () => {
    if (blob) downloadPDF(blob, filename)
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-5xl bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-[85vh]">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <Dialog.Title className="font-semibold text-gray-900">{title}</Dialog.Title>
            <button className="p-2 rounded hover:bg-gray-100" onClick={onClose} aria-label="Close">
              <XMarkIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <div className="flex gap-2 p-3 border-b">
            <button onClick={onPrint} className="btn-secondary inline-flex items-center gap-2"><PrinterIcon className="h-4 w-4" /> Print</button>
            <button onClick={onDownload} className="btn-secondary inline-flex items-center gap-2"><ArrowDownTrayIcon className="h-4 w-4" /> Download</button>
          </div>
          <div className="flex-1 bg-gray-50">
            {url ? <iframe src={url} className="w-full h-full" /> : <div className="h-full flex items-center justify-center text-gray-500">Generating...</div>}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
