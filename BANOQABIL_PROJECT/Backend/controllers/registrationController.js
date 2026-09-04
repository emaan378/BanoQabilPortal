const mongoose = require('mongoose');
const Registration = require('../models/Registration');
const service = require('../services/registrationService');
const { STAGES, TEST_RESULTS, INTERVIEW_DECISIONS } = require('../utils/lifecycle');

const isValidDate = (value) => !Number.isNaN(new Date(value).getTime());

function validateCreateRegistration(body) {
  const errors = [];
  if (!body.name?.trim()) errors.push('Name is required');
  if (!/^\d{5}-\d{7}-\d$/.test(body.cnic || '')) errors.push('CNIC must be in 00000-0000000-0 format');
  if (!body.phone?.trim()) errors.push('Phone is required');
  if (!body.course?.trim()) errors.push('Course is required');
  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) errors.push('Invalid email address');
  return errors;
}

function validateStage(stage) {
  return STAGES.includes(stage);
}

function validateTest(body) {
  const errors = [];
  if (body.scheduledAt !== undefined && !isValidDate(body.scheduledAt)) errors.push('A valid test date is required');
  if (body.score !== undefined && (Number(body.score) < 0 || Number(body.score) > 100)) errors.push('Test score must be between 0 and 100');
  if (body.result && !TEST_RESULTS.includes(body.result)) errors.push('Invalid test result');
  return errors;
}

function validateInterview(body) {
  const errors = [];
  if (body.scheduledAt !== undefined && !isValidDate(body.scheduledAt)) errors.push('Invalid interview date');
  if (body.decision && !INTERVIEW_DECISIONS.includes(body.decision)) errors.push('Invalid interview decision');
  return errors;
}

const handleError = (res, error) => {
  if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
  if (error.code === 11000) return res.status(409).json({ success: false, message: 'Duplicate registration ID or CNIC' });
  if (error.name === 'ValidationError') {
    return res.status(422).json({ success: false, message: 'Validation failed', errors: Object.values(error.errors).map((e) => e.message) });
  }
  console.error(error);
  return res.status(500).json({ success: false, message: 'Internal server error' });
};

// A campus admin may only see/act on registrations belonging to their own campus.
const inScope = (registration, campusScope) => !campusScope || registration.campus === campusScope;
const outOfScope = (res) => res.status(404).json({ success: false, message: 'Registration not found' });

const getRegistrations = async (req, res) => {
  try { res.json({ success: true, ...(await service.getRegistrations(req.query, req.campusScope)) }); }
  catch (error) { handleError(res, error); }
};

const getRegistration = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid registration ID' });
    const registration = await Registration.findById(req.params.id).lean();
    if (!registration || !inScope(registration, req.campusScope)) return outOfScope(res);
    res.json({ success: true, data: registration });
  } catch (error) { handleError(res, error); }
};

const createRegistration = async (req, res) => {
  try {
    // A campus admin can only ever register students into their own campus.
    const payload = req.campusScope ? { ...req.body, campus: req.campusScope } : req.body;
    const errors = validateCreateRegistration(payload);
    if (errors.length) return res.status(422).json({ success: false, message: 'Validation failed', errors });
    const registration = await service.createRegistration(payload);
    res.status(201).json({ success: true, message: 'Registration created successfully', data: registration });
  } catch (error) { handleError(res, error); }
};

const updateRegistration = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid registration ID' });
    const registration = await service.updateRegistration(req.params.id, req.body, req.campusScope);
    if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });
    res.json({ success: true, message: 'Registration updated successfully', data: registration });
  } catch (error) { handleError(res, error); }
};

const advanceStage = async (req, res) => {
  try {
    if (!validateStage(req.body.stage)) return res.status(422).json({ success: false, message: 'Invalid pipeline stage' });
    const registration = await Registration.findById(req.params.id);
    if (!registration || !inScope(registration, req.campusScope)) return outOfScope(res);
    res.json({ success: true, message: 'Stage updated successfully', data: await service.advanceStage(registration, req.body.stage) });
  } catch (error) { handleError(res, error); }
};

const scheduleTest = async (req, res) => {
  try {
    const errors = validateTest(req.body);
    if (!req.body.scheduledAt) errors.push('A valid test date is required');
    if (errors.length) return res.status(422).json({ success: false, message: 'Validation failed', errors });
    const registration = await Registration.findById(req.params.id);
    if (!registration || !inScope(registration, req.campusScope)) return outOfScope(res);
    res.json({ success: true, message: 'Entry test scheduled successfully', data: await service.scheduleTest(registration, new Date(req.body.scheduledAt)) });
  } catch (error) { handleError(res, error); }
};

const recordTestResult = async (req, res) => {
  try {
    const { score, result } = req.body;
    const errors = validateTest({ score, result });
    if (score === undefined || !result) errors.push('Score and result are required');
    if (errors.length) return res.status(422).json({ success: false, message: 'Validation failed', errors });
    const registration = await Registration.findById(req.params.id);
    if (!registration || !inScope(registration, req.campusScope)) return outOfScope(res);
    res.json({ success: true, message: 'Test result recorded successfully', data: await service.recordTestResult(registration, Number(score), result) });
  } catch (error) { handleError(res, error); }
};

const scheduleInterview = async (req, res) => {
  try {
    const errors = validateInterview(req.body);
    if (!req.body.scheduledAt) errors.push('Interview date is required');
    if (errors.length) return res.status(422).json({ success: false, message: 'Validation failed', errors });
    const registration = await Registration.findById(req.params.id);
    if (!registration || !inScope(registration, req.campusScope)) return outOfScope(res);
    res.json({ success: true, message: 'Interview scheduled successfully', data: await service.scheduleInterview(registration, new Date(req.body.scheduledAt)) });
  } catch (error) { handleError(res, error); }
};

const updateInterview = async (req, res) => {
  try {
    const errors = validateInterview(req.body);
    if (errors.length) return res.status(422).json({ success: false, message: 'Validation failed', errors });
    const registration = await Registration.findById(req.params.id);
    if (!registration || !inScope(registration, req.campusScope)) return outOfScope(res);
    const payload = { ...req.body, scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : undefined };
    res.json({ success: true, message: 'Interview updated successfully', data: await service.updateInterview(registration, payload) });
  } catch (error) { handleError(res, error); }
};

const deleteRegistration = async (req, res) => {
  try {
    const existing = await Registration.findById(req.params.id);
    if (!existing || !inScope(existing, req.campusScope)) return outOfScope(res);
    await existing.deleteOne();
    res.json({ success: true, message: 'Registration deleted successfully' });
  } catch (error) { handleError(res, error); }
};

module.exports = { getRegistrations, getRegistration, createRegistration, updateRegistration, advanceStage, scheduleTest, recordTestResult, scheduleInterview, updateInterview, deleteRegistration };
