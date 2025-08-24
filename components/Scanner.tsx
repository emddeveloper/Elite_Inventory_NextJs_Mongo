"use client"

import React, { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, Result } from '@zxing/browser'

interface ScannerProps {
  onDetected: (code: string) => void
  onClose?: () => void
  constraints?: MediaTrackConstraints
  className?: string
}

export default function Scanner({ onDetected, onClose, constraints, className }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader()
    let stopped = false

    async function start() {
      if (!videoRef.current) return
      setError(null)
      setActive(true)
      try {
        await codeReader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result: Result | undefined, err: unknown) => {
            if (stopped) return
            if (result) {
              const text = result.getText()
              // Basic cleanup
              const code = text.trim()
              if (code) {
                stopped = true
                codeReader.reset()
                setActive(false)
                onDetected(code)
              }
            }
          }
        )
      } catch (e: any) {
        console.error('Scanner start error', e)
        setError(e?.message || 'Camera error')
        setActive(false)
      }
    }

    start()

    return () => {
      stopped = true
      try { codeReader.reset() } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={className}>
      <div className="relative bg-black rounded-md overflow-hidden">
        <video ref={videoRef} className="w-full h-64 object-cover" muted playsInline />
        <div className="absolute inset-0 pointer-events-none border-2 border-white/50 m-6 rounded" />
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex gap-2">
        {onClose && (
          <button className="btn-secondary" onClick={onClose}>Close</button>
        )}
        {!active && !error && (
          <p className="text-sm text-gray-500">Align the barcode within the frame</p>
        )}
      </div>
    </div>
  )
}
