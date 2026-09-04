const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
    },
    campus: {
      type: String,
      required: [true, 'Campus is required'],
      trim: true,
    },
    duration: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

courseSchema.index({ name: 1, campus: 1 }, { unique: true });

module.exports = mongoose.model('Course', courseSchema);
