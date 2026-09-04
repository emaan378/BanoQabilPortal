const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    authorName: { type: String, required: true, trim: true },
    audience: { type: String, enum: ['student', 'teacher', 'all'], required: true, index: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
    batchName: { type: String, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    publishedAt: { type: Date, default: Date.now, index: true },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notice', noticeSchema);
