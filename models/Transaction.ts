import mongoose, { Schema, Document } from 'mongoose'

export interface ITransactionItem {
	productId: mongoose.Types.ObjectId
	sku: string
	name: string
	unitPrice: number
	quantity: number
	lineTotal: number
	gstPercent: number
}

export interface IClientInfo {
	name: string
	address: string
	email: string
	whatsapp: string
}

export interface ITransaction extends Document {
	invoiceNumber: string
	client: IClientInfo
	items: ITransactionItem[]
	subtotal: number
	tax: number
	discount: number
	discountPercent?: number
	total: number
	createdAt: Date
}

const TransactionItemSchema = new Schema<ITransactionItem>({
	productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
	sku: { type: String, required: true },
	name: { type: String, required: true },
	unitPrice: { type: Number, required: true },
	quantity: { type: Number, required: true, min: 1 },
	lineTotal: { type: Number, required: true },
	gstPercent: { type: Number, required: true, default: 0 },
}, { _id: false })

const ClientSchema = new Schema<IClientInfo>({
	name: { type: String, required: true },
	address: { type: String, required: true },
	email: { type: String, required: true },
	whatsapp: { type: String, required: true },
}, { _id: false })

const TransactionSchema = new Schema<ITransaction>({
	invoiceNumber: { type: String, required: true, unique: true },
	client: { type: ClientSchema, required: true },
	items: { type: [TransactionItemSchema], default: [], required: true },
	subtotal: { type: Number, required: true },
	tax: { type: Number, required: true, default: 0 },
	discount: { type: Number, required: true, default: 0 },
	discountPercent: { type: Number, required: false, default: 0 },
	total: { type: Number, required: true },
	createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema)


