const mongoose = require('mongoose');
const service = require('../services/teacherService');
const { DOC_STATUSES } = require('../utils/lifecycle');

const requiredText = (body, field, label, errors) => {
  if (!body[field]?.trim()) errors.push(`${label} is required`);
};

const validateTeacher = (body) => {
  const errors = [];
  requiredText(body, 'name', 'Teacher name', errors);
  requiredText(body, 'phone', 'Phone number', errors);
  requiredText(body, 'specialization', 'Specialization', errors);
  if (body.phone && !/^[+\d][\d\-() ]{6,}$/.test(body.phone.trim())) errors.push('Phone must be a valid number');
  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) errors.push('Email must be a valid address');
  return errors;
};

const validateDocument = (body) => {
  const errors = [];
  requiredText(body, 'docType', 'Document type', errors);
  requiredText(body, 'fileName', 'File name', errors);
  return errors;
};

const validateDocumentStatus = (body) => {
  const errors = [];
  if (!body.status || !DOC_STATUSES.includes(body.status)) errors.push('Document status must be pending, verified, or rejected');
  return errors;
};

const handleError = (res, error) => {
  if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
  if (error.code === 11000) return res.status(409).json({ success: false, message: 'A teacher with this name already exists' });
  if (error.name === 'ValidationError') {
    return res.status(422).json({ success: false, message: 'Validation failed', errors: Object.values(error.errors).map((e) => e.message) });
  }
  console.error(error);
  return res.status(500).json({ success: false, message: 'Internal server error' });
};

const isValidId = (value) => mongoose.isValidObjectId(value);
const missingId = (res) => res.status(400).json({ success: false, message: 'Invalid record ID' });

const listTeachers = async (req, res) => {
  try { res.json({ success: true, data: await service.listTeachers(req.query, req.campusScope) }); }
  catch (error) { handleError(res, error); }
};

const getTeacher = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return missingId(res);
    const teacher = await service.getTeacher(req.params.id, req.campusScope);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
    res.json({ success: true, data: teacher });
  } catch (error) { handleError(res, error); }
};

const createTeacher = async (req, res) => {
  try {
    // A campus admin can only ever create teachers inside their own campus.
    const payload = req.campusScope ? { ...req.body, campus: req.campusScope } : req.body;
    const errors = validateTeacher(payload);
    if (errors.length) return res.status(422).json({ success: false, message: 'Validation failed', errors });
    const teacher = await service.createTeacher(payload);
    res.status(201).json({ success: true, message: 'Teacher created successfully', data: teacher });
  } catch (error) { handleError(res, error); }
};

const updateTeacher = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return missingId(res);
    const payload = req.campusScope ? { ...req.body, campus: req.campusScope } : req.body;
    const errors = validateTeacher(payload);
    if (errors.length) return res.status(422).json({ success: false, message: 'Validation failed', errors });
    const teacher = await service.updateTeacher(req.params.id, payload, req.campusScope);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
    res.json({ success: true, message: 'Teacher updated successfully', data: teacher });
  } catch (error) { handleError(res, error); }
};

const removeTeacher = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return missingId(res);
    const teacher = await service.removeTeacher(req.params.id, req.campusScope);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
    res.json({ success: true, message: 'Teacher deleted successfully' });
  } catch (error) { handleError(res, error); }
};

const addDocument = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return missingId(res);
    const errors = validateDocument(req.body);
    if (errors.length) return res.status(422).json({ success: false, message: 'Validation failed', errors });
    const document = await service.addDocument(req.params.id, req.body.docType, req.body.fileName, req.campusScope);
    if (!document) return res.status(404).json({ success: false, message: 'Teacher not found' });
    res.status(201).json({ success: true, message: 'Document uploaded successfully', data: document });
  } catch (error) { handleError(res, error); }
};

const updateDocumentStatus = async (req, res) => {
  try {
    if (!isValidId(req.params.docId)) return missingId(res);
    const errors = validateDocumentStatus(req.body);
    if (errors.length) return res.status(422).json({ success: false, message: 'Validation failed', errors });
    const document = await service.updateDocumentStatus(req.params.docId, req.body.status, req.campusScope);
    if (!document) return res.status(404).json({ success: false, message: 'Document not found' });
    res.json({ success: true, message: 'Document status updated successfully', data: document });
  } catch (error) { handleError(res, error); }
};

const removeDocument = async (req, res) => {
  try {
    if (!isValidId(req.params.docId)) return missingId(res);
    const document = await service.removeDocument(req.params.docId, req.campusScope);
    if (!document) return res.status(404).json({ success: false, message: 'Document not found' });
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) { handleError(res, error); }
};

module.exports = {
  listTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  removeTeacher,
  addDocument,
  updateDocumentStatus,
  removeDocument,
};
