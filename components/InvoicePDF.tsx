import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// Define styles that match the current HTML design
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 12,
    paddingTop: 20,
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 20,
    color: '#222',
  },
  container: {
    border: '1px solid #ddd',
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  companyBlock: {
    width: '58%',
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  invoiceBlock: {
    width: '38%',
    textAlign: 'right',
  },
  invoiceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  invoiceMeta: {
    fontSize: 11,
    marginBottom: 2,
  },
  section: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  addressBox: {
    flex: 1,
    border: '1px solid #ddd',
    padding: 8,
  },
  addressTitle: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  addressText: {
    fontSize: 11,
    marginBottom: 2,
  },
  table: {
    marginTop: 12,
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderBottom: '1px solid #ddd',
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #ddd',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  col1: { width: '8%', textAlign: 'center' },
  col2: { width: '30%' },
  col3: { width: '12%', textAlign: 'center' },
  col4: { width: '12%', textAlign: 'center' },
  col5: { width: '15%', textAlign: 'right' },
  col6: { width: '10%', textAlign: 'center' },
  col7: { width: '13%', textAlign: 'right' },
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  totalsTable: {
    width: 320,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalRowBold: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    fontWeight: 'bold',
    borderTop: '1px solid #ddd',
  },
  taxTable: {
    marginTop: 18,
    marginBottom: 18,
  },
  taxTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderBottom: '1px solid #ddd',
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontWeight: 'bold',
  },
  taxTableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #ddd',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  taxCol1: { width: '14%', textAlign: 'center' },
  taxCol2: { width: '16%', textAlign: 'right' },
  taxCol3: { width: '12%', textAlign: 'center' },
  taxCol4: { width: '16%', textAlign: 'right' },
  taxCol5: { width: '12%', textAlign: 'center' },
  taxCol6: { width: '16%', textAlign: 'right' },
  taxCol7: { width: '14%', textAlign: 'right' },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  footerBox: {
    flex: 1,
    border: '1px solid #ddd',
    padding: 8,
  },
  footerTitle: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  footerText: {
    fontSize: 11,
    marginBottom: 2,
  },
  signature: {
    marginTop: 18,
    textAlign: 'right',
    fontSize: 11,
  },
})

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

interface InvoicePDFProps {
  invoiceNumber: string
  invoiceDate: string
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

// Helper function to convert number to words
const amountInWords = (amount: number): string => {
  if (!Number.isFinite(amount)) return 'Zero'
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
  
  function convert(n: number): string {
    if (n < 20) return ones[n]
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' ' + ones[n%10] : '')
    if (n < 1000) return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' ' + convert(n%100) : '')
    if (n < 1000000) return convert(Math.floor(n/1000)) + ' Thousand' + (n%1000 ? ' ' + convert(n%1000) : '')
    return convert(Math.floor(n/1000000)) + ' Million' + (n%1000000 ? ' ' + convert(n%1000000) : '')
  }
  
  const whole = Math.floor(Math.abs(amount))
  const cents = Math.round((Math.abs(amount) - whole) * 100)
  return `${convert(whole) || 'Zero'}${cents ? ' and ' + cents + '/100' : ''} ${amount < 0 ? 'Minus' : ''}`.trim()
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({
  invoiceNumber,
  invoiceDate,
  client,
  items,
  subtotal,
  tax,
  discount,
  total,
  company,
  shipTo
}) => {
  // Default ship to if not provided
  const defaultShipTo = {
    name: client.name,
    address: client.address,
    pin: client.pin || '110005'
  }

  const actualShipTo = shipTo || defaultShipTo

  // Calculate tax summary
  const taxSummary = new Map<string, {
    hsn: string
    taxable: number
    rate: number
    cgst: number
    sgst: number
    totalTax: number
  }>()

  items.forEach(item => {
    const hsn = item.hsn || '-'
    const gstPercent = item.gstPercent || 5
    const taxableAmount = item.lineTotal / (1 + gstPercent / 100)
    const totalTaxAmount = item.lineTotal - taxableAmount
    const cgstAmount = totalTaxAmount / 2
    const sgstAmount = totalTaxAmount / 2

    const key = `${hsn}|${gstPercent}`
    const existing = taxSummary.get(key)

    if (existing) {
      existing.taxable += taxableAmount
      existing.cgst += cgstAmount
      existing.sgst += sgstAmount
      existing.totalTax += totalTaxAmount
    } else {
      taxSummary.set(key, {
        hsn,
        taxable: taxableAmount,
        rate: gstPercent,
        cgst: cgstAmount,
        sgst: sgstAmount,
        totalTax: totalTaxAmount
      })
    }
  })

  const taxSummaryArray = Array.from(taxSummary.values())
  const totalTaxable = taxSummaryArray.reduce((sum, item) => sum + item.taxable, 0)
  const totalCgst = taxSummaryArray.reduce((sum, item) => sum + item.cgst, 0)
  const totalSgst = taxSummaryArray.reduce((sum, item) => sum + item.sgst, 0)
  const totalGst = taxSummaryArray.reduce((sum, item) => sum + item.totalTax, 0)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.companyBlock}>
              <Text style={styles.companyName}>{company.name}</Text>
              <Text style={styles.companyDetails}>{company.address}</Text>
              <Text style={styles.companyDetails}>
                Phone: {company.phone} • Email: {company.email} • Website: {company.website}
              </Text>
              <Text style={styles.companyDetails}>
                GSTIN: {company.gstin} • PAN Number: {company.pan}
              </Text>
            </View>
            <View style={styles.invoiceBlock}>
              <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
              <Text style={styles.invoiceMeta}>Invoice No: {invoiceNumber}</Text>
              <Text style={styles.invoiceMeta}>Invoice Date: {invoiceDate}</Text>
              <Text style={styles.invoiceMeta}>Email Id: {company.email}</Text>
              <Text style={styles.invoiceMeta}>Website: {company.website}</Text>
            </View>
          </View>

          {/* Bill To / Ship To */}
          <View style={styles.section}>
            <View style={styles.addressBox}>
              <Text style={styles.addressTitle}>BILL TO</Text>
              <Text style={styles.addressText}>{client.name}</Text>
              <Text style={styles.addressText}>{client.address}</Text>
              <Text style={styles.addressText}>Pin: {client.pin || '110005'}</Text>
              <Text style={styles.addressText}>Phone: {client.whatsapp || company.phone}</Text>
              <Text style={styles.addressText}>GSTIN: {client.gstin || '08HULMPB2839A1AB'}</Text>
            </View>
            <View style={styles.addressBox}>
              <Text style={styles.addressTitle}>SHIP TO</Text>
              <Text style={styles.addressText}>{actualShipTo.name}</Text>
              <Text style={styles.addressText}>{actualShipTo.address}</Text>
              <Text style={styles.addressText}>Pin: {actualShipTo.pin}</Text>
            </View>
          </View>

          {/* Items Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.col1}>S. No.</Text>
              <Text style={styles.col2}>Item</Text>
              <Text style={styles.col3}>HSN</Text>
              <Text style={styles.col4}>Quantity</Text>
              <Text style={styles.col5}>Rate</Text>
              <Text style={styles.col6}>GST %</Text>
              <Text style={styles.col7}>Amount</Text>
            </View>
            {items.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.col1}>{index + 1}</Text>
                <Text style={styles.col2}>{item.name}</Text>
                <Text style={styles.col3}>{item.hsn || ''}</Text>
                <Text style={styles.col4}>{item.quantity} {item.unit || ''}</Text>
                <Text style={styles.col5}>${item.unitPrice.toFixed(2)}</Text>
                <Text style={styles.col6}>{item.gstPercent || 5}%</Text>
                <Text style={styles.col7}>${item.lineTotal.toFixed(2)}</Text>
              </View>
            ))}
          </View>

          {/* Totals */}
          <View style={styles.totalsContainer}>
            <View style={styles.totalsTable}>
              <View style={styles.totalRow}>
                <Text>Subtotal:</Text>
                <Text>${subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text>Tax:</Text>
                <Text>${tax.toFixed(2)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text>Discount:</Text>
                <Text>-${discount.toFixed(2)}</Text>
              </View>
              <View style={styles.totalRowBold}>
                <Text>TOTAL</Text>
                <Text>${total.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Tax Summary Table */}
          <View style={styles.taxTable}>
            <View style={styles.taxTableHeader}>
              <Text style={styles.taxCol1}>HSN</Text>
              <Text style={styles.taxCol2}>Taxable Amount</Text>
              <Text style={styles.taxCol3}>CGST Rate</Text>
              <Text style={styles.taxCol4}>CGST Amount</Text>
              <Text style={styles.taxCol5}>SGST Rate</Text>
              <Text style={styles.taxCol6}>SGST Amount</Text>
              <Text style={styles.taxCol7}>Total GST Amount</Text>
            </View>
            {taxSummaryArray.map((taxItem, index) => (
              <View key={index} style={styles.taxTableRow}>
                <Text style={styles.taxCol1}>{taxItem.hsn}</Text>
                <Text style={styles.taxCol2}>${taxItem.taxable.toFixed(2)}</Text>
                <Text style={styles.taxCol3}>{(taxItem.rate / 2).toFixed(2)}%</Text>
                <Text style={styles.taxCol4}>${taxItem.cgst.toFixed(2)}</Text>
                <Text style={styles.taxCol5}>{(taxItem.rate / 2).toFixed(2)}%</Text>
                <Text style={styles.taxCol6}>${taxItem.sgst.toFixed(2)}</Text>
                <Text style={styles.taxCol7}>${taxItem.totalTax.toFixed(2)}</Text>
              </View>
            ))}
            <View style={[styles.taxTableRow, { fontWeight: 'bold' }]}>
              <Text style={styles.taxCol1}>Total</Text>
              <Text style={styles.taxCol2}>${totalTaxable.toFixed(2)}</Text>
              <Text style={styles.taxCol3}></Text>
              <Text style={styles.taxCol4}>${totalCgst.toFixed(2)}</Text>
              <Text style={styles.taxCol5}></Text>
              <Text style={styles.taxCol6}>${totalSgst.toFixed(2)}</Text>
              <Text style={styles.taxCol7}>${totalGst.toFixed(2)}</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerBox}>
              <Text style={styles.footerTitle}>Remark</Text>
              <Text style={styles.footerText}>This is remark</Text>
              <Text style={styles.footerText}>
                Terms & Conditions{'\n'}
                1. Customer will pay the GST{'\n'}
                2. Customer will pay the Delivery charges{'\n'}
                3. Pay due amount within 15 days
              </Text>
            </View>
            <View style={styles.footerBox}>
              <Text style={styles.footerTitle}>Bank Details</Text>
              <Text style={styles.footerText}>
                Account holder: {company.bank?.accountHolder || ''}{'\n'}
                Account number: {company.bank?.accountNumber || ''}{'\n'}
                Bank: {company.bank?.bankName || ''} Branch: {company.bank?.branch || ''}{'\n'}
                IFSC code: {company.bank?.ifsc || ''} UPI ID: {company.bank?.upi || ''}
              </Text>
            </View>
          </View>

          {/* Signature */}
          <Text style={styles.signature}>
            Authorised Signatory For {company.name}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

export default InvoicePDF
