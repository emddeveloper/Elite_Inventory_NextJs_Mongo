import mongoose, { Schema, Document } from 'mongoose'

export type LedgerType = 'IN' | 'OUT' | 'ADJUSTMENT'

export interface IInventoryLedger extends Document {
  productId: mongoose.Types.ObjectId
  sku: string
  productName: string
  type: LedgerType
  quantity: number
  unitCost?: number
  unitPrice?: number
  balanceAfter?: number
  reference?: string
  source?: 'purchase' | 'sale' | 'adjustment' | 'transfer' | 'opening'
  note?: string
  username?: string
  userRole?: string
  createdAt: Date
}

const InventoryLedgerSchema = new Schema<IInventoryLedger>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  sku: { type: String, required: true, index: true },
  productName: { type: String, required: true },
  type: { type: String, enum: ['IN', 'OUT', 'ADJUSTMENT'], required: true, index: true },
  quantity: { type: Number, required: true },
  unitCost: { type: Number },
  unitPrice: { type: Number },
  balanceAfter: { type: Number },
  reference: { type: String },
  source: { type: String, enum: ['purchase', 'sale', 'adjustment', 'transfer', 'opening'], default: 'adjustment' },
  note: { type: String },
  username: { type: String },
  userRole: { type: String },
  createdAt: { type: Date, default: Date.now, index: true },
})

InventoryLedgerSchema.index({ sku: 1, createdAt: -1 })

export default mongoose.models.InventoryLedger || mongoose.model<IInventoryLedger>('InventoryLedger', InventoryLedgerSchema)
