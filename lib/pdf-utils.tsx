import React from 'react'
import { pdf } from '@react-pdf/renderer'
import InvoicePDF from '@/components/InvoicePDF'
import companyConfig from '@/company.json'

interface InvoiceItem {
  name: string
  sku?: string
  hsn?: string
  quantity: number
  unit?: string
  unitPrice: number
  lineTotal: number
  gstPercent?: number
}

interface Client {
  name: string
  address: string
  email?: string
  whatsapp?: string
  pin?: string
  gstin?: string
}

interface Company {
  name: string
  address: string
  phone: string
  email: string
  website: string
  gstin: string
  pan: string
  bank?: {
    accountHolder: string
    accountNumber: string
    bankName: string
    branch: string
    ifsc: string
    upi: string
  }
}

interface GeneratePDFOptions {
  invoiceNumber: string
  invoiceDate: string
  transactionId?: string
  client: Client
  items: InvoiceItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  company: Company
  shipTo?: {
    name: string
    address: string
    pin: string
  }
}

export const generateInvoicePDF = async (options: GeneratePDFOptions): Promise<Blob> => {
  const doc = <InvoicePDF {...options} />
  const asPdf = pdf(doc)
  const blob = await asPdf.toBlob()
  return blob
}

export const downloadPDF = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Company data sourced from configuration (company.json). In production, consider fetching from an API.
export const getDefaultCompany = (): Company => (companyConfig as Company)
