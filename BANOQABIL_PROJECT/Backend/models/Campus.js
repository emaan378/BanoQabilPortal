const mongoose = require('mongoose');

const campusSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Campus name is required'],
      trim: true,
      unique: true,
    },
    address: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    city: {
      type: String,
      trim: true,
    },
    region: {
      type: String,
      trim: true,
    },
    zip: {
      type: String,
      trim: true,
    },
    establishedYear: {
      type: Number,
      min: [1900, 'Established year must be 1900 or later'],
      max: [new Date().getFullYear(), 'Established year cannot be in the future'],
    },
    capacity: {
      type: Number,
      min: [1, 'Capacity must be a positive number'],
    },
    headName: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Campus', campusSchema);
