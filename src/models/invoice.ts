
import mongoose, { Schema, Document, models, model } from 'mongoose';
import type { InvoiceFormData } from '@/components/invoice-form'; // Import the form data type

// Define allowed status values for the database schema
const allowedStatuses = ["Pending", "In Process", "Hold", "Cancelled", "Completed"];

// Define the schema for Invoice Items consistent with the form
const InvoiceItemSchema = new Schema({
  description: { type: String, required: [true, 'Item description is required.'] },
  quantity: { type: Number, required: [true, 'Item quantity is required.'], min: [1, 'Quantity must be at least 1.'] },
  price: { type: Number, required: [true, 'Item price is required.'], min: [0.01, 'Price must be positive.'] },
}, { _id: false }); // Don't create separate IDs for subdocuments unless needed

// Define the main Invoice schema consistent with the form
const InvoiceSchema = new Schema<InvoiceFormData & Document>({
  customerName: { type: String, required: [true, 'Customer name is required.'], trim: true },
  customerEmail: { type: String, trim: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.'] },
  customerAddress: { type: String, trim: true },
  invoiceNumber: { type: String, required: [true, 'Invoice number is required.'], unique: true, trim: true, index: true }, // Ensure uniqueness and index for faster lookups
  invoiceDate: { type: Date, required: [true, 'Invoice date is required.'] }, // Use Date type for proper sorting/querying
  dueDate: { type: Date, required: [true, 'Due date is required.'] }, // Use Date type
  items: {
    type: [InvoiceItemSchema],
    required: true,
    validate: [ (v: any[]) => Array.isArray(v) && v.length > 0, 'At least one invoice item is required.']
  },
  notes: { type: String, trim: true },
  paidAmount: { type: Number, default: 0, min: [0, 'Paid amount cannot be negative.'] },
  status: {
    type: String,
    enum: {
        values: allowedStatuses,
        message: 'Invalid status value: {VALUE}. Allowed values are: ' + allowedStatuses.join(', ')
    },
    required: [true, 'Invoice status is required.'],
    default: 'Pending' // Default status
  },
  // Optional: Add timestamps for creation and updates
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Middleware to update `updatedAt` field on save
InvoiceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Define derived 'totalAmount' and 'totalDue' properties (virtuals) - These are calculated, not stored in DB
InvoiceSchema.virtual('totalAmount').get(function(this: InvoiceFormData) {
  return this.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0);
});

InvoiceSchema.virtual('totalDue').get(function(this: InvoiceFormData) {
  const totalAmount = this.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0);
  return totalAmount - (this.paidAmount || 0);
});

// Ensure virtuals are included when converting document to JSON or Object
InvoiceSchema.set('toJSON', { virtuals: true });
InvoiceSchema.set('toObject', { virtuals: true });


// Check if the model already exists before defining it
// Use 'mongoose.models.Invoice' if it exists, otherwise create it with 'mongoose.model'
const Invoice = models.Invoice || model<InvoiceFormData & Document>('Invoice', InvoiceSchema);

export default Invoice;

