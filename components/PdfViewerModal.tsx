"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon, PrinterIcon, ArrowDownTrayIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
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
            <button onClick={shareWhatsApp} className="btn-secondary inline-flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                aria-hidden="true"
                className="h-4 w-4 text-[#25D366]"
              >
                <path fill="currentColor" d="M19.11 17.83c-.27-.14-1.62-.8-1.87-.9-.25-.09-.43-.14-.62.14-.18.27-.71.9-.87 1.08-.16.18-.32.2-.59.07-.27-.14-1.12-.41-2.13-1.31-.79-.7-1.32-1.57-1.47-1.84-.15-.27-.02-.42.11-.56.11-.11.27-.29.41-.43.14-.14.18-.25.27-.43.09-.18.05-.34-.02-.48-.07-.14-.62-1.49-.85-2.04-.22-.53-.45-.46-.62-.47-.16-.01-.34-.01-.52-.01s-.48.07-.73.34c-.25.27-.96.94-.96 2.3 0 1.36.99 2.67 1.13 2.85.14.18 1.96 3.1 4.75 4.35.66.29 1.17.46 1.57.59.66.21 1.26.18 1.73.11.53-.08 1.62-.66 1.85-1.3.23-.64.23-1.19.16-1.3-.07-.11-.25-.18-.52-.32z"/>
                <path fill="currentColor" d="M26.6 5.4A12.55 12.55 0 0 0 5.4 26.6L4 30l3.5-1.37A12.55 12.55 0 0 0 26.6 5.4m-1.44 19.76A10.51 10.51 0 1 1 7.04 7.04a10.51 10.51 0 0 1 18.12 18.12z"/>
              </svg>
              Share WhatsApp 👑
            </button>
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
