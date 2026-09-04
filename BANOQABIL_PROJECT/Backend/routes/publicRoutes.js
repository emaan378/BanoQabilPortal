const express = require('express');
const service = require('../services/catalogService');
const registrationService = require('../services/registrationService');

const validateCreateRegistration = (body) => {
  const errors = [];
  if (!body.name?.trim()) errors.push('Name is required');
  if (!/^\d{5}-\d{7}-\d$/.test(body.cnic || '')) errors.push('CNIC must be in 00000-0000000-0 format');
  if (!body.phone?.trim()) errors.push('Phone is required');
  if (!body.course?.trim()) errors.push('Course is required');
  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) errors.push('Invalid email address');
  return errors;
};

const router = express.Router();

const handleError = (res, error) => {
  console.error(error);
  res.status(500).json({ success: false, message: 'Internal server error' });
};

router.get('/courses', async (req, res) => {
  try {
    res.json({ success: true, data: await service.listPublicCourses() });
  } catch (error) {
    handleError(res, error);
  }
});

router.get('/campuses', async (req, res) => {
  try {
    res.json({ success: true, data: await service.listPublicCampuses() });
  } catch (error) {
    handleError(res, error);
  }
});

router.get('/testimonials', async (req, res) => {
  try {
    res.json({ success: true, data: await service.listPublicTestimonials() });
  } catch (error) {
    handleError(res, error);
  }
});

// Public admissions form submission from the landing page — no auth required.
router.post('/registrations', async (req, res) => {
  try {
    const errors = validateCreateRegistration(req.body);
    if (errors.length) return res.status(422).json({ success: false, message: 'Validation failed', errors });
    const registration = await registrationService.createRegistration(req.body);
    res.status(201).json({ success: true, message: 'Registration submitted successfully', data: registration });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'A registration already exists for this CNIC' });
    if (error.name === 'ValidationError') {
      return res.status(422).json({ success: false, message: 'Validation failed', errors: Object.values(error.errors).map((e) => e.message) });
    }
    handleError(res, error);
  }
});

module.exports = router;
