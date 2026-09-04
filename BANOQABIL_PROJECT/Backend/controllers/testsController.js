const mongoose = require('mongoose');
const Registration = require('../models/Registration');
const service = require('../services/testsService');

const isValidDate = (value) => !Number.isNaN(new Date(value).getTime());

function validateScheduleTest(body) {
  const errors = [];
  if (!body.scheduledAt || !isValidDate(body.scheduledAt)) errors.push('A valid test date is required');
  if (body.venue !== undefined && typeof body.venue !== 'string') errors.push('Test venue must be a string');
  return errors;
}

function validateRecordResult(body) {
  const errors = [];
  if (body.score === undefined || body.score === '') errors.push('Test score is required');
  else if (Number(body.score) < 0 || Number(body.score) > 100) errors.push('Test score must be between 0 and 100');
  if (!body.result) errors.push('Test result is required');
  else if (!['Passed', 'Failed'].includes(body.result)) errors.push('Test result must be Passed or Failed');
  return errors;
}

const handleError = (res, error) => {
  if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
  if (error.name === 'ValidationError') {
    return res.status(422).json({ success: false, message: 'Validation failed', errors: Object.values(error.errors).map((e) => e.message) });
  }
  console.error(error);
  return res.status(500).json({ success: false, message: 'Internal server error' });
};

const listTests = async (req, res) => {
  try { res.json({ success: true, ...(await service.getTests(req.query, req.campusScope)) }); }
  catch (error) { handleError(res, error); }
};

const getTest = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid registration ID' });
    const test = await service.getTest(req.params.id, req.campusScope);
    if (!test) return res.status(404).json({ success: false, message: 'Registration not found' });
    res.json({ success: true, data: test });
  } catch (error) { handleError(res, error); }
};

const scheduleTest = async (req, res) => {
  try {
    const errors = validateScheduleTest(req.body);
    if (errors.length) return res.status(422).json({ success: false, message: 'Validation failed', errors });
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid registration ID' });
    const registration = await Registration.findById(req.params.id);
    if (!registration || (req.campusScope && registration.campus !== req.campusScope)) return res.status(404).json({ success: false, message: 'Registration not found' });
    res.json({ success: true, message: 'Entry test scheduled successfully', data: await service.scheduleTest(registration, new Date(req.body.scheduledAt), req.body.venue) });
  } catch (error) { handleError(res, error); }
};

const recordResult = async (req, res) => {
  try {
    const errors = validateRecordResult(req.body);
    if (errors.length) return res.status(422).json({ success: false, message: 'Validation failed', errors });
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid registration ID' });
    const registration = await Registration.findById(req.params.id);
    if (!registration || (req.campusScope && registration.campus !== req.campusScope)) return res.status(404).json({ success: false, message: 'Registration not found' });
    res.json({ success: true, message: 'Test result recorded successfully', data: await service.recordResult(registration, Number(req.body.score), req.body.result) });
  } catch (error) { handleError(res, error); }
};

module.exports = { listTests, getTest, scheduleTest, recordResult };
