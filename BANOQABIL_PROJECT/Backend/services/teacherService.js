const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
const Batch = require('../models/Batch');
const Document = require('../models/Document');

const listTeachers = (options = {}, campusScope) => {
  const search = typeof options === 'string' ? '' : String(options.search || '').trim();
  const query = campusScope ? { campus: campusScope } : {};
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    query.$or = [{ teacherId: regex }, { name: regex }, { email: regex }, { phone: regex }, { specialization: regex }];
    if (mongoose.isValidObjectId(search)) query.$or.push({ _id: search });
  }
  return Teacher.find(query).sort({ name: 1 }).lean().then((teachers) => teachers.map((teacher) => ({ ...teacher, teacherId: teacher.teacherId || String(teacher._id) })));
};

const getNextTeacherId = async () => {
  const count = await Teacher.countDocuments();
  return `TCH-${String(count + 1).padStart(4, '0')}`;
};

const getTeacher = async (id, campusScope) => {
  const query = campusScope ? { _id: id, campus: campusScope } : { _id: id };
  const teacher = await Teacher.findOne(query).lean();
  if (!teacher) return null;
  const documents = await Document.find({ ownerType: 'teacher', ownerId: id }).sort({ createdAt: -1 }).lean();
  return { ...teacher, teacherId: teacher.teacherId || String(teacher._id), documents };
};

const createTeacher = async (payload) => Teacher.create({ ...payload, teacherId: payload.teacherId || await getNextTeacherId() });

const updateTeacher = async (id, payload, campusScope) => {
  const query = campusScope ? { _id: id, campus: campusScope } : { _id: id };
  return Teacher.findOneAndUpdate(query, payload, { new: true, runValidators: true });
};

const removeTeacher = async (id, campusScope) => {
  const query = campusScope ? { _id: id, campus: campusScope } : { _id: id };
  const teacher = await Teacher.findOneAndDelete(query);
  if (!teacher) return null;
  await Promise.all([
    Batch.updateMany({ teacher: teacher.name }, { $set: { teacher: '' } }),
    Document.deleteMany({ ownerType: 'teacher', ownerId: id }),
  ]);
  return teacher;
};

// A campus admin may only touch documents belonging to a teacher in their own campus.
const isTeacherInScope = async (teacherId, campusScope) => {
  if (!campusScope) return true;
  const teacher = await Teacher.findOne({ _id: teacherId, campus: campusScope }).select('_id').lean();
  return !!teacher;
};

const addDocument = async (ownerId, docType, fileName, campusScope) => {
  if (!(await isTeacherInScope(ownerId, campusScope))) return null;
  const teacher = await Teacher.findById(ownerId);
  if (!teacher) return null;
  return Document.create({ ownerType: 'teacher', ownerId, docType: docType.trim(), fileName: fileName.trim() });
};

const updateDocumentStatus = async (docId, status, campusScope) => {
  const document = await Document.findById(docId);
  if (!document) return null;
  if (!(await isTeacherInScope(document.ownerId, campusScope))) return null;
  document.status = status;
  return document.save();
};

const removeDocument = async (docId, campusScope) => {
  const document = await Document.findById(docId);
  if (!document) return null;
  if (!(await isTeacherInScope(document.ownerId, campusScope))) return null;
  await document.deleteOne();
  return document;
};

module.exports = {
  listTeachers,
  getNextTeacherId,
  getTeacher,
  createTeacher,
  updateTeacher,
  removeTeacher,
  addDocument,
  updateDocumentStatus,
  removeDocument,
};
