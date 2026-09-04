const mongoose = require('mongoose');
const Registration = require('../models/Registration');
const service = require('../services/interviewsService');

const isValidDate = (value) => !Number.isNaN(new Date(value).getTime());

function validateScheduleInterview(body) {
  const errors = [];
  if (!body.scheduledAt || !isValidDate(body.scheduledAt)) errors.push('A valid interview date is required');
  if (body.interviewer !== undefined && typeof body.interviewer !== 'string') errors.push('Interviewer must be a string');
  return errors;
}

function validateInterviewResult(body) {
  const errors = [];
  if (!body.result) errors.push('Interview result is required');
  else if (!['Passed', 'Failed'].includes(body.result)) errors.push('Interview result must be Passed or Failed');
  if (body.remarks !== undefined && typeof body.remarks !== 'string') errors.push('Interview remarks must be a string');
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

const listInterviews = async (req, res) => {
  try { res.json({ success: true, ...(await service.getInterviews(req.query, req.campusScope)) }); }
  catch (error) { handleError(res, error); }
};

const getInterview = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid registration ID' });
    const interview = await service.getInterview(req.params.id, req.campusScope);
    if (!interview) return res.status(404).json({ success: false, message: 'Registration not found' });
    res.json({ success: true, data: interview });
  } catch (error) { handleError(res, error); }
};

const scheduleInterview = async (req, res) => {
  try {
    const errors = validateScheduleInterview(req.body);
    if (errors.length) return res.status(422).json({ success: false, message: 'Validation failed', errors });
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid registration ID' });
    const registration = await Registration.findById(req.params.id);
    if (!registration || (req.campusScope && registration.campus !== req.campusScope)) return res.status(404).json({ success: false, message: 'Registration not found' });
    res.json({
      success: true,
      message: 'Interview scheduled successfully',
      data: await service.scheduleInterview(registration, new Date(req.body.scheduledAt), req.body.interviewer),
    });
  } catch (error) { handleError(res, error); }
};

const recordInterviewResult = async (req, res) => {
  try {
    const errors = validateInterviewResult(req.body);
    if (errors.length) return res.status(422).json({ success: false, message: 'Validation failed', errors });
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid registration ID' });
    const registration = await Registration.findById(req.params.id);
    if (!registration || (req.campusScope && registration.campus !== req.campusScope)) return res.status(404).json({ success: false, message: 'Registration not found' });
    res.json({
      success: true,
      message: 'Interview result recorded successfully',
      data: await service.recordInterviewResult(registration, req.body.result, req.body.remarks),
    });
  } catch (error) { handleError(res, error); }
};

module.exports = { listInterviews, getInterview, scheduleInterview, recordInterviewResult };
