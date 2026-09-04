const Registration = require('../models/Registration');
const User = require('../models/User');
const Document = require('../models/Document');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Grade = require('../models/Grade');
const Notice = require('../models/Notice');
const Batch = require('../models/Batch');
const Voucher = require('../models/Voucher');
const { deriveStatuses } = require('../utils/lifecycle');

const portalError = (message, statusCode = 404) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const findStudentForUser = async (user) => {
  const email = String(user.email || '').trim().toLowerCase();
  const student = await Registration.findOne({ email }).lean();
  if (!student) throw portalError('No student profile is linked to this account');
  return student;
};

const findBatchForStudent = (student) => {
  if (!student.batch) return null;
  return Batch.findOne({ name: student.batch }).lean();
};

const withSubmission = async (assignments, studentId) => {
  const submissions = await AssignmentSubmission.find({
    student: studentId,
    assignment: { $in: assignments.map((assignment) => assignment._id) },
  }).lean();
  const byAssignment = new Map(submissions.map((submission) => [String(submission.assignment), submission]));
  return assignments.map((assignment) => ({
    ...assignment,
    submission: byAssignment.get(String(assignment._id)) || null,
  }));
};

const getStudentProfile = async (user) => {
  const student = await findStudentForUser(user);
  const documents = await Document.find({ ownerType: 'student', ownerId: student._id }).sort({ createdAt: -1 }).lean();
  return { ...student, ...deriveStatuses(student), documents };
};

const getDashboard = async (user) => {
  const student = await findStudentForUser(user);
  const batch = await findBatchForStudent(student);
  const [attendance, assignments, grades, notices, vouchers] = await Promise.all([
    Attendance.find({ student: student._id }).sort({ date: -1 }).limit(90).lean(),
    batch ? Assignment.find({ batch: batch._id, published: true }).sort({ dueAt: 1 }).limit(10).lean() : [],
    Grade.find({ student: student._id }).sort({ recordedAt: -1 }).lean(),
    Notice.find({
      archived: false,
      audience: { $in: ['student', 'all'] },
      $or: [{ batch: null }, { batchName: student.batch || '' }],
    }).sort({ publishedAt: -1 }).limit(5).lean(),
    Voucher.find({ $or: [{ registration: student._id }, { rollNumber: student.rollNumber || '__none__' }] }).sort({ createdAt: -1 }).lean(),
  ]);

  const presentCount = attendance.filter((item) => item.status === 'present' || item.status === 'late').length;
  const attendanceRate = attendance.length ? Math.round((presentCount / attendance.length) * 100) : 0;
  const graded = grades.filter((grade) => Number.isFinite(grade.score) && grade.maxScore > 0);
  const averageGrade = graded.length
    ? Math.round(graded.reduce((total, grade) => total + (grade.score / grade.maxScore) * 100, 0) / graded.length)
    : 0;
  const enrichedFees = vouchers.map((voucher) => ({
    ...voucher,
    displayStatus: voucher.status === 'paid' ? 'paid' : voucher.dueDate && new Date(voucher.dueDate) < new Date() ? 'overdue' : 'unpaid',
  }));
  const enrichedAssignments = await withSubmission(assignments, student._id);
  const pendingAssignments = enrichedAssignments.filter((a) => !a.submission || a.submission.status !== 'graded').length;

  return {
    profile: { ...student, ...deriveStatuses(student) },
    batch,
    stats: {
      attendanceRate,
      attendanceSessions: attendance.length,
      courseProgress: averageGrade,
      pendingAssignments,
      outstandingFees: enrichedFees.filter((voucher) => voucher.displayStatus !== 'paid').reduce((sum, voucher) => sum + voucher.amount, 0),
    },
    attendance: attendance.slice(0, 7),
    assignments: enrichedAssignments,
    grades,
    fees: enrichedFees,
    notices,
  };
};

const getAttendance = async (user, { from, to } = {}) => {
  const student = await findStudentForUser(user);
  const query = { student: student._id };
  if (from || to) query.date = {};
  if (from) query.date.$gte = new Date(from);
  if (to) query.date.$lte = new Date(to);
  const records = await Attendance.find(query).populate('batch', 'name course room days time').sort({ date: -1 }).lean();
  const present = records.filter((record) => record.status === 'present' || record.status === 'late').length;
  return {
    records,
    summary: { total: records.length, present, late: records.filter((record) => record.status === 'late').length, absent: records.filter((record) => record.status === 'absent').length, rate: records.length ? Math.round((present / records.length) * 100) : 0 },
  };
};

const getAssignments = async (user) => {
  const student = await findStudentForUser(user);
  const batch = await findBatchForStudent(student);
  if (!batch) return { data: [] };
  const assignments = await Assignment.find({ batch: batch._id, published: true }).sort({ dueAt: 1 }).lean();
  return { data: await withSubmission(assignments, student._id) };
};

const submitAssignment = async (user, assignmentId, payload = {}, file) => {
  const student = await findStudentForUser(user);
  const assignment = await Assignment.findById(assignmentId).lean();
  if (!assignment) throw portalError('Assignment not found');
  const batch = await findBatchForStudent(student);
  if (!batch || String(batch._id) !== String(assignment.batch)) throw portalError('Assignment is not assigned to this student', 403);
  if (!payload.fileName && !payload.link && !payload.note && !file) throw portalError('Add a file, file name, link, or note before submitting', 422);
  const filePayload = file
    ? { fileUrl: `/uploads/documents/${file.filename}`, originalName: file.originalname }
    : {};
  const isLate = new Date(assignment.dueAt) < new Date();
  const submission = await AssignmentSubmission.findOneAndUpdate(
    { assignment: assignment._id, student: student._id },
    { ...payload, ...filePayload, status: isLate ? 'late' : 'submitted', submittedAt: new Date(), score: undefined, feedback: undefined, gradedAt: undefined },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  return submission;
};

const updateProfile = async (user, payload) => {
  const allowed = ['name', 'phone', 'address', 'guardianName', 'guardianContact'];
  const updates = Object.fromEntries(allowed.filter((field) => payload[field] !== undefined).map((field) => [field, String(payload[field]).trim()]));
  const email = String(user.email || '').trim().toLowerCase();
  const student = await Registration.findOneAndUpdate({ email }, updates, { new: true, runValidators: true }).lean();
  if (!student) throw portalError('No student profile is linked to this account');
  return student;
};

const addDocument = async (user, payload) => {
  const student = await findStudentForUser(user);
  if (!payload.docType?.trim() || !payload.fileName?.trim()) throw portalError('Document type and file name are required', 422);
  return Document.create({ ownerType: 'student', ownerId: student._id, docType: payload.docType.trim(), fileName: payload.fileName.trim() });
};

const getFees = async (user) => {
  const student = await findStudentForUser(user);
  const vouchers = await Voucher.find({ $or: [{ registration: student._id }, { rollNumber: student.rollNumber || '__none__' }] }).sort({ createdAt: -1 }).lean();
  return { data: vouchers.map((voucher) => ({ ...voucher, displayStatus: voucher.status === 'paid' ? 'paid' : voucher.dueDate && new Date(voucher.dueDate) < new Date() ? 'overdue' : 'unpaid' })) };
};

const getNotices = async (user) => {
  const student = await findStudentForUser(user);
  return { data: await Notice.find({ archived: false, audience: { $in: ['student', 'all'] }, $or: [{ batch: null }, { batchName: student.batch || '' }] }).sort({ publishedAt: -1 }).lean() };
};

const getCourses = async (user) => {
  const student = await findStudentForUser(user);
  const batch = await findBatchForStudent(student);
  if (!batch) {
    return { data: { batchName: null, course: null, modules: [], stats: null } };
  }
  const assignments = await Assignment.find({ batch: batch._id, published: true }).sort({ dueAt: 1 }).lean();
  const enriched = await withSubmission(assignments, student._id);

  const byModule = new Map();
  for (const a of enriched) {
    const key = String(a.module || 'General').trim() || 'General';
    if (!byModule.has(key)) byModule.set(key, { module: key, total: 0, graded: 0 });
    const entry = byModule.get(key);
    entry.total += 1;
    if (a.submission && a.submission.status === 'graded' && a.submission.score != null) entry.graded += 1;
  }

  const modules = [...byModule.values()].map((m) => {
    const progress = m.total ? Math.round((m.graded / m.total) * 100) : 0;
    const status = progress === 100 ? 'completed' : progress > 0 ? 'active' : 'locked';
    return { ...m, progress, status };
  });

  const overallProgress = modules.length ? Math.round(modules.reduce((sum, m) => sum + m.progress, 0) / modules.length) : 0;

  return {
    data: {
      batchName: batch.name,
      course: batch.course,
      modules,
      stats: {
        overallProgress,
        lessonsCompleted: modules.reduce((sum, m) => sum + m.graded, 0),
        lessonsTotal: modules.reduce((sum, m) => sum + m.total, 0),
        batch: batch.name,
        course: batch.course,
      },
    },
  };
};

module.exports = { findStudentForUser, getStudentProfile, getDashboard, getAttendance, getAssignments, getCourses, submitAssignment, updateProfile, addDocument, getFees, getNotices };
