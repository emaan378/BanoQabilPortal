const mongoose = require('mongoose');

const studentFlagSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true, index: true },
    studentName: { type: String, required: true, trim: true },
    rollNumber: { type: String, trim: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
    batchName: { type: String, trim: true },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    status: { type: String, enum: ['open', 'resolved'], default: 'open', index: true },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentFlag', studentFlagSchema);
