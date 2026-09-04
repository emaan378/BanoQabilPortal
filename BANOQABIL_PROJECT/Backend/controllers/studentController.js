const mongoose = require('mongoose');
const service = require('../services/studentService');
const { STAGES, TEST_RESULTS, INTERVIEW_DECISIONS, BATCH_ALLOCATION_STATUSES, FEE_STATUSES, DOC_STATUSES } = require('../utils/lifecycle');

function validateStudentStatus(body) {
  const errors = [];
  if (body.stage !== undefined && !STAGES.includes(body.stage)) errors.push('Invalid pipeline stage');
  if (body.batchAllocationStatus !== undefined && !BATCH_ALLOCATION_STATUSES.includes(body.batchAllocationStatus)) errors.push('Invalid batch allocation status');
  if (body.feeStatus !== undefined && !FEE_STATUSES.includes(body.feeStatus)) errors.push('Invalid fee status');
  if (body.feeAmount !== undefined && (Number(body.feeAmount) < 0 || Number.isNaN(Number(body.feeAmount)))) errors.push('Fee amount must be a positive number');
  if (body.feePaid !== undefined && (Number(body.feePaid) < 0 || Number.isNaN(Number(body.feePaid)))) errors.push('Fee paid must be a positive number');
  if (body.batch !== undefined && body.batch !== null && typeof body.batch !== 'string') errors.push('Batch must be a string or null');
  if (body.rollNumber !== undefined && typeof body.rollNumber !== 'string') errors.push('Roll number must be a string');
  if (body.testResult !== undefined && body.testResult !== null && !TEST_RESULTS.includes(body.testResult)) errors.push('Test result must be Awaiting, Passed, or Failed');
  if (body.interviewDecision !== undefined && body.interviewDecision !== null && !INTERVIEW_DECISIONS.includes(body.interviewDecision)) errors.push('Interview decision must be Awaiting, Passed, or Failed');
  return errors;
}

function validateCreateStudent(body) {
  const errors = [];
  if (!body.name?.trim()) errors.push('Name is required');
  if (!/^\d{5}-\d{7}-\d$/.test(body.cnic || '')) errors.push('CNIC must be in 00000-0000000-0 format');
  if (!body.phone?.trim()) errors.push('Phone is required');
  if (!body.course?.trim()) errors.push('Course is required');
  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) errors.push('Invalid email address');
  return errors;
}

function validateUpdateStudent(body) {
  return validateCreateStudent(body).filter((error) => !error.includes('required'));
}

function validateDocument(body) {
  const errors = [];
  if (!body.docType?.trim()) errors.push('Document type is required');
  if (!body.fileName?.trim()) errors.push('File name is required');
  return errors;
}

function validateDocumentStatus(body) {
  const errors = [];
  if (!body.status || !DOC_STATUSES.includes(body.status)) errors.push('Document status must be pending, verified, or rejected');
  return errors;
}

const handleError = (res, error) => {
  if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
  if (error.code === 11000) return res.status(409).json({ success: false, message: 'Duplicate CNIC or roll number' });
  if (error.name === 'ValidationError') {
    return res.status(422).json({ success: false, message: 'Validation failed', errors: Object.values(error.errors).map((e) => e.message) });
  }
  console.error(error);
  return res.status(500).json({ success: false, message: 'Internal server error' });
};

const isValidId = (value) => mongoose.isValidObjectId(value);

const listStudents = async (req, res) => {
  try { res.json({ success: true, ...(await service.getStudents(req.query, req.campusScope)) }); }
  catch (error) { handleError(res, error); }
};

const getStudent = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid student ID' });
    const student = await service.getStudent(req.params.id, req.campusScope);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: student });
  } catch (error) { handleError(res, error); }
};

const createStudent = async (req, res) => {
  try {
    // A campus admin can only ever create students in their own campus.
    const payload = req.campusScope ? { ...req.body, campus: req.campusScope } : req.body;
    const errors = validateCreateStudent(payload);
    if (errors.length) return res.status(422).json({ success: false, message: 'Validation failed', errors });
    const student = await service.createStudent(payload);
    res.status(201).json({ success: true, message: 'Student created successfully', data: student });
  } catch (error) { handleError(res, error); }
};

const updateStudent = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid student ID' });
    const errors = validateUpdateStudent(req.body);
    if (errors.length) return res.status(422).json({ success: false, message: 'Validation failed', errors });
    const student = await service.updateStudent(req.params.id, req.body, req.campusScope);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, message: 'Student updated successfully', data: student });
  } catch (error) { handleError(res, error); }
};

const removeStudent = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid student ID' });
    const student = await service.removeStudent(req.params.id, req.campusScope);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) { handleError(res, error); }
};

const updateStudentStatus = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid student ID' });
    const errors = validateStudentStatus(req.body);
    if (errors.length) return res.status(422).json({ success: false, message: 'Validation failed', errors });
    const student = await service.updateStudentStatus(req.params.id, req.body, req.campusScope);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, message: 'Student status updated successfully', data: student });
  } catch (error) { handleError(res, error); }
};

const addDocument = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid student ID' });
    const errors = validateDocument(req.body);
    if (errors.length) return res.status(422).json({ success: false, message: 'Validation failed', errors });
    const document = await service.addDocument(req.params.id, req.body.docType, req.body.fileName, req.campusScope);
    if (!document) return res.status(404).json({ success: false, message: 'Student not found' });
    res.status(201).json({ success: true, message: 'Document uploaded successfully', data: document });
  } catch (error) { handleError(res, error); }
};

const updateDocumentStatus = async (req, res) => {
  try {
    if (!isValidId(req.params.docId)) return res.status(400).json({ success: false, message: 'Invalid document ID' });
    const errors = validateDocumentStatus(req.body);
    if (errors.length) return res.status(422).json({ success: false, message: 'Validation failed', errors });
    const document = await service.updateDocumentStatus(req.params.docId, req.body.status, req.campusScope);
    if (!document) return res.status(404).json({ success: false, message: 'Document not found' });
    res.json({ success: true, message: 'Document status updated successfully', data: document });
  } catch (error) { handleError(res, error); }
};

const removeDocument = async (req, res) => {
  try {
    if (!isValidId(req.params.docId)) return res.status(400).json({ success: false, message: 'Invalid document ID' });
    const document = await service.removeDocument(req.params.docId, req.campusScope);
    if (!document) return res.status(404).json({ success: false, message: 'Document not found' });
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) { handleError(res, error); }
};

module.exports = {
  listStudents,
  getStudent,
  createStudent,
  updateStudent,
  removeStudent,
  updateStudentStatus,
  addDocument,
  updateDocumentStatus,
  removeDocument,
};
