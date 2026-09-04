const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true, index: true },
    fileName: { type: String, trim: true },
    originalName: { type: String, trim: true },
    fileUrl: { type: String, trim: true },
    link: { type: String, trim: true },
    note: { type: String, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ['submitted', 'late', 'graded'],
      default: 'submitted',
    },
    score: { type: Number, min: 0, max: 1000 },
    feedback: { type: String, trim: true, maxlength: 2000 },
    submittedAt: { type: Date, default: Date.now },
    gradedAt: Date,
  },
  { timestamps: true }
);

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('AssignmentSubmission', submissionSchema);
