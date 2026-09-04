const Registration = require('../models/Registration');
const Counter = require('../models/Counter');
const { STAGES } = require('../utils/lifecycle');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getNextRegistrationId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'registration' },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return `R-${String(counter.sequence).padStart(4, '0')}`;
};

const getRegistrations = async ({ search, stage, course, page = 1, limit = 20 }, campusScope) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const query = {};

  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    query.$or = [{ registrationId: regex }, { name: regex }, { cnic: regex }, { phone: regex }];
  }
  if (stage) query.stage = stage;
  if (course) query.course = new RegExp(`^${escapeRegex(course)}$`, 'i');
  if (campusScope) query.campus = campusScope;

  const [data, total] = await Promise.all([
    Registration.find(query).sort({ createdAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
    Registration.countDocuments(query),
  ]);

  return { data, pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } };
};

const createRegistration = async (payload) => {
  const duplicate = await Registration.findOne({ cnic: payload.cnic.trim() });
  if (duplicate) {
    const error = new Error('A registration already exists for this CNIC');
    error.statusCode = 409;
    throw error;
  }
  const registrationId = await getNextRegistrationId();
  return Registration.create({ ...payload, registrationId, stage: 'registered' });
};

const updateRegistration = async (id, payload, campusScope) => {
  const allowed = ['name', 'cnic', 'phone', 'email', 'address', 'guardianName', 'guardianContact', 'course', 'campus'];
  const updates = Object.fromEntries(allowed.filter((field) => payload[field] !== undefined).map((field) => [field, payload[field]]));

  if (updates.cnic) {
    const duplicate = await Registration.findOne({ cnic: updates.cnic, _id: { $ne: id } });
    if (duplicate) {
      const error = new Error('A registration already exists for this CNIC');
      error.statusCode = 409;
      throw error;
    }
  }
  const query = campusScope ? { _id: id, campus: campusScope } : { _id: id };
  return Registration.findOneAndUpdate(query, updates, { new: true, runValidators: true });
};

const advanceStage = async (registration, nextStage) => {
  const currentIndex = STAGES.indexOf(registration.stage);
  const nextIndex = STAGES.indexOf(nextStage);
  if (nextIndex !== currentIndex + 1) {
    const error = new Error(`Invalid stage transition from ${registration.stage} to ${nextStage}`);
    error.statusCode = 422;
    throw error;
  }
  if (nextStage === 'interview-passed' && registration.test.result !== 'Passed') {
    const error = new Error('Student must pass the entry test before interview approval');
    error.statusCode = 422;
    throw error;
  }
  if (nextStage === 'fee-verified' && registration.interview.decision !== 'Passed') {
    const error = new Error('Interview must be passed before fee verification');
    error.statusCode = 422;
    throw error;
  }
  registration.stage = nextStage;
  return registration.save();
};

const scheduleTest = async (registration, scheduledAt) => {
  registration.test.scheduledAt = scheduledAt;
  registration.test.result = 'Awaiting';
  registration.test.score = undefined;
  registration.stage = 'test-scheduled';
  return registration.save();
};

const recordTestResult = async (registration, score, result) => {
  registration.test.score = score;
  registration.test.result = result;
  return registration.save();
};

const scheduleInterview = async (registration, scheduledAt) => {
  registration.interview.scheduledAt = scheduledAt;
  registration.interview.decision = 'Awaiting';
  registration.interview.remarks = undefined;
  return registration.save();
};

const updateInterview = async (registration, payload) => {
  if (payload.scheduledAt !== undefined) registration.interview.scheduledAt = payload.scheduledAt;
  if (payload.remarks !== undefined) registration.interview.remarks = payload.remarks;
  if (payload.decision !== undefined) {
    registration.interview.decision = payload.decision;
    if (payload.decision === 'Passed') registration.stage = 'interview-passed';
  }
  return registration.save();
};

module.exports = { getRegistrations, createRegistration, updateRegistration, advanceStage, scheduleTest, recordTestResult, scheduleInterview, updateInterview, getNextRegistrationId };
