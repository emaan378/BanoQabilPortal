const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema(
  {
    trackingId: {
      type: String,
      unique: true,
      index: true,
    },
    registration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
      default: null,
    },
    rollNumber: {
      type: String,
      trim: true,
    },
    studentName: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be greater than 0'],
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid',
    },
    paidAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

voucherSchema.index({ status: 1 });
voucherSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Voucher', voucherSchema);
