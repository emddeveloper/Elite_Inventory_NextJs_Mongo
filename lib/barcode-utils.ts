"use client"

import JsBarcode from 'jsbarcode'

export type BarcodeFormat =
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

export async function generateBarcodeDataUrl(value: string, format: BarcodeFormat, width: number, height: number, displayValue: boolean): Promise<string> {
  const canvas = document.createElement('canvas')
  try {
    JsBarcode(canvas, value, {
      format,
      width,
      height,
      displayValue,
      margin: 4,
      fontSize: 12,
      background: '#ffffff',
      lineColor: '#111827',
    })
  } catch (e) {
    console.error('JsBarcode failed', e)
    throw e
  }
  return canvas.toDataURL('image/png')
}
