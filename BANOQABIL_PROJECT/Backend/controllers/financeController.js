const mongoose = require('mongoose');
const service = require('../services/financeService');

const validateCreateVoucher = (body) => {
  const errors = [];
  const hasStudentId = body.studentId && String(body.studentId).trim();
  const hasRollNumber = body.rollNumber && String(body.rollNumber).trim();
  if (!hasStudentId && !hasRollNumber) errors.push('Please select a student');
  if (!body.description || !String(body.description).trim()) errors.push('Description is required');
  const amount = Number(body.amount);
  if (!body.amount || Number.isNaN(amount) || amount <= 0) errors.push('Amount must be a positive number');
  if (body.dueDate && Number.isNaN(new Date(body.dueDate).getTime())) errors.push('Due date is invalid');
  return errors;
};

const handleError = (res, error) => {
  if (error.name === 'ValidationError') {
    return res.status(422).json({ success: false, message: 'Validation failed', errors: Object.values(error.errors).map((e) => e.message) });
  }
  console.error(error);
  return res.status(500).json({ success: false, message: 'Internal server error' });
};

const listVouchers = async (req, res) => {
  try {
    res.json({ success: true, ...(await service.getVouchers(req.query, req.campusScope)) });
  } catch (error) { handleError(res, error); }
};

const getSummary = async (req, res) => {
  try {
    res.json({ success: true, data: await service.getSummary(req.campusScope) });
  } catch (error) { handleError(res, error); }
};

const createVoucher = async (req, res) => {
  try {
    const errors = validateCreateVoucher(req.body);
    if (errors.length) return res.status(422).json({ success: false, message: 'Validation failed', errors });
    const voucher = await service.createVoucher(req.body, req.campusScope);
    if (voucher === false) return res.status(403).json({ success: false, message: 'You can only raise vouchers for students in your own campus' });
    res.status(201).json({ success: true, message: 'Voucher generated successfully', data: voucher });
  } catch (error) { handleError(res, error); }
};

const markPaid = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid voucher ID' });
    const voucher = await service.markPaid(req.params.id, req.campusScope);
    if (!voucher) return res.status(404).json({ success: false, message: 'Voucher not found' });
    res.json({ success: true, message: 'Voucher marked as paid', data: voucher });
  } catch (error) { handleError(res, error); }
};

module.exports = { listVouchers, getSummary, createVoucher, markPaid };
