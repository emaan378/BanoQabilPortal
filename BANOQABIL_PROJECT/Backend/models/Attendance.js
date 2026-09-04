const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true, index: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true, index: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
    date: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['present', 'late', 'absent', 'excused'],
      required: true,
      default: 'present',
    },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

attendanceSchema.index({ student: 1, batch: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
