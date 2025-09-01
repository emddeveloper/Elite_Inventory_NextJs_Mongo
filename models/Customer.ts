import mongoose from 'mongoose'

const CustomerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  address: {
    street: { type: String, required: [true, 'Street address is required'] },
    city: { type: String, required: [true, 'City is required'] },
    state: { type: String, required: [true, 'State is required'] },
    zipCode: { type: String, required: [true, 'ZIP code is required'] },
    country: { type: String, required: [true, 'Country is required'], default: 'USA' },
  },
  contactPerson: {
    name: { type: String, required: [true, 'Contact person name is required'] },
    email: { type: String, required: [true, 'Contact person email is required'] },
    phone: { type: String, required: [true, 'Contact person phone is required'] },
  },
  isActive: { type: Boolean, default: true },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

CustomerSchema.pre('save', function(next) {
  // @ts-ignore
  this.updatedAt = new Date()
  next()
})

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema)
