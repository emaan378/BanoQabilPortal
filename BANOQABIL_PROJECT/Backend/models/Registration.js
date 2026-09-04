const mongoose = require('mongoose');

const testSchema = new mongoose.Schema(
  {
    scheduledAt: Date,
    venue: { type: String, trim: true },
    score: { type: Number, min: 0, max: 100 },
    result: {
      type: String,
      enum: ['Awaiting', 'Passed', 'Failed'],
      default: 'Awaiting',
    },
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    scheduledAt: Date,
    interviewer: { type: String, trim: true },
    remarks: { type: String, trim: true },
    decision: {
      type: String,
      enum: ['Awaiting', 'Passed', 'Failed'],
      default: 'Awaiting',
    },
  },
  { _id: false }
);

const registrationSchema = new mongoose.Schema(
  {
    registrationId: {
      type: String,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
    },
    cnic: {
      type: String,
      required: [true, 'CNIC is required'],
      trim: true,
      match: [/^\d{5}-\d{7}-\d$/, 'CNIC must be in 00000-0000000-0 format'],
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    address: {
      type: String,
      trim: true,
    },
    guardianName: {
      type: String,
      trim: true,
    },
    guardianContact: {
      type: String,
      trim: true,
    },
    course: {
      type: String,
      required: [true, 'Course is required'],
      trim: true,
    },
    campus: {
      type: String,
      default: 'Faisalabad Campus',
      trim: true,
    },
    stage: {
      type: String,
      enum: ['registered', 'test-scheduled', 'interview-passed', 'fee-verified', 'enrolled'],
      default: 'registered',
      index: true,
    },
    batch: {
      type: String,
      trim: true,
    },
    batchAllocationStatus: {
      type: String,
      enum: ['pending', 'allocated'],
      default: 'pending',
    },
    feeStatus: {
      type: String,
      enum: ['unpaid', 'partial', 'paid'],
      default: 'unpaid',
    },
    feeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    feePaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    rollNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    test: {
      type: testSchema,
      default: () => ({ result: 'Awaiting' }),
    },
    interview: {
      type: interviewSchema,
      default: () => ({ decision: 'Awaiting' }),
    },
  },
  { timestamps: true }
);

registrationSchema.index({ name: 1 });
registrationSchema.index({ cnic: 1 });
registrationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Registration', registrationSchema);
