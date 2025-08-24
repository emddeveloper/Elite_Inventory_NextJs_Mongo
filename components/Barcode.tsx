"use client"

import React, { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'

interface BarcodeProps {
  value: string
  format?:
    | 'CODE128'
    | 'CODE128A'
    | 'CODE128B'
    | 'CODE128C'
    | 'EAN13'
    | 'EAN8'
    | 'UPC'
    | 'ITF14'
    | 'MSI'
    | 'MSI10'
    | 'MSI11'
    | 'MSI1010'
    | 'MSI1110'
    | 'pharmacode'
    | 'codabar'
  width?: number
  height?: number
  displayValue?: boolean
  className?: string
}

export default function Barcode({
  value,
  format = 'CODE128',
  width = 2,
  height = 80,
  displayValue = true,
  className,
}: BarcodeProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    if (!value || !svgRef.current) return
    try {
      JsBarcode(svgRef.current, value, {
        format,
        width,
        height,
        displayValue,
        margin: 10,
        fontSize: 14,
        background: '#ffffff',
        lineColor: '#111827',
      })
    } catch (e) {
      console.error('Failed to render barcode', e)
    }
  }, [value, format, width, height, displayValue])

  const handleDownload = () => {
    if (!svgRef.current) return
    const serializer = new XMLSerializer()
    const source = serializer.serializeToString(svgRef.current)
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `${value}-barcode.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    if (!svgRef.current) return
    const serializer = new XMLSerializer()
    const source = serializer.serializeToString(svgRef.current)
    const printWindow = window.open('', '_blank', 'width=600,height=400')
    if (!printWindow) return
    printWindow.document.write(`<!doctype html><html><head><title>${value}</title></head><body style="display:flex;align-items:center;justify-content:center;padding:20px;font-family:system-ui,-apple-system,Segoe UI,Roboto;">${source}</body></html>`) // eslint-disable-line
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <div className={className}>
      <svg ref={svgRef} />
      <div className="mt-3 flex gap-2">
        <button onClick={handlePrint} className="btn-secondary">Print</button>
        <button onClick={handleDownload} className="btn-secondary">Download</button>
      </div>
    </div>
  )
}
