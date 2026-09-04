const service = require('../services/spreadsheetService');

const sendWorkbook = (res, buffer, fileName) => {
  res.set({
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': `attachment; filename="${fileName}"`,
    'Content-Length': buffer.length,
  });
  return res.send(buffer);
};

const handleError = (res, error) => {
  if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
  if (error.name === 'ValidationError') return res.status(422).json({ success: false, message: 'Validation failed', errors: Object.values(error.errors).map((item) => item.message) });
  console.error('spreadsheetController error:', error);
  return res.status(500).json({ success: false, message: 'Unable to process spreadsheet' });
};

const wrap = (operation) => async (req, res) => {
  try { return await operation(req, res); } catch (error) { return handleError(res, error); }
};

const download = (serviceMethod, fileName) => wrap(async (req, res) => {
  const buffer = await serviceMethod(req);
  return sendWorkbook(res, buffer, fileName);
});

const upload = (serviceMethod) => wrap(async (req, res) => {
  if (!req.file) return res.status(422).json({ success: false, message: 'Please choose an Excel file (.xlsx or .xls)' });
  const data = await serviceMethod(req, req.file.buffer);
  return res.json({ success: true, message: 'Spreadsheet processed successfully', data });
});

module.exports = {
  adminExportStudents: download((req) => service.exportStudents(req.campusScope, req.query.search), 'bano-qabil-students.xlsx'),
  adminImportStudents: upload((req, buffer) => service.importStudents(buffer, req.campusScope)),
  adminExportTeachers: download((req) => service.exportTeachers(req.campusScope, req.query.search), 'bano-qabil-teachers.xlsx'),
  adminImportTeachers: upload((req, buffer) => service.importTeachers(buffer, req.campusScope)),
  studentExport: download((req) => service.exportStudentPortal(req.user), 'student-portal-export.xlsx'),
  studentImport: upload((req, buffer) => service.importStudentPortal(buffer, req.user)),
  teacherExport: download((req) => service.exportTeacherPortal(req.user), 'teacher-portal-export.xlsx'),
  teacherImport: upload((req, buffer) => service.importTeacherPortal(buffer, req.user)),
};
