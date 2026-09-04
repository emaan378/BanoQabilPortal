const Registration = require('../models/Registration');
const { TEST_STATUSES, escapeRegex, deriveTestStatus } = require('../utils/lifecycle');

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
      return { 'test.scheduledAt': null, 'test.result': { $in: ['Awaiting', null] } };
    case 'scheduled':
      return { 'test.scheduledAt': { $ne: null }, 'test.result': 'Awaiting' };
    case 'passed':
      return { 'test.result': 'Passed' };
    case 'failed':
      return { 'test.result': 'Failed' };
    default:
      return {};
  }
};

const getTests = async ({ status, search, page = 1, limit = 20 }, campusScope) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const baseQuery = buildBaseQuery(search);
  if (campusScope) baseQuery.campus = campusScope;
  const filterQuery = TEST_STATUSES.includes(status) ? statusQuery(status) : {};
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
    data: data.map((registration) => ({ ...registration, testStatus: deriveTestStatus(registration) })),
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

const getTest = async (id, campusScope) => {
  const query = campusScope ? { _id: id, campus: campusScope } : { _id: id };
  const registration = await Registration.findOne(query).lean();
  if (!registration) return null;
  return { ...registration, testStatus: deriveTestStatus(registration) };
};

const scheduleTest = async (registration, scheduledAt, venue) => {
  registration.test.scheduledAt = scheduledAt;
  registration.test.venue = venue || undefined;
  registration.test.result = 'Awaiting';
  registration.test.score = undefined;
  if (['registered', 'test-scheduled'].includes(registration.stage)) registration.stage = 'test-scheduled';
  return registration.save();
};

const recordResult = async (registration, score, result) => {
  registration.test.score = score;
  registration.test.result = result;
  return registration.save();
};

module.exports = { getTests, getTest, scheduleTest, recordResult, deriveTestStatus };
