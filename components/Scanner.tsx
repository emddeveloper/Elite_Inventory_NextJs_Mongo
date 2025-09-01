"use client"

import React, { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, Result } from '@zxing/browser'

interface ScannerProps {
  onDetected: (code: string) => void
  onClose?: () => void
  constraints?: MediaTrackConstraints
  className?: string
  beep?: boolean
  closeOnDetect?: boolean
}

export default function Scanner({ onDetected, onClose, constraints, className, beep = true, closeOnDetect = true }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState(false)
  const handledRef = useRef(false)

  function vibrateSuccess() {
    try {
      if ('vibrate' in navigator) {
        // Short success haptic pattern
        navigator.vibrate([30, 40, 30])
      }
    } catch {}
  }

  function playSuccessTune() {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioCtx()
      // Simple 3-note ascending melody
      const notes = [
        { f: 784, d: 0.12 },   // G5
        { f: 988, d: 0.12 },   // B5
        { f: 1175, d: 0.16 },  // D6
      ]
      let t = ctx.currentTime
      for (const n of notes) {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = 'sine'
        o.frequency.setValueAtTime(n.f, t)
        g.gain.setValueAtTime(0.0001, t)
        g.gain.exponentialRampToValueAtTime(0.2, t + 0.02)
        g.gain.exponentialRampToValueAtTime(0.0001, t + n.d)
        o.connect(g)
        g.connect(ctx.destination)
        o.start(t)
        o.stop(t + n.d + 0.02)
        t += n.d + 0.02
      }
      // Attempt to release the context shortly after
      setTimeout(() => { try { ctx.close() } catch {} }, 600)
    } catch {}
  }

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
                if (handledRef.current) return
                handledRef.current = true
                try { console.debug('[Scanner] Detected code:', code) } catch {}
                // Haptics always on success; sound controlled by `beep` prop
                vibrateSuccess()
                if (beep) playSuccessTune()
                stopped = true
                try { codeReader.reset() } catch {}
                setActive(false)
                onDetected(code)
                // auto-close parent modal if requested
                if (closeOnDetect && onClose) {
                  try { onClose() } catch {}
                }
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
      handledRef.current = false
      try { codeReader.reset() } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={className}>
      <div className="relative bg-black rounded-md overflow-hidden">
        <video ref={videoRef} className="w-full h-64 object-cover" muted playsInline autoPlay />
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
