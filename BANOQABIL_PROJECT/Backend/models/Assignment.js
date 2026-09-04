const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true, index: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
    batchName: { type: String, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    module: { type: String, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 2000 },
    dueAt: { type: Date, required: true, index: true },
    totalMarks: { type: Number, min: 1, max: 1000, default: 100 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
