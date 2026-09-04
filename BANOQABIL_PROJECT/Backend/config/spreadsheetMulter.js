const multer = require('multer');

const spreadsheetUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const accepted = /\.(xlsx|xls)$/i.test(file.originalname || '');
    if (!accepted) return callback(new Error('Only .xlsx and .xls files are supported'));
    return callback(null, true);
  },
});

module.exports = spreadsheetUpload;
