import mongoose from 'mongoose'

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Other'],
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  gstPercent: {
    type: Number,
    required: true,
    default: 5,
    min: [0, 'GST percent cannot be negative'],
  },
  cost: {
    type: Number,
    required: [true, 'Cost is required'],
    min: [0, 'Cost cannot be negative'],
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0,
  },
  minQuantity: {
    type: Number,
    required: [true, 'Minimum quantity is required'],
    min: [0, 'Minimum quantity cannot be negative'],
    default: 10,
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
  },
  image: {
    type: String,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Update the updatedAt field before saving
ProductSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Virtual for profit margin
ProductSchema.virtual('profitMargin').get(function() {
  if (this.cost > 0) {
    return ((this.price - this.cost) / this.cost * 100).toFixed(2)
  }
  return 0
})

// Virtual for total value
ProductSchema.virtual('totalValue').get(function() {
  return this.price * this.quantity
})

// Virtual for stock status
ProductSchema.virtual('stockStatus').get(function() {
  if (this.quantity === 0) {
    return 'Out of Stock'
  } else if (this.quantity <= this.minQuantity) {
    return 'Low Stock'
  } else {
    return 'In Stock'
  }
})

// Ensure virtual fields are serialized
ProductSchema.set('toJSON', { virtuals: true })
ProductSchema.set('toObject', { virtuals: true })

export default mongoose.models.Product || mongoose.model('Product', ProductSchema)
