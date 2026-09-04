const mongoose = require('mongoose');
const Voucher = require('../models/Voucher');
const Registration = require('../models/Registration');
const Counter = require('../models/Counter');
const { escapeRegex } = require('../utils/lifecycle');

const getNextTrackingId = async () => {
  const year = new Date().getFullYear();
  const counter = await Counter.findOneAndUpdate(
    { _id: `voucher-${year}` },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return `TRK-${year}-${String(counter.sequence).padStart(3, '0')}`;
};

// A voucher is "overdue" when it's still unpaid and past its due date.
const deriveVoucherStatus = (voucher) => {
  if (voucher.status === 'paid') return 'paid';
  if (voucher.dueDate && new Date(voucher.dueDate).getTime() < Date.now()) return 'overdue';
  return 'unpaid';
};

const withDerivedStatus = (voucher) => ({ ...voucher, displayStatus: deriveVoucherStatus(voucher) });

const buildQuery = ({ search, status }) => {
  const query = {};
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    query.$or = [{ trackingId: regex }, { studentName: regex }, { rollNumber: regex }, { description: regex }];
  }
  return query;
};

// Voucher has no direct campus field — it's linked via its Registration.
// For a campus admin we resolve "which registration IDs belong to my campus" first,
// and exclude any voucher that isn't tied to a registration at all (can't verify its campus).
const registrationIdsForCampus = async (campusScope) => {
  const ids = await Registration.find({ campus: campusScope }).distinct('_id');
  return ids.map(String);
};

const getVouchers = async ({ search, status, page = 1, limit = 50 } = {}, campusScope) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const query = buildQuery({ search });
  if (campusScope) query.registration = { $in: await registrationIdsForCampus(campusScope) };

  const all = await Voucher.find(query).sort({ createdAt: -1 }).lean();
  let data = all.map(withDerivedStatus);

  if (status && status !== 'all') {
    data = data.filter((v) => v.displayStatus === status);
  }

  const total = data.length;
  const start = (safePage - 1) * safeLimit;
  const paged = data.slice(start, start + safeLimit);

  return {
    data: paged,
    pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) || 1 },
  };
};

const getSummary = async (campusScope) => {
  const query = campusScope ? { registration: { $in: await registrationIdsForCampus(campusScope) } } : {};
  const all = await Voucher.find(query).lean();
  const withStatus = all.map(withDerivedStatus);

  const totalCollected = withStatus.filter((v) => v.displayStatus === 'paid').reduce((sum, v) => sum + v.amount, 0);
  const outstanding = withStatus.filter((v) => v.displayStatus !== 'paid').reduce((sum, v) => sum + v.amount, 0);
  const overdueCount = withStatus.filter((v) => v.displayStatus === 'overdue').length;

  return { totalCollected, outstanding, overdueCount };
};

const createVoucher = async ({ studentId, rollNumber, description, amount, dueDate }, campusScope) => {
  let registration = null;

  if (studentId && mongoose.isValidObjectId(studentId)) {
    registration = await Registration.findById(studentId).lean();
  }
  if (!registration && rollNumber) {
    registration = await Registration.findOne({ rollNumber: String(rollNumber).trim() }).lean();
  }

  // A campus admin can only raise vouchers for students in their own campus.
  if (campusScope && (!registration || registration.campus !== campusScope)) return false;

  const resolvedRollNumber = registration ? (registration.rollNumber || registration.registrationId || '') : String(rollNumber || '').trim();
  const resolvedStudentName = registration ? registration.name : String(rollNumber || 'Unknown student').trim();

  const voucher = await Voucher.create({
    trackingId: await getNextTrackingId(),
    registration: registration ? registration._id : null,
    rollNumber: resolvedRollNumber,
    studentName: resolvedStudentName,
    description: String(description).trim(),
    amount: Number(amount),
    dueDate: dueDate ? new Date(dueDate) : undefined,
    status: 'unpaid',
  });

  return withDerivedStatus(voucher.toObject());
};

const markPaid = async (id, campusScope) => {
  if (campusScope) {
    const existing = await Voucher.findById(id).lean();
    if (!existing || !existing.registration) return null;
    const registration = await Registration.findById(existing.registration).select('campus').lean();
    if (!registration || registration.campus !== campusScope) return null;
  }
  const voucher = await Voucher.findByIdAndUpdate(
    id,
    { status: 'paid', paidAt: new Date() },
    { new: true }
  ).lean();
  if (!voucher) return null;
  return withDerivedStatus(voucher);
};

module.exports = { getVouchers, getSummary, createVoucher, markPaid, deriveVoucherStatus };
