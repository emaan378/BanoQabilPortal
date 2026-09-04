const mongoose = require('mongoose');
const { DOC_STATUSES } = require('../utils/lifecycle');

const documentSchema = new mongoose.Schema(
  {
    ownerType: {
      type: String,
      enum: ['student', 'teacher'],
      default: 'student',
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
      required: [true, 'Owner is required'],
    },
    docType: {
      type: String,
      required: [true, 'Document type is required'],
      trim: true,
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: DOC_STATUSES,
      default: 'pending',
    },
  },
  { timestamps: true }
);

documentSchema.index({ ownerType: 1, ownerId: 1 });
documentSchema.index({ status: 1 });

module.exports = mongoose.model('Document', documentSchema);
