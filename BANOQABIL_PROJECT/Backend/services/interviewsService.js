const Registration = require('../models/Registration');
const { INTERVIEW_STATUSES, escapeRegex, deriveTestStatus, deriveInterviewStatus } = require('../utils/lifecycle');

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
    ];
  }
  return query;
};

const statusQuery = (status) => {
  switch (status) {
    case 'pending':
      return { 'interview.scheduledAt': null };
    case 'scheduled':
      return { 'interview.scheduledAt': { $ne: null }, 'interview.decision': 'Awaiting' };
    case 'passed':
      return { 'interview.decision': 'Passed' };
    case 'failed':
      return { 'interview.decision': 'Failed' };
    default:
      return {};
  }
};

const getInterviews = async ({ status, search, page = 1, limit = 20 }, campusScope) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const baseQuery = buildBaseQuery(search);
  if (campusScope) baseQuery.campus = campusScope;
  const filterQuery = INTERVIEW_STATUSES.includes(status) ? statusQuery(status) : {};
  const query = { ...baseQuery, ...filterQuery };

  const [data, total, counts] = await Promise.all([
    Registration.find(query).sort({ createdAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
    Registration.countDocuments(query),
    Promise.all([
      Registration.countDocuments(baseQuery),
      Registration.countDocuments({ ...baseQuery, ...statusQuery('pending') }),
      Registration.countDocuments({ ...baseQuery, ...statusQuery('scheduled') }),
      Registration.countDocuments({ ...baseQuery, ...statusQuery('passed') }),
      Registration.countDocuments({ ...baseQuery, ...statusQuery('failed') }),
    ]),
  ]);

  return {
    data: data.map((registration) => ({
      ...registration,
      testStatus: deriveTestStatus(registration),
      interviewStatus: deriveInterviewStatus(registration),
    })),
    pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) },
    counts: {
      all: counts[0],
      pending: counts[1],
      scheduled: counts[2],
      passed: counts[3],
      failed: counts[4],
    },
  };
};

const getInterview = async (id, campusScope) => {
  const query = campusScope ? { _id: id, campus: campusScope } : { _id: id };
  const registration = await Registration.findOne(query).lean();
  if (!registration) return null;
  return {
    ...registration,
    testStatus: deriveTestStatus(registration),
    interviewStatus: deriveInterviewStatus(registration),
  };
};

const scheduleInterview = async (registration, scheduledAt, interviewer) => {
  if (registration.test.result !== 'Passed') {
    const error = new Error('Student must pass the entry test before an interview can be scheduled');
    error.statusCode = 422;
    throw error;
  }
  registration.interview.scheduledAt = scheduledAt;
  registration.interview.interviewer = interviewer || undefined;
  registration.interview.decision = 'Awaiting';
  registration.interview.remarks = undefined;
  return registration.save();
};

const recordInterviewResult = async (registration, result, remarks) => {
  registration.interview.decision = result;
  if (remarks !== undefined) registration.interview.remarks = remarks;
  if (result === 'Passed') {
    registration.stage = 'interview-passed';
    if (registration.batchAllocationStatus === 'pending' && registration.test.result === 'Passed') {
      registration.batchAllocationStatus = 'allocated';
    }
  } else if (registration.stage === 'interview-passed') {
    registration.stage = 'test-scheduled';
  }
  return registration.save();
};

module.exports = { getInterviews, getInterview, scheduleInterview, recordInterviewResult };
