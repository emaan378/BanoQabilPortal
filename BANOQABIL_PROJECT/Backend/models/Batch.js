const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Batch name is required'],
      trim: true,
      unique: true,
    },
    course: {
      type: String,
      required: [true, 'Course is required'],
      trim: true,
    },
    teacher: {
      type: String,
      trim: true,
    },
    room: {
      type: String,
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: 1,
      default: 40,
    },
    days: {
      type: String,
      trim: true,
    },
    time: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'full', 'closed'],
      default: 'open',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Batch', batchSchema);
