const studentService = require('../services/studentPortalService');
const teacherService = require('../services/teacherPortalService');

const respond = (res, data, message) => res.json({ success: true, ...(message ? { message } : {}), data });
const handleError = (res, error) => {
  if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
  if (error.code === 11000) return res.status(409).json({ success: false, message: 'A record with these details already exists' });
  if (error.name === 'ValidationError') return res.status(422).json({ success: false, message: 'Validation failed', errors: Object.values(error.errors).map((item) => item.message) });
  console.error('portalController error:', error);
  return res.status(500).json({ success: false, message: 'Internal server error' });
};

const controller = (operation, { status = 200, message } = {}) => async (req, res) => {
  try {
    const data = await operation(req);
    return res.status(status).json({ success: true, ...(message ? { message } : {}), data });
  } catch (error) {
    return handleError(res, error);
  }
};

const student = {
  dashboard: controller((req) => studentService.getDashboard(req.user)),
  profile: controller((req) => studentService.getStudentProfile(req.user)),
  updateProfile: controller((req) => studentService.updateProfile(req.user, req.body), { message: 'Profile updated successfully' }),
  attendance: controller((req) => studentService.getAttendance(req.user, req.query)),
  assignments: controller((req) => studentService.getAssignments(req.user)),
  courses: controller((req) => studentService.getCourses(req.user)),
  submitAssignment: controller((req) => studentService.submitAssignment(req.user, req.params.assignmentId, req.body, req.file), { status: 201, message: 'Assignment submitted successfully' }),
  fees: controller((req) => studentService.getFees(req.user)),
  notices: controller((req) => studentService.getNotices(req.user)),
  addDocument: controller((req) => studentService.addDocument(req.user, req.body), { status: 201, message: 'Document added successfully' }),
};

const teacher = {
  dashboard: controller((req) => teacherService.getDashboard(req.user)),
  profile: controller((req) => teacherService.findTeacherForUser(req.user)),
  updateProfile: controller((req) => teacherService.updateProfile(req.user, req.body), { message: 'Profile updated successfully' }),
  batches: controller(async (req) => {
    const profile = await teacherService.findTeacherForUser(req.user);
    return teacherService.getTeacherBatches(profile);
  }),
  roster: controller((req) => teacherService.getRoster(req.user, req.params.batchId)),
  attendance: controller((req) => teacherService.getAttendance(req.user, req.query)),
  saveAttendance: controller((req) => teacherService.saveAttendance(req.user, req.body), { message: 'Attendance saved successfully' }),
  assignments: controller((req) => teacherService.getAssignments(req.user)),
  createAssignment: controller((req) => teacherService.createAssignment(req.user, req.body), { status: 201, message: 'Assignment published successfully' }),
  updateAssignment: controller((req) => teacherService.updateAssignment(req.user, req.params.assignmentId, req.body), { message: 'Assignment updated successfully' }),
  submissions: controller((req) => teacherService.getSubmissions(req.user, req.params.assignmentId)),
  gradeSubmission: controller((req) => teacherService.gradeSubmission(req.user, req.params.submissionId, req.body), { message: 'Submission graded successfully' }),
  gradebook: controller((req) => teacherService.getGradebook(req.user, req.query.batchId)),
  saveGrade: controller((req) => teacherService.saveGrade(req.user, req.body), { message: 'Grade saved successfully' }),
  performance: controller((req) => teacherService.getPerformance(req.user, req.query)),
  notices: controller((req) => teacherService.getNotices(req.user)),
  createNotice: controller((req) => teacherService.createNotice(req.user, req.body), { status: 201, message: 'Announcement posted successfully' }),
  flags: controller((req) => teacherService.getFlags(req.user)),
  createFlag: controller((req) => teacherService.createFlag(req.user, req.body), { status: 201, message: 'Student flagged for admin follow-up' }),
  resolveFlag: controller((req) => teacherService.resolveFlag(req.user, req.params.flagId), { message: 'Flag resolved successfully' }),
};

module.exports = { student, teacher, handleError };
