const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    teacherId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Teacher name is required'],
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    specialization: {
      type: String,
      trim: true,
    },
    campus: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Teacher', teacherSchema);
