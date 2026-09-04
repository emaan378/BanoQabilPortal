const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true, index: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true, index: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
    assessment: { type: String, required: true, trim: true, maxlength: 100 },
    score: { type: Number, required: true, min: 0 },
    maxScore: { type: Number, required: true, min: 1, default: 100 },
    feedback: { type: String, trim: true, maxlength: 2000 },
    recordedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

gradeSchema.index({ student: 1, batch: 1, assessment: 1 }, { unique: true });

module.exports = mongoose.model('Grade', gradeSchema);
