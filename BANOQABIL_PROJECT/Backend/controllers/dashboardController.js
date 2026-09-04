const Registration = require('../models/Registration');
const Campus = require('../models/Campus');
const Course = require('../models/Course');
const Teacher = require('../models/Teacher');
const Batch = require('../models/Batch');
const StudentFlag = require('../models/StudentFlag');
const { deriveStatuses } = require('../utils/lifecycle');
const { attachEnrollment } = require('../services/catalogService');

const withStatuses = (list) => list.map((registration) => ({ ...registration, ...deriveStatuses(registration) }));

// @desc    Get complete dashboard summary metrics & per-category lists
// @route   GET /api/v1/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const campusScope = req.campusScope;
    const regQuery = campusScope ? { campus: campusScope } : {};
    const teacherQuery = campusScope ? { campus: campusScope } : {};
    // Batch has no direct campus field — it's linked via its course's campus.
    const scopedCourseNames = campusScope ? await Course.find({ campus: campusScope }).distinct('name') : null;
    const batchQuery = scopedCourseNames ? { course: { $in: scopedCourseNames } } : {};
    const campusQuery = campusScope ? { name: campusScope } : {};
    const courseQuery = campusScope ? { campus: campusScope } : {};

    const [totalStudents, totalTeachers, totalCampuses, totalCourses, totalBatches] = await Promise.all([
      Registration.countDocuments(regQuery),
      Teacher.countDocuments(teacherQuery),
      Campus.countDocuments(campusQuery),
      Course.countDocuments(courseQuery),
      Batch.countDocuments(batchQuery),
    ]);

    const [
      students,
      teacherList,
      campusList,
      courseList,
      batchRows,
      pendingRegistrations,
      pendingInterviews,
      pendingBatchAllocations,
      pendingFeePayments,
      recentRegistrations,
      openFlags,
    ] = await Promise.all([
      Registration.find(regQuery).sort({ createdAt: -1 }).limit(20).lean(),
      Teacher.find(teacherQuery).sort({ name: 1 }).limit(20).lean(),
      Campus.find(campusQuery).sort({ name: 1 }).limit(20).lean(),
      Course.find(courseQuery).sort({ name: 1 }).limit(20).lean(),
      Batch.find(batchQuery).sort({ name: 1 }).limit(20).lean(),
      Registration.find({ ...regQuery, stage: 'registered' }).sort({ createdAt: -1 }).limit(20).lean(),
      Registration.find({ ...regQuery, 'test.result': 'Passed', 'interview.decision': { $ne: 'Passed' } }).sort({ createdAt: -1 }).limit(20).lean(),
      Registration.find({ ...regQuery, batchAllocationStatus: 'pending' }).sort({ createdAt: -1 }).limit(20).lean(),
      Registration.find({ ...regQuery, feeStatus: { $ne: 'paid' } }).sort({ createdAt: -1 }).limit(20).lean(),
      Registration.find(regQuery).sort({ createdAt: -1 }).limit(5).lean(),
      StudentFlag.find({ status: 'open' }).populate('teacher', 'name email').sort({ createdAt: -1 }).limit(20).lean(),
    ]);

    const batchList = await attachEnrollment(batchRows);

    res.json({
      success: true,
      metrics: {
        totalStudents,
        totalTeachers,
        totalCampuses,
        totalCourses,
        totalBatches,
        pendingRegistrations: pendingRegistrations.length,
        pendingInterviews: pendingInterviews.length,
        pendingBatchAllocations: pendingBatchAllocations.length,
        pendingFeePayments: pendingFeePayments.length,
        pendingFlags: openFlags.length,
      },
      lists: {
        students: withStatuses(students),
        teachers: teacherList,
        campuses: campusList,
        courses: courseList,
        batches: batchList,
        pendingRegistrations: withStatuses(pendingRegistrations),
        pendingInterviews: withStatuses(pendingInterviews),
        pendingBatchAllocations: withStatuses(pendingBatchAllocations),
        pendingFeePayments: withStatuses(pendingFeePayments),
        studentFlags: openFlags,
      },
      recentRegistrations: withStatuses(recentRegistrations),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Seed Initial Dummy Data for UI Matching
// @route   POST /api/v1/dashboard/seed
// @access  Private
const seedInitialData = async (req, res) => {
  try {
    await Registration.deleteMany({}); // clear existing demo data

    const sampleRegistrations = [
      { name: 'Ahmed Hassan', cnic: '33100-1234567-1', phone: '0300-1234567', course: 'Web Development', stage: 'enrolled' },
      { name: 'Fatima Malik', cnic: '33100-2345678-2', phone: '0301-2345678', course: 'Graphic Design', stage: 'fee-verified' },
      { name: 'Usman Ali', cnic: '33100-3456789-3', phone: '0302-3456789', course: 'Digital Marketing', stage: 'registered' },
      { name: 'Zainab Bibi', cnic: '33100-4567890-4', phone: '0303-4567890', course: 'Python Programming', stage: 'registered' },
      { name: 'Bilal Khan', cnic: '33100-5678901-5', phone: '0304-5678901', course: 'E-Commerce', stage: 'registered' },
    ];

    await Registration.insertMany(sampleRegistrations);
    res.status(201).json({ success: true, message: 'Sample Data Seeded Successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Resolve a student flag (admin follow-up complete)
// @route   PATCH /api/v1/dashboard/flags/:id/resolve
// @access  Private (admin)
const resolveFlag = async (req, res) => {
  try {
    const flag = await StudentFlag.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'resolved', resolvedAt: new Date() } },
      { new: true, runValidators: true }
    ).lean();
    if (!flag) return res.status(404).json({ success: false, message: 'Flag not found' });
    res.json({ success: true, message: 'Flag resolved', data: flag });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  seedInitialData,
  resolveFlag,
};
