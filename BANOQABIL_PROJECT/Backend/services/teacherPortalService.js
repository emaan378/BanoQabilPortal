const Teacher = require('../models/Teacher');
const Batch = require('../models/Batch');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Grade = require('../models/Grade');
const Notice = require('../models/Notice');
const StudentFlag = require('../models/StudentFlag');

const portalError = (message, statusCode = 404) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const startOfDay = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value = new Date()) => {
  const date = startOfDay(value);
  date.setDate(date.getDate() + 1);
  return date;
};

const findTeacherForUser = async (user) => {
  const email = String(user.email || '').trim().toLowerCase();
  const teacher = await Teacher.findOne({ email }).lean();
  if (!teacher) throw portalError('No teacher profile is linked to this account');
  return teacher;
};

const getTeacherBatches = async (teacher) => Batch.find({ teacher: teacher.name }).sort({ name: 1 }).lean();

const assertTeacherBatch = async (teacher, batchId) => {
  const batch = await Batch.findOne({ _id: batchId, teacher: teacher.name }).lean();
  if (!batch) throw portalError('Batch not found or not assigned to this teacher', 403);
  return batch;
};

const getDashboard = async (user) => {
  const teacher = await findTeacherForUser(user);
  const batches = await getTeacherBatches(teacher);
  const batchNames = batches.map((batch) => batch.name);
  const [students, assignments, todayAttendance, notices] = await Promise.all([
    Registration.find({ batch: { $in: batchNames } }).sort({ name: 1 }).lean(),
    Assignment.find({ teacher: teacher._id }).sort({ dueAt: 1 }).limit(8).lean(),
    Attendance.find({ teacher: teacher._id, date: { $gte: startOfDay(), $lt: endOfDay() } }).lean(),
    Notice.find({ archived: false, audience: { $in: ['teacher', 'all'] }, authorName: teacher.name }).sort({ publishedAt: -1 }).limit(5).lean(),
  ]);
  const pendingSubmissions = assignments.length
    ? await AssignmentSubmission.countDocuments({ assignment: { $in: assignments.map((assignment) => assignment._id) }, status: { $in: ['submitted', 'late'] } })
    : 0;
  return {
    profile: teacher,
    batches: batches.map((batch) => ({ ...batch, enrolled: students.filter((student) => student.batch === batch.name).length })),
    stats: { totalStudents: students.length, totalBatches: batches.length, todaysClasses: batches.length, pendingSubmissions, attendanceMarkedToday: todayAttendance.length },
    assignments,
    notices,
  };
};

const getRoster = async (user, batchId) => {
  const teacher = await findTeacherForUser(user);
  const batch = await assertTeacherBatch(teacher, batchId);
  const students = await Registration.find({ batch: batch.name }).sort({ name: 1 }).lean();
  return { batch, data: students };
};

const getAttendance = async (user, { batchId, date } = {}) => {
  const teacher = await findTeacherForUser(user);
  const batch = await assertTeacherBatch(teacher, batchId);
  const records = await Attendance.find({ batch: batch._id, date: { $gte: startOfDay(date), $lt: endOfDay(date) } }).populate('student', 'name rollNumber email').sort({ 'student.name': 1 }).lean();
  return { batch, date: startOfDay(date), data: records };
};

const saveAttendance = async (user, { batchId, date, records } = {}) => {
  const teacher = await findTeacherForUser(user);
  const batch = await assertTeacherBatch(teacher, batchId);
  if (!Array.isArray(records) || !records.length) throw portalError('Attendance records are required', 422);
  const students = await Registration.find({ _id: { $in: records.map((record) => record.studentId) }, batch: batch.name }).select('_id').lean();
  const validStudents = new Set(students.map((student) => String(student._id)));
  const normalizedDate = startOfDay(date);
  const operations = records.filter((record) => validStudents.has(String(record.studentId))).map((record) => ({
    updateOne: {
      filter: { student: record.studentId, batch: batch._id, date: normalizedDate },
      update: { $set: { teacher: teacher._id, status: record.status, notes: record.notes || '' } },
      upsert: true,
    },
  }));
  if (!operations.length) throw portalError('No valid students were supplied for this batch', 422);
  await Attendance.bulkWrite(operations);
  return getAttendance(user, { batchId, date: normalizedDate });
};

const getAssignments = async (user) => {
  const teacher = await findTeacherForUser(user);
  const assignments = await Assignment.find({ teacher: teacher._id }).populate('batch', 'name course').sort({ dueAt: 1 }).lean();
  const counts = await Promise.all(assignments.map((assignment) => AssignmentSubmission.countDocuments({ assignment: assignment._id, status: { $in: ['submitted', 'late'] } })));
  return { data: assignments.map((assignment, index) => ({ ...assignment, pendingSubmissions: counts[index] })) };
};

const createAssignment = async (user, payload) => {
  const teacher = await findTeacherForUser(user);
  const batch = await assertTeacherBatch(teacher, payload.batchId);
  if (!payload.title?.trim() || !payload.dueAt || Number.isNaN(new Date(payload.dueAt).getTime())) throw portalError('Title and a valid due date are required', 422);
  return Assignment.create({ teacher: teacher._id, batch: batch._id, batchName: batch.name, title: payload.title.trim(), module: payload.module?.trim(), description: payload.description?.trim(), dueAt: payload.dueAt, totalMarks: Number(payload.totalMarks) || 100, published: payload.published !== false });
};

const updateAssignment = async (user, assignmentId, payload) => {
  const teacher = await findTeacherForUser(user);
  const assignment = await Assignment.findOneAndUpdate({ _id: assignmentId, teacher: teacher._id }, { $set: payload }, { new: true, runValidators: true }).lean();
  if (!assignment) throw portalError('Assignment not found', 404);
  return assignment;
};

const getSubmissions = async (user, assignmentId) => {
  const teacher = await findTeacherForUser(user);
  const assignment = await Assignment.findOne({ _id: assignmentId, teacher: teacher._id }).lean();
  if (!assignment) throw portalError('Assignment not found');
  const data = await AssignmentSubmission.find({ assignment: assignment._id }).populate('student', 'name rollNumber email').sort({ submittedAt: -1 }).lean();
  return { assignment, data };
};

const gradeSubmission = async (user, submissionId, payload) => {
  const teacher = await findTeacherForUser(user);
  const submission = await AssignmentSubmission.findById(submissionId).populate('assignment');
  if (!submission || String(submission.assignment.teacher) !== String(teacher._id)) throw portalError('Submission not found', 404);
  if (payload.score === undefined || Number.isNaN(Number(payload.score)) || Number(payload.score) < 0 || Number(payload.score) > submission.assignment.totalMarks) throw portalError('Score must be within the assignment marks range', 422);
  submission.score = Number(payload.score);
  submission.feedback = payload.feedback?.trim() || '';
  submission.status = 'graded';
  submission.gradedAt = new Date();
  const savedSubmission = await submission.save();
  await Grade.findOneAndUpdate(
    { student: submission.student, batch: submission.assignment.batch, assessment: submission.assignment.title },
    {
      teacher: teacher._id,
      score: submission.score,
      maxScore: submission.assignment.totalMarks,
      feedback: submission.feedback,
      recordedAt: new Date(),
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  return savedSubmission;
};

const getGradebook = async (user, batchId) => {
  const teacher = await findTeacherForUser(user);
  const batch = await assertTeacherBatch(teacher, batchId);
  const [students, grades] = await Promise.all([
    Registration.find({ batch: batch.name }).sort({ name: 1 }).lean(),
    Grade.find({ batch: batch._id }).sort({ assessment: 1 }).lean(),
  ]);
  const gradeMap = new Map();
  grades.forEach((grade) => gradeMap.set(`${grade.student}:${grade.assessment}`, grade));
  return {
    batch,
    assessments: [...new Set(grades.map((grade) => grade.assessment))],
    data: students.map((student) => ({
      student,
      grades: grades.filter((grade) => String(grade.student) === String(student._id)),
    })),
  };
};

const saveGrade = async (user, payload) => {
  const teacher = await findTeacherForUser(user);
  const batch = await assertTeacherBatch(teacher, payload.batchId);
  const student = await Registration.findOne({ _id: payload.studentId, batch: batch.name }).lean();
  if (!student) throw portalError('Student is not enrolled in this batch', 422);
  if (!payload.assessment?.trim() || Number.isNaN(Number(payload.score)) || Number(payload.score) < 0 || Number(payload.maxScore || 100) <= 0) throw portalError('Assessment, score, and max score are required', 422);
  return Grade.findOneAndUpdate(
    { student: student._id, batch: batch._id, assessment: payload.assessment.trim() },
    { teacher: teacher._id, score: Number(payload.score), maxScore: Number(payload.maxScore || 100), feedback: payload.feedback?.trim() || '', recordedAt: new Date() },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
};

const getNotices = async (user) => {
  const teacher = await findTeacherForUser(user);
  return { data: await Notice.find({ archived: false, authorName: teacher.name }).sort({ publishedAt: -1 }).lean() };
};

const createNotice = async (user, payload) => {
  const teacher = await findTeacherForUser(user);
  const batch = payload.batchId ? await assertTeacherBatch(teacher, payload.batchId) : null;
  if (!payload.title?.trim() || !payload.message?.trim()) throw portalError('Title and message are required', 422);
  return Notice.create({ authorName: teacher.name, audience: payload.audience || 'student', batch: batch?._id, batchName: batch?.name, title: payload.title.trim(), message: payload.message.trim() });
};

const getFlags = async (user) => {
  const teacher = await findTeacherForUser(user);
  return { data: await StudentFlag.find({ teacher: teacher._id }).sort({ createdAt: -1 }).lean() };
};

const createFlag = async (user, payload) => {
  const teacher = await findTeacherForUser(user);
  if (!payload.studentId) throw portalError('Student is required', 422);
  if (!payload.reason?.trim()) throw portalError('A reason is required', 422);
  const student = await Registration.findById(payload.studentId).select('name rollNumber batch').lean();
  if (!student) throw portalError('Student not found', 404);
  const batch = await Batch.findOne({ _id: student.batch, teacher: teacher.name }).lean();
  if (!batch) throw portalError('Student is not enrolled in a batch assigned to this teacher', 403);
  return StudentFlag.create({
    teacher: teacher._id,
    student: student._id,
    studentName: student.name,
    rollNumber: student.rollNumber,
    batch: batch._id,
    batchName: batch.name,
    reason: payload.reason.trim(),
  });
};

const resolveFlag = async (user, flagId) => {
  const teacher = await findTeacherForUser(user);
  const flag = await StudentFlag.findOneAndUpdate(
    { _id: flagId, teacher: teacher._id },
    { $set: { status: 'resolved', resolvedAt: new Date() } },
    { new: true, lean: true }
  );
  if (!flag) throw portalError('Flag not found', 404);
  return flag;
};

const updateProfile = async (user, payload) => {
  const allowed = ['name', 'phone', 'specialization'];
  const updates = Object.fromEntries(allowed.filter((field) => payload[field] !== undefined).map((field) => [field, String(payload[field]).trim()]));
  const teacher = await Teacher.findOneAndUpdate({ email: user.email }, updates, { new: true, runValidators: true }).lean();
  if (!teacher) throw portalError('No teacher profile is linked to this account');
  return teacher;
};

const getPerformance = async (user, { batchId } = {}) => {
  const teacher = await findTeacherForUser(user);
  const batches = await getTeacherBatches(teacher);
  const activeBatchId = batchId || batches[0]?._id;
  if (!activeBatchId) throw portalError('No batch is assigned to this teacher', 404);
  const batch = await assertTeacherBatch(teacher, activeBatchId);

  const [students, assignments, grades, attendance, flags] = await Promise.all([
    Registration.find({ batch: batch.name }).sort({ name: 1 }).lean(),
    Assignment.find({ batch: batch._id, published: true }).sort({ dueAt: 1 }).lean(),
    Grade.find({ batch: batch._id }).lean(),
    Attendance.find({ batch: batch._id }).lean(),
    StudentFlag.find({ batch: batch._id, status: 'open' }).select('student').lean(),
  ]);
  const submissions = assignments.length
    ? await AssignmentSubmission.find({ assignment: { $in: assignments.map((assignment) => assignment._id) } }).populate('assignment', 'title totalMarks module dueAt').lean()
    : [];
  const openFlagIds = new Set(flags.map((flag) => String(flag.student)));

  const data = students.map((student) => {
    const sid = String(student._id);
    const studentSubs = submissions.filter((s) => String(s.student) === sid);
    const studentGrades = grades.filter((g) => String(g.student) === sid);
    const gradedSubs = studentSubs.filter((s) => s.status === 'graded' && s.score !== undefined);
    const attendanceRecords = attendance.filter((a) => String(a.student) === sid);
    const present = attendanceRecords.filter((a) => a.status === 'present' || a.status === 'late').length;
    const attendanceRate = attendanceRecords.length ? Math.round((present / attendanceRecords.length) * 100) : null;
    const avgSubmissionGrade = gradedSubs.length
      ? Math.round(gradedSubs.reduce((sum, s) => sum + ((s.score / (s.assignment?.totalMarks || 100)) * 100), 0) / gradedSubs.length)
      : null;
    const avgGradebook = studentGrades.length
      ? Math.round(studentGrades.reduce((sum, g) => sum + ((g.score / (g.maxScore || 100)) * 100), 0) / studentGrades.length)
      : null;
    return {
      student,
      flags: openFlagIds.has(sid),
      metrics: {
        attendanceRate,
        averageGrade: avgGradebook,
        avgSubmissionGrade,
        submitted: studentSubs.filter((s) => s.status).length,
        graded: gradedSubs.length,
        pending: assignments.length - gradedSubs.length,
        totalAssignments: assignments.length,
        attendanceSessions: attendanceRecords.length,
      },
      submissions: studentSubs,
    };
  });

  return { batch, assignments, data };
};

module.exports = { findTeacherForUser, getTeacherBatches, getDashboard, getRoster, getAttendance, saveAttendance, getAssignments, createAssignment, updateAssignment, getSubmissions, gradeSubmission, getGradebook, saveGrade, getNotices, createNotice, getFlags, createFlag, resolveFlag, getPerformance, updateProfile };
