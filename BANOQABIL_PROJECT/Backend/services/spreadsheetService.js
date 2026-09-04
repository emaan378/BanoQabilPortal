const XLSX = require('xlsx');
const mongoose = require('mongoose');
const Registration = require('../models/Registration');
const Teacher = require('../models/Teacher');
const Batch = require('../models/Batch');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Grade = require('../models/Grade');
const Voucher = require('../models/Voucher');
const { deriveStatuses } = require('../utils/lifecycle');
const { getNextRegistrationId } = require('./registrationService');
const { findStudentForUser } = require('./studentPortalService');
const { findTeacherForUser, getTeacherBatches } = require('./teacherPortalService');

const portalError = (message, statusCode = 422) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const workbookBuffer = (sheets) => {
  const workbook = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) {
    const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Message: 'No records found' }]);
    sheet['!cols'] = Object.keys(rows[0] || { Message: '' }).map((key) => ({ wch: Math.min(Math.max(String(key).length + 3, 14), 34) }));
    XLSX.utils.book_append_sheet(workbook, sheet, name.slice(0, 31));
  }
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

const parseRows = (buffer, preferredSheet) => {
  if (!buffer) throw portalError('Please upload an Excel file');
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheetName = preferredSheet && workbook.SheetNames.includes(preferredSheet) ? preferredSheet : workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw portalError('The Excel workbook has no worksheets');
  return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
};

const key = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
const valueOf = (row, ...names) => {
  const entry = Object.entries(row).find(([name]) => names.map(key).includes(key(name)));
  return entry ? String(entry[1] ?? '').trim() : '';
};
const cnicOf = (row) => {
  const value = valueOf(row, 'CNIC', 'CNIC Number', 'CNIC No', 'National ID', 'National Identity Card');
  const digits = value.replace(/\D/g, '');
  return digits.length === 13 ? `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}` : value;
};
const numberOf = (row, ...names) => {
  const value = Number(valueOf(row, ...names));
  return Number.isFinite(value) ? value : null;
};
const dateOf = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
const idMatch = (value) => value && mongoose.isValidObjectId(value) ? { _id: value } : null;

const studentRows = (students) => students.map((student) => ({
  'Student ID': student.registrationId || '',
  'Mongo ID': String(student._id),
  'Roll Number': student.rollNumber || '',
  Name: student.name || '',
  Email: student.email || '',
  Phone: student.phone || '',
  CNIC: student.cnic || '',
  Address: student.address || '',
  Campus: student.campus || '',
  Course: student.course || '',
  Batch: student.batch || '',
  Stage: student.stage || '',
  'Fee Status': student.feeStatus || '',
  'Fee Amount': student.feeAmount || 0,
  'Fee Paid': student.feePaid || 0,
  'Test Status': deriveStatuses(student).testStatus,
  'Interview Status': deriveStatuses(student).interviewStatus,
}));

const teacherRows = (teachers) => teachers.map((teacher) => ({
  'Teacher ID': teacher.teacherId || '',
  'Mongo ID': String(teacher._id),
  Name: teacher.name || '',
  Email: teacher.email || '',
  Phone: teacher.phone || '',
  Specialization: teacher.specialization || '',
  Campus: teacher.campus || '',
}));

const exportStudents = async (campusScope, search = '') => {
  const query = campusScope ? { campus: campusScope } : {};
  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ registrationId: regex }, { rollNumber: regex }, { name: regex }, { cnic: regex }, { email: regex }];
    const objectIdQuery = idMatch(search);
    if (objectIdQuery) query.$or.push(objectIdQuery);
  }
  const students = await Registration.find(query).sort({ createdAt: -1 }).lean();
  return workbookBuffer({ Students: studentRows(students) });
};

const importStudents = async (buffer, campusScope) => {
  const rows = parseRows(buffer);
  const result = { created: 0, updated: 0, skipped: 0, errors: [] };
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const rowNumber = index + 2;
    const name = valueOf(row, 'Name', 'Student Name', 'Full Name');
    const cnic = cnicOf(row);
    const phone = valueOf(row, 'Phone', 'Phone Number', 'Mobile', 'Mobile Number', 'Contact', 'Contact Number');
    const course = valueOf(row, 'Course', 'Course Name', 'Program', 'Program Name');
    if (!name || !/^\d{5}-\d{7}-\d$/.test(cnic) || !phone || !course) {
      result.skipped += 1;
      result.errors.push(`Row ${rowNumber}: Name, valid CNIC, phone, and course are required`);
      continue;
    }
    const campus = campusScope || valueOf(row, 'Campus') || 'Faisalabad Campus';
    const registrationId = valueOf(row, 'Student ID', 'Registration ID');
    const mongoId = valueOf(row, 'Mongo ID', 'Database ID');
    const existing = (mongoId && idMatch(mongoId) ? await Registration.findOne({ ...idMatch(mongoId), ...(campusScope ? { campus: campusScope } : {}) }) : null)
      || (registrationId ? await Registration.findOne({ registrationId, ...(campusScope ? { campus: campusScope } : {}) }) : null)
      || await Registration.findOne({ cnic, ...(campusScope ? { campus: campusScope } : {}) });
    const payload = {
      name, cnic, phone, course, campus,
      email: valueOf(row, 'Email') || undefined,
      address: valueOf(row, 'Address') || undefined,
      batch: valueOf(row, 'Batch') || undefined,
      rollNumber: valueOf(row, 'Roll Number', 'Roll No') || undefined,
      stage: valueOf(row, 'Stage') || 'registered',
      feeStatus: valueOf(row, 'Fee Status') || 'unpaid',
      feeAmount: numberOf(row, 'Fee Amount') ?? 0,
      feePaid: numberOf(row, 'Fee Paid') ?? 0,
    };
    try {
      if (existing) {
        await Registration.findByIdAndUpdate(existing._id, payload, { runValidators: true });
        result.updated += 1;
      } else {
        await Registration.create({ ...payload, registrationId: registrationId || await getNextRegistrationId() });
        result.created += 1;
      }
    } catch (error) {
      result.skipped += 1;
      result.errors.push(`Row ${rowNumber}: ${error.message}`);
    }
  }
  return result;
};

const exportTeachers = async (campusScope, search = '') => {
  const query = campusScope ? { campus: campusScope } : {};
  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ teacherId: regex }, { name: regex }, { email: regex }, { phone: regex }, { specialization: regex }];
    const objectIdQuery = idMatch(search);
    if (objectIdQuery) query.$or.push(objectIdQuery);
  }
  const teachers = await Teacher.find(query).sort({ name: 1 }).lean();
  return workbookBuffer({ Teachers: teacherRows(teachers) });
};

const importTeachers = async (buffer, campusScope) => {
  const rows = parseRows(buffer);
  const result = { created: 0, updated: 0, skipped: 0, errors: [] };
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const rowNumber = index + 2;
    const name = valueOf(row, 'Name', 'Teacher Name');
    const phone = valueOf(row, 'Phone', 'Phone Number');
    const specialization = valueOf(row, 'Specialization');
    if (!name || !phone || !specialization) {
      result.skipped += 1;
      result.errors.push(`Row ${rowNumber}: Name, phone, and specialization are required`);
      continue;
    }
    const campus = campusScope || valueOf(row, 'Campus') || 'Faisalabad Campus';
    const teacherId = valueOf(row, 'Teacher ID');
    const mongoId = valueOf(row, 'Mongo ID', 'Database ID');
    const email = valueOf(row, 'Email').toLowerCase();
    const existing = (mongoId && idMatch(mongoId) ? await Teacher.findOne({ ...idMatch(mongoId), ...(campusScope ? { campus: campusScope } : {}) }) : null)
      || (teacherId ? await Teacher.findOne({ teacherId, ...(campusScope ? { campus: campusScope } : {}) }) : null)
      || (email ? await Teacher.findOne({ email, ...(campusScope ? { campus: campusScope } : {}) }) : null);
    const payload = { name, email: email || undefined, phone, specialization, campus };
    try {
      if (existing) {
        await Teacher.findByIdAndUpdate(existing._id, payload, { runValidators: true });
        result.updated += 1;
      } else {
        await Teacher.create({ ...payload, ...(teacherId ? { teacherId } : {}) });
        result.created += 1;
      }
    } catch (error) {
      result.skipped += 1;
      result.errors.push(`Row ${rowNumber}: ${error.message}`);
    }
  }
  return result;
};

const exportStudentPortal = async (user) => {
  const student = await findStudentForUser(user);
  const [attendance, assignments, grades, fees] = await Promise.all([
    Attendance.find({ student: student._id }).sort({ date: -1 }).lean(),
    student.batch ? Assignment.find({ batchName: student.batch, published: true }).sort({ dueAt: 1 }).lean() : [],
    Grade.find({ student: student._id }).sort({ recordedAt: -1 }).lean(),
    Voucher.find({ $or: [{ registration: student._id }, { rollNumber: student.rollNumber || '__none__' }] }).sort({ createdAt: -1 }).lean(),
  ]);
  return workbookBuffer({
    Profile: studentRows([student]),
    Attendance: attendance.map((item) => ({ Date: item.date, Status: item.status, Notes: item.notes || '' })),
    Assignments: assignments.map((item) => ({ Title: item.title, Module: item.module || '', 'Due Date': item.dueAt, 'Total Marks': item.totalMarks })),
    Grades: grades.map((item) => ({ Assessment: item.assessment, Score: item.score, 'Max Score': item.maxScore, Feedback: item.feedback || '' })),
    Fees: fees.map((item) => ({ 'Tracking ID': item.trackingId, Description: item.description, Amount: item.amount, Status: item.status, 'Due Date': item.dueDate || '' })),
  });
};

const importStudentPortal = async (buffer, user) => {
  const rows = parseRows(buffer);
  const row = rows[0];
  if (!row) throw portalError('The Excel sheet is empty');
  const student = await findStudentForUser(user);
  const updates = {};
  for (const [field, aliases] of Object.entries({ name: ['Name', 'Student Name'], phone: ['Phone'], address: ['Address'], guardianName: ['Guardian Name'], guardianContact: ['Guardian Contact'] })) {
    const value = valueOf(row, ...aliases);
    if (value) updates[field] = value;
  }
  if (!Object.keys(updates).length) throw portalError('No editable profile fields were found in the first worksheet');
  return Registration.findByIdAndUpdate(student._id, updates, { new: true, runValidators: true }).lean();
};

const exportTeacherPortal = async (user) => {
  const teacher = await findTeacherForUser(user);
  const batches = await getTeacherBatches(teacher);
  const batchIds = batches.map((batch) => batch._id);
  const students = await Registration.find({ batch: { $in: batches.map((batch) => batch.name) } }).sort({ name: 1 }).lean();
  const [assignments, grades, attendance] = await Promise.all([
    Assignment.find({ teacher: teacher._id }).sort({ dueAt: 1 }).lean(),
    Grade.find({ teacher: teacher._id }).sort({ recordedAt: -1 }).lean(),
    Attendance.find({ teacher: teacher._id }).sort({ date: -1 }).limit(500).lean(),
  ]);
  return workbookBuffer({
    Profile: teacherRows([teacher]),
    Batches: batches.map((batch) => ({ 'Batch ID': String(batch._id), Name: batch.name, Course: batch.course, Room: batch.room || '', Days: batch.days || '', Time: batch.time || '', Capacity: batch.capacity })),
    Roster: students.map((student) => ({ 'Student ID': student.registrationId, 'Mongo ID': String(student._id), Name: student.name, Email: student.email || '', Batch: student.batch || '' })),
    Assignments: assignments.map((assignment) => ({ 'Assignment ID': String(assignment._id), Title: assignment.title, Module: assignment.module || '', Batch: assignment.batchName || '', 'Due Date': assignment.dueAt, 'Total Marks': assignment.totalMarks })),
    Gradebook: grades.map((grade) => ({ 'Student ID': String(grade.student), 'Batch ID': String(grade.batch), Assessment: grade.assessment, Score: grade.score, 'Max Score': grade.maxScore, Feedback: grade.feedback || '' })),
    Attendance: attendance.map((item) => ({ 'Student ID': String(item.student), 'Batch ID': String(item.batch), Date: item.date, Status: item.status, Notes: item.notes || '' })),
  });
};

const importTeacherPortal = async (buffer, user) => {
  const rows = parseRows(buffer, 'Gradebook');
  const teacher = await findTeacherForUser(user);
  const batches = await getTeacherBatches(teacher);
  const result = { created: 0, updated: 0, skipped: 0, errors: [] };
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const rowNumber = index + 2;
    const batchId = valueOf(row, 'Batch ID');
    const batch = batches.find((item) => String(item._id) === batchId || item.name === valueOf(row, 'Batch'));
    const studentRef = valueOf(row, 'Student ID', 'Roll Number', 'Mongo ID');
    const student = studentRef && idMatch(studentRef) ? await Registration.findById(studentRef).lean() : await Registration.findOne({ $or: [{ registrationId: studentRef }, { rollNumber: studentRef }] }).lean();
    const assessment = valueOf(row, 'Assessment');
    const score = numberOf(row, 'Score');
    const maxScore = numberOf(row, 'Max Score') || 100;
    if (!batch || !student || student.batch !== batch.name || !assessment || score === null || score < 0 || score > maxScore) {
      result.skipped += 1;
      result.errors.push(`Row ${rowNumber}: valid assigned batch, student ID, assessment, and score are required`);
      continue;
    }
    try {
      const existing = await Grade.findOne({ student: student._id, batch: batch._id, assessment });
      await Grade.findOneAndUpdate({ student: student._id, batch: batch._id, assessment }, { teacher: teacher._id, score, maxScore, feedback: valueOf(row, 'Feedback'), recordedAt: new Date() }, { upsert: true, new: true, runValidators: true });
      if (existing) result.updated += 1; else result.created += 1;
    } catch (error) {
      result.skipped += 1;
      result.errors.push(`Row ${rowNumber}: ${error.message}`);
    }
  }
  return result;
};

module.exports = { exportStudents, importStudents, exportTeachers, importTeachers, exportStudentPortal, importStudentPortal, exportTeacherPortal, importTeacherPortal };
