import React from 'react'
import { Document, Page, Image, StyleSheet, View, Text } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 18, // ~0.25in
  },
  grid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 8,
    marginTop: 2,
  }
})

export type SheetItem = { src: string; label?: string; w: number; h: number }

export default function BarcodeSheetPDF({
  items,
  orientation,
}: {
  items: SheetItem[]
  orientation: 'portrait' | 'landscape'
}) {
  // A4 page: 595x842 pt (portrait). We'll let flex-wrap handle flow.
  return (
    <Document>
      <Page size="A4" orientation={orientation} style={styles.page}>
        <View style={styles.grid}>
          {items.map((it, idx) => (
            <View key={idx} style={{ ...styles.item, width: it.w, height: it.h }}>
              <Image src={it.src} style={{ width: it.w - 12, height: it.h - 18 }} />
              {it.label ? <Text style={styles.label}>{it.label}</Text> : null}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}
