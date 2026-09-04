const mongoose = require('mongoose');
const service = require('../services/userService');
const Campus = require('../models/Campus');

const handleError = (res, error) => {
  if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
  if (error.code === 11000) return res.status(409).json({ success: false, message: 'A user with this email already exists' });
  if (error.name === 'ValidationError') {
    return res.status(422).json({ success: false, message: 'Validation failed', errors: Object.values(error.errors).map((e) => e.message) });
  }
  console.error('userController error:', error);
  return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
};

const isValidId = (value) => mongoose.isValidObjectId(value);
const missingId = (res) => res.status(400).json({ success: false, message: 'Invalid record ID' });

const ROLES = ['admin', 'campus_admin', 'teacher', 'student'];

const validateUser = async (body, { requirePassword }) => {
  const errors = [];
  if (!body.name?.trim()) errors.push('Name is required');
  if (!body.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) errors.push('A valid email is required');
  if (requirePassword && (!body.password || body.password.length < 6)) errors.push('Password must be at least 6 characters');
  if (!body.role || !ROLES.includes(body.role)) errors.push('A valid role is required');

  if (body.role === 'teacher') {
    if (!body.phone?.trim()) errors.push('Phone is required for a teacher');
    if (!body.specialization?.trim()) errors.push('Specialization is required for a teacher');
  }

  if (['campus_admin', 'teacher'].includes(body.role)) {
    if (!body.campus?.trim()) {
      errors.push('Campus is required for a campus admin');
    } else {
      const campus = await Campus.findOne({ name: body.campus.trim() }).lean();
      if (!campus) errors.push('Selected campus does not exist');
    }
  }
  return errors;
};

const listUsers = async (req, res) => {
  try { res.json({ success: true, data: await service.listUsers() }); }
  catch (error) { handleError(res, error); }
};

const getUser = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return missingId(res);
    const user = await service.getUser(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) { handleError(res, error); }
};

const createUser = async (req, res) => {
  try {
    const errors = await validateUser(req.body, { requirePassword: true });
    if (errors.length) return res.status(422).json({ success: false, message: 'Validation failed', errors });
    const user = await service.createUser(req.body);
    const { password, ...safeUser } = user.toObject();
    res.status(201).json({ success: true, message: 'User created successfully', data: safeUser });
  } catch (error) { handleError(res, error); }
};

const updateUser = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return missingId(res);
    const errors = await validateUser(req.body, { requirePassword: false });
    if (errors.length) return res.status(422).json({ success: false, message: 'Validation failed', errors });
    const user = await service.updateUser(req.params.id, req.body);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User updated successfully', data: user });
  } catch (error) { handleError(res, error); }
};

const removeUser = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return missingId(res);
    if (req.user && String(req.user._id) === req.params.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }
    const user = await service.removeUser(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) { handleError(res, error); }
};

module.exports = { listUsers, getUser, createUser, updateUser, removeUser };
