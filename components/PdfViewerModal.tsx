"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon, PrinterIcon, ArrowDownTrayIcon, PaperAirplaneIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import { downloadPDF } from '@/lib/pdf-utils'

export type ClientInfo = {
  name: string
  address: string
  email?: string
  whatsapp?: string
}

type Props = {
  open: boolean
  onClose: () => void
  pdfBlob: Blob | null
  filename: string
  client: ClientInfo
  onUpdateClient?: (next: ClientInfo) => void
}

export default function PdfViewerModal({ open, onClose, pdfBlob, filename, client, onUpdateClient }: Props) {
  const [localClient, setLocalClient] = useState<ClientInfo>(client)
  const [needWhatsapp, setNeedWhatsapp] = useState(false)
  const [needEmail, setNeedEmail] = useState(false)
  const objectUrl = useMemo(() => (pdfBlob ? URL.createObjectURL(pdfBlob) : ''), [pdfBlob])
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    setLocalClient(client)
  }, [client])

  useEffect(() => {
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [objectUrl])

  const printPdf = () => {
    if (!objectUrl) return
    // Try printing via hidden iframe
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    iframe.src = objectUrl
    document.body.appendChild(iframe)
    iframe.onload = () => {
      try { iframe.contentWindow?.print() } catch {}
      setTimeout(() => document.body.removeChild(iframe), 1000)
    }
  }

  const savePdf = () => {
    if (!pdfBlob) return
    downloadPDF(pdfBlob, filename)
  }

  const shareViaNavigator = async (title: string, text: string) => {
    if (!pdfBlob) return false
    const file = new File([pdfBlob], filename, { type: 'application/pdf' })
    try {
      // Feature detection for Web Share API Level 2 (with files)
      // Use typeof checks to satisfy TS/ESLint that this may not exist at runtime
      if (typeof (navigator as any).share === 'function' && (navigator as any).canShare?.({ files: [file] })) {
        await (navigator as any).share({ title, text, files: [file] })
        return true
      }
      if (typeof (navigator as any).share === 'function') {
        await (navigator as any).share({ title, text, url: objectUrl })
        return true
      }
    } catch (e) {
      console.warn('navigator.share failed', e)
    }
    return false
  }

  const shareWhatsApp = async () => {
    if (!localClient.whatsapp) {
      setNeedWhatsapp(true)
      return
    }
    // Normalize phone to digits only, apply default country code +91 when only 10 digits.
    let digits = localClient.whatsapp.replace(/\D/g, '')
    if (digits.length < 10) {
      // Not enough digits to be a valid mobile number; prompt for input
      setNeedWhatsapp(true)
      return
    }
    if (digits.length === 10) {
      digits = `91${digits}`
    }
    const message = `Hello ${localClient.name},\nPlease find your invoice.`
    const encoded = encodeURIComponent(message)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Windows Phone/i.test(navigator.userAgent)
    const waUrl = `https://wa.me/${digits}?text=${encoded}`
    if (isMobile) {
      // On mobile, redirecting to wa.me should hand off to the app
      window.location.href = waUrl
    } else {
      // On desktop, wa.me redirects to WhatsApp Web with the chat preselected
      window.open(waUrl, '_blank')
    }
  }

  const shareEmail = async () => {
    if (!localClient.email) {
      setNeedEmail(true)
      return
    }
    const shared = await shareViaNavigator('Invoice', `Invoice for ${localClient.name}`)
    if (shared) return
    // Fallback: mailto with body note (attachments not supported via mailto reliably)
    const subject = encodeURIComponent(`Invoice ${filename.replace(/\.pdf$/i, '')}`)
    const body = encodeURIComponent(`Hello ${localClient.name},\n\nPlease find your invoice attached. If the file did not attach, it may be due to browser limitations. You can also download it directly from the app.\n`)
    window.location.href = `mailto:${localClient.email}?subject=${subject}&body=${body}`
  }

  const persistClientUpdates = () => {
    if (onUpdateClient) onUpdateClient(localClient)
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-5xl bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-[85vh]">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <Dialog.Title className="font-semibold text-gray-900">Invoice Preview</Dialog.Title>
            <button className="p-2 rounded hover:bg-gray-100" onClick={onClose} aria-label="Close">
              <XMarkIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 p-3 border-b">
            <button onClick={printPdf} className="btn-secondary inline-flex items-center gap-2"><PrinterIcon className="h-4 w-4" /> Print</button>
            <button onClick={savePdf} className="btn-secondary inline-flex items-center gap-2"><ArrowDownTrayIcon className="h-4 w-4" /> Save</button>
            <button onClick={shareWhatsApp} className="btn-secondary inline-flex items-center gap-2"><PaperAirplaneIcon className="h-4 w-4" /> Share WhatsApp</button>
            <button onClick={shareEmail} className="btn-secondary inline-flex items-center gap-2"><EnvelopeIcon className="h-4 w-4" /> Share Email</button>
          </div>

          {/* Viewer */}
          <div className="flex-1 overflow-hidden bg-gray-50">
            {objectUrl ? (
              <iframe ref={iframeRef} src={objectUrl} className="w-full h-full" title="Invoice PDF" />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">Generating preview...</div>
            )}
          </div>

          {/* Smart contact prompts */}
          {(needWhatsapp || needEmail) && (
            <div className="border-t p-4 bg-gray-50">
              <div className="mb-2 text-sm text-gray-700 font-medium">
                {needWhatsapp && !localClient.whatsapp ? 'Enter WhatsApp number to share:' : null}
                {needEmail && !localClient.email ? 'Enter Email to share:' : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {needWhatsapp && (
                  <input
                    className="input-field w-56"
                    placeholder="WhatsApp number (default +91)"
                    value={localClient.whatsapp || ''}
                    onChange={(e) => setLocalClient({ ...localClient, whatsapp: e.target.value })}
                  />
                )}
                {needEmail && (
                  <input
                    className="input-field w-64"
                    placeholder="Email address"
                    type="email"
                    value={localClient.email || ''}
                    onChange={(e) => setLocalClient({ ...localClient, email: e.target.value })}
                  />
                )}
                <div className="ml-auto flex gap-2">
                  <button
                    className="btn"
                    onClick={() => {
                      setNeedWhatsapp(false)
                      setNeedEmail(false)
                    }}
                  >Cancel</button>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      persistClientUpdates()
                      const w = needWhatsapp
                      const m = needEmail
                      setNeedWhatsapp(false)
                      setNeedEmail(false)
                      if (w) shareWhatsApp()
                      if (m) shareEmail()
                    }}
                  >Continue</button>
                </div>
              </div>
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
