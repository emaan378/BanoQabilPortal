const Registration = require('../models/Registration');
const Campus = require('../models/Campus');
const Course = require('../models/Course');
const Teacher = require('../models/Teacher');
const Batch = require('../models/Batch');
const { deriveTestStatus, deriveInterviewStatus } = require('../utils/lifecycle');
const { attachEnrollment } = require('../services/catalogService');

// @desc    Get full report summary for Reports & Analytics page
// @route   GET /api/v1/reports/overview
// @access  Private
const getReportOverview = async (req, res) => {
  try {
    const campusScope = req.campusScope;
    const regQuery = campusScope ? { campus: campusScope } : {};
    const teacherQuery = campusScope ? { campus: campusScope } : {};
    const campusQuery = campusScope ? { name: campusScope } : {};
    const courseQuery = campusScope ? { campus: campusScope } : {};
    const scopedCourseNames = campusScope ? await Course.find({ campus: campusScope }).distinct('name') : null;
    const batchQuery = scopedCourseNames ? { course: { $in: scopedCourseNames } } : {};

    const [students, teachers, campuses, courses, batchRows, byCampus, byCourse] = await Promise.all([
      Registration.find(regQuery).lean(),
      Teacher.find(teacherQuery).sort({ name: 1 }).lean(),
      Campus.find(campusQuery).sort({ name: 1 }).lean(),
      Course.find(courseQuery).sort({ name: 1 }).lean(),
      Batch.find(batchQuery).sort({ name: 1 }).lean(),
      Registration.aggregate([
        ...(campusScope ? [{ $match: { campus: campusScope } }] : []),
        { $group: { _id: '$campus', students: { $sum: 1 }, enrolled: { $sum: { $cond: [{ $in: ['$stage', ['enrolled']] }, 1, 0] } } } },
      ]),
      Registration.aggregate([
        { $match: { course: { $exists: true, $ne: '' }, ...(campusScope ? { campus: campusScope } : {}) } },
        { $group: { _id: '$course', students: { $sum: 1 } } },
      ]),
    ]);

    const batchList = await attachEnrollment(batchRows);

    const count = (predicate) => students.filter(predicate).length;

    const breakdown = {
      reg: {
        registered: count((s) => s.stage === 'registered'),
        'test-scheduled': count((s) => s.stage === 'test-scheduled'),
        'interview-passed': count((s) => s.stage === 'interview-passed'),
        'fee-verified': count((s) => s.stage === 'fee-verified'),
        enrolled: count((s) => s.stage === 'enrolled'),
      },
      test: {
        pending: count((s) => deriveTestStatus(s) === 'pending'),
        scheduled: count((s) => deriveTestStatus(s) === 'scheduled'),
        passed: count((s) => deriveTestStatus(s) === 'passed'),
        failed: count((s) => deriveTestStatus(s) === 'failed'),
      },
      interview: {
        pending: count((s) => deriveInterviewStatus(s) === 'pending'),
        scheduled: count((s) => deriveInterviewStatus(s) === 'scheduled'),
        passed: count((s) => deriveInterviewStatus(s) === 'passed'),
        failed: count((s) => deriveInterviewStatus(s) === 'failed'),
      },
      allocation: {
        pending: count((s) => s.batchAllocationStatus === 'pending'),
        allocated: count((s) => s.batchAllocationStatus === 'allocated'),
      },
      fee: {
        paid: count((s) => s.feeStatus === 'paid'),
        unpaid: count((s) => s.feeStatus === 'unpaid'),
        partial: count((s) => s.feeStatus === 'partial'),
      },
    };

    res.json({
      success: true,
      data: {
        summary: {
          totalStudents: students.length,
          totalTeachers: teachers.length,
          totalCampuses: campuses.length,
          totalCourses: courses.length,
          totalBatches: batchList.length,
        },
        breakdown,
        batches: batchList,
        byCampus: byCampus.map((row) => ({ campus: row._id || 'Unassigned', students: row.students, enrolled: row.enrolled })),
        byCourse: byCourse.map((row) => ({ course: row._id, students: row.students })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getReportOverview };
