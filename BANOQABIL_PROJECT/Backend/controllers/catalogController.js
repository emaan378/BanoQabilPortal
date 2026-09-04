const mongoose = require('mongoose');
const service = require('../services/catalogService');

const BATCH_STATUSES = ['open', 'full', 'closed'];

const requiredText = (body, field, label, errors) => {
  if (!body[field]?.trim()) errors.push(`${label} is required`);
};

const validateCampusFormats = (body, errors) => {
  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) errors.push('Email must be a valid address');
  if (body.phone && !/^[+\d][\d\-() ]{6,}$/.test(body.phone.trim())) errors.push('Phone must be a valid number');
  if (body.capacity !== undefined && (Number.isNaN(Number(body.capacity)) || Number(body.capacity) < 1)) {
    errors.push('Capacity must be a positive number');
  }
  if (body.establishedYear !== undefined && !/^\d{4}$/.test(String(body.establishedYear))) {
    errors.push('Established year must be a 4-digit year');
  }
  if (body.zip !== undefined && body.zip.trim() && !/^[A-Za-z0-9\- ]{3,10}$/.test(body.zip.trim())) {
    errors.push('ZIP code must be 3-10 alphanumeric characters');
  }
  return errors;
};

const validateCampus = (body) => {
  const errors = [];
  requiredText(body, 'name', 'Campus name', errors);
  requiredText(body, 'city', 'City', errors);
  return validateCampusFormats(body, errors);
};

const validateCampusUpdate = (body) => validateCampusFormats(body, []);

const validateCourse = (body) => {
  const errors = [];
  requiredText(body, 'name', 'Course name', errors);
  requiredText(body, 'campus', 'Campus', errors);
  requiredText(body, 'duration', 'Course duration', errors);
  return errors;
};

const validateBatch = (body) => {
  const errors = [];
  requiredText(body, 'name', 'Batch name', errors);
  requiredText(body, 'course', 'Course', errors);
  if (body.capacity !== undefined && (Number(body.capacity) < 1 || Number.isNaN(Number(body.capacity)))) {
    errors.push('Capacity must be a positive number');
  }
  if (body.status !== undefined && !BATCH_STATUSES.includes(body.status)) {
    errors.push('Batch status must be open, full, or closed');
  }
  return errors;
};

const validateAllocate = (body) => {
  const errors = [];
  if (!Array.isArray(body.studentIds) || body.studentIds.length === 0) {
    errors.push('At least one student must be selected');
    return errors;
  }
  const invalid = body.studentIds.filter((id) => !mongoose.isValidObjectId(id));
  if (invalid.length) errors.push('One or more student IDs are invalid');
  return errors;
};

const validateTestimonial = (body) => {
  const errors = [];
  requiredText(body, 'name', 'Student name', errors);
  requiredText(body, 'course', 'Course', errors);
  requiredText(body, 'text', 'Testimonial text', errors);
  if (body.rating !== undefined && (Number.isNaN(Number(body.rating)) || Number(body.rating) < 1 || Number(body.rating) > 5)) {
    errors.push('Rating must be between 1 and 5');
  }
  return errors;
};

const handleError = (res, error) => {
  if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
  if (error.code === 11000) return res.status(409).json({ success: false, message: 'A record with this name already exists' });
  if (error.name === 'ValidationError') {
    return res.status(422).json({ success: false, message: 'Validation failed', errors: Object.values(error.errors).map((e) => e.message) });
  }
  console.error(error);
  return res.status(500).json({ success: false, message: 'Internal server error' });
};

const isValidId = (value) => mongoose.isValidObjectId(value);

const missingId = (res) => res.status(400).json({ success: false, message: 'Invalid record ID' });
const notFound = (res, label) => res.status(404).json({ success: false, message: `${label} not found` });

const makeCrud = ({ label, list, get, create, update, remove, validateCreate, validateUpdate, scoped = false }) => ({
  list: async (req, res) => {
    try { res.json({ success: true, data: await list(scoped ? req.campusScope : undefined) }); }
    catch (error) { handleError(res, error); }
  },
  get: async (req, res) => {
    try {
      if (!isValidId(req.params.id)) return missingId(res);
      const record = await get(req.params.id, scoped ? req.campusScope : undefined);
      if (!record) return notFound(res, label);
      res.json({ success: true, data: record });
    } catch (error) { handleError(res, error); }
  },
  create: async (req, res) => {
    try {
      const errors = validateCreate(req.body);
      if (errors.length) return res.status(422).json({ success: false, message: 'Validation failed', errors });
      const record = await create(req.body, scoped ? req.campusScope : undefined);
      if (record === false) return res.status(403).json({ success: false, message: 'You cannot create a record outside your campus' });
      res.status(201).json({ success: true, message: `${label} created successfully`, data: record });
    } catch (error) { handleError(res, error); }
  },
  update: async (req, res) => {
    try {
      if (!isValidId(req.params.id)) return missingId(res);
      const errors = validateUpdate(req.body);
      if (errors.length) return res.status(422).json({ success: false, message: 'Validation failed', errors });
      const record = await update(req.params.id, req.body, scoped ? req.campusScope : undefined);
      if (!record) return notFound(res, label);
      res.json({ success: true, message: `${label} updated successfully`, data: record });
    } catch (error) { handleError(res, error); }
  },
  remove: async (req, res) => {
    try {
      if (!isValidId(req.params.id)) return missingId(res);
      const record = await remove(req.params.id, scoped ? req.campusScope : undefined);
      if (!record) return notFound(res, label);
      res.json({ success: true, message: `${label} deleted successfully` });
    } catch (error) { handleError(res, error); }
  },
});

const overview = async (req, res) => {
  try { res.json({ success: true, data: await service.getOverview() }); }
  catch (error) { handleError(res, error); }
};

const campuses = makeCrud({
  label: 'Campus',
  list: service.listCampuses,
  get: service.getCampus,
  create: service.createCampus,
  update: service.updateCampus,
  remove: service.removeCampus,
  validateCreate: validateCampus,
  validateUpdate: validateCampusUpdate,
});

const courses = makeCrud({
  label: 'Course',
  list: service.listCourses,
  get: service.getCourse,
  create: service.createCourse,
  update: service.updateCourse,
  remove: service.removeCourse,
  validateCreate: validateCourse,
  validateUpdate: validateCourse,
  scoped: true,
});

const batches = makeCrud({
  label: 'Batch',
  list: service.listBatches,
  get: service.getBatch,
  create: service.createBatch,
  update: service.updateBatch,
  remove: service.removeBatch,
  validateCreate: validateBatch,
  validateUpdate: validateBatch,
  scoped: true,
});

const testimonials = makeCrud({
  label: 'Testimonial',
  list: service.listTestimonials,
  get: service.getTestimonial,
  create: service.createTestimonial,
  update: service.updateTestimonial,
  remove: service.removeTestimonial,
  validateCreate: validateTestimonial,
  validateUpdate: validateTestimonial,
});

const roster = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return missingId(res);
    const data = await service.batchRoster(req.params.id, req.campusScope);
    if (!data) return notFound(res, 'Batch');
    res.json({ success: true, data });
  } catch (error) { handleError(res, error); }
};

const allocate = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return missingId(res);
    const errors = validateAllocate(req.body);
    if (errors.length) return res.status(422).json({ success: false, message: 'Validation failed', errors });
    const result = await service.allocateStudents(req.params.id, req.body.studentIds, req.campusScope);
    if (!result) return notFound(res, 'Batch');
    res.json({
      success: true,
      message: `${result.allocated} student(s) allocated to the batch`,
      data: result,
    });
  } catch (error) { handleError(res, error); }
};

const seedCatalog = async (req, res) => {
  try {
    const result = await service.seed();
    res.json({ success: true, message: 'Catalog seeded successfully', data: result });
  } catch (error) { handleError(res, error); }
};

module.exports = {
  overview,
  campuses,
  courses,
  batches,
  testimonials,
  roster,
  allocate,
  seedCatalog,
};
