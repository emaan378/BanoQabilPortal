const mongoose = require('mongoose');
const Registration = require('../models/Registration');
const Document = require('../models/Document');
const { escapeRegex, deriveStatuses } = require('../utils/lifecycle');
const { advanceStage, getNextRegistrationId } = require('./registrationService');

const buildBaseQuery = (search) => {
  const query = {};
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    query.$or = [
      { registrationId: regex },
      { name: regex },
      { cnic: regex },
      { phone: regex },
      { email: regex },
      { rollNumber: regex },
    ];
    if (mongoose.isValidObjectId(search)) query.$or.push({ _id: search });
  }
  return query;
};

const getStudents = async ({ search, stage, course, batch, batchAllocationStatus, feeStatus, page = 1, limit = 20 }, campusScope) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const query = buildBaseQuery(search);

  if (stage) query.stage = stage;
  if (course) query.course = new RegExp(`^${escapeRegex(course)}$`, 'i');
  if (batch) query.batch = new RegExp(`^${escapeRegex(batch)}$`, 'i');
  if (batchAllocationStatus) query.batchAllocationStatus = batchAllocationStatus;
  if (feeStatus) query.feeStatus = feeStatus;
  if (campusScope) query.campus = campusScope;

  const [data, total] = await Promise.all([
    Registration.find(query).sort({ createdAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
    Registration.countDocuments(query),
  ]);

  return {
    data: data.map((registration) => ({ ...registration, ...deriveStatuses(registration) })),
    pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) },
  };
};

const getStudent = async (id, campusScope) => {
  const query = campusScope ? { _id: id, campus: campusScope } : { _id: id };
  const registration = await Registration.findOne(query).lean();
  if (!registration) return null;
  const documents = await Document.find({ ownerType: 'student', ownerId: id }).sort({ createdAt: -1 }).lean();
  return { ...registration, ...deriveStatuses(registration), documents };
};

const createStudent = async (payload) => {
  const duplicate = await Registration.findOne({ cnic: payload.cnic.trim() });
  if (duplicate) {
    const error = new Error('A student already exists for this CNIC');
    error.statusCode = 409;
    throw error;
  }
  const registrationId = await getNextRegistrationId();
  return Registration.create({ ...payload, registrationId, stage: 'registered' });
};

const updateStudent = async (id, payload, campusScope) => {
  const allowed = ['name', 'cnic', 'phone', 'email', 'address', 'guardianName', 'guardianContact', 'course', 'campus', 'batch'];
  const updates = Object.fromEntries(allowed.filter((field) => payload[field] !== undefined).map((field) => [field, payload[field]]));

  if (updates.cnic) {
    const duplicate = await Registration.findOne({ cnic: updates.cnic, _id: { $ne: id } });
    if (duplicate) {
      const error = new Error('A student already exists for this CNIC');
      error.statusCode = 409;
      throw error;
    }
  }
  const query = campusScope ? { _id: id, campus: campusScope } : { _id: id };
  return Registration.findOneAndUpdate(query, updates, { new: true, runValidators: true });
};

const removeStudent = async (id, campusScope) => {
  const query = campusScope ? { _id: id, campus: campusScope } : { _id: id };
  const registration = await Registration.findOneAndDelete(query);
  if (!registration) return null;
  await Document.deleteMany({ ownerType: 'student', ownerId: id });
  return registration;
};

const updateStudentStatus = async (id, payload, campusScope) => {
  const query = campusScope ? { _id: id, campus: campusScope } : { _id: id };
  const registration = await Registration.findOne(query);
  if (!registration) return null;

  if (payload.stage !== undefined) await advanceStage(registration, payload.stage);
  if (payload.batchAllocationStatus !== undefined) registration.batchAllocationStatus = payload.batchAllocationStatus;
  if (payload.feeStatus !== undefined) registration.feeStatus = payload.feeStatus;
  if (payload.feeAmount !== undefined) registration.feeAmount = Number(payload.feeAmount);
  if (payload.feePaid !== undefined) registration.feePaid = Number(payload.feePaid);
  if (payload.batch !== undefined) registration.batch = payload.batch || undefined;
  if (payload.rollNumber !== undefined) registration.rollNumber = payload.rollNumber;

  if (payload.testResult !== undefined) registration.test.result = payload.testResult;
  if (payload.testScheduledAt !== undefined) registration.test.scheduledAt = payload.testScheduledAt || undefined;
  if (payload.interviewDecision !== undefined) registration.interview.decision = payload.interviewDecision;
  if (payload.interviewScheduledAt !== undefined) registration.interview.scheduledAt = payload.interviewScheduledAt || undefined;

  if (registration.stage === 'fee-verified' && registration.feeStatus === 'paid') registration.stage = 'enrolled';
  return registration.save();
};

// A campus admin may only touch documents belonging to a student in their own campus.
const isStudentInScope = async (studentId, campusScope) => {
  if (!campusScope) return true;
  const student = await Registration.findOne({ _id: studentId, campus: campusScope }).select('_id').lean();
  return !!student;
};

const addDocument = async (ownerId, docType, fileName, campusScope) => {
  if (!(await isStudentInScope(ownerId, campusScope))) return null;
  const student = await Registration.findById(ownerId);
  if (!student) return null;
  return Document.create({ ownerType: 'student', ownerId, docType: docType.trim(), fileName: fileName.trim() });
};

const updateDocumentStatus = async (docId, status, campusScope) => {
  const document = await Document.findById(docId);
  if (!document) return null;
  if (!(await isStudentInScope(document.ownerId, campusScope))) return null;
  document.status = status;
  return document.save();
};

const removeDocument = async (docId, campusScope) => {
  const document = await Document.findById(docId);
  if (!document) return null;
  if (!(await isStudentInScope(document.ownerId, campusScope))) return null;
  await document.deleteOne();
  return document;
};

module.exports = {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  removeStudent,
  updateStudentStatus,
  addDocument,
  updateDocumentStatus,
  removeDocument,
};
