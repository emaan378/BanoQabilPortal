const User = require('../models/User');
const Teacher = require('../models/Teacher');
const { getNextTeacherId } = require('./teacherService');

const listUsers = () => User.find().select('-password').sort({ createdAt: -1 }).lean();

const getUser = (id) => User.findById(id).select('-password').lean();

const createUser = async (payload) => {
  const user = await User.create(payload);
  if (payload.role === 'teacher') {
    await Teacher.findOneAndUpdate(
      { email: payload.email.trim().toLowerCase() },
      {
        $set: {
          name: payload.name.trim(),
          email: payload.email.trim().toLowerCase(),
          phone: payload.phone.trim(),
          specialization: payload.specialization.trim(),
          campus: payload.campus || 'Faisalabad Campus',
        },
        $setOnInsert: { teacherId: await getNextTeacherId() },
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    );
  }
  return user;
};

const updateUser = async (id, payload) => {
  const updates = { ...payload };
  delete updates.password; // password changes go through a dedicated flow, not plain update
  return User.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select('-password');
};

const removeUser = (id) => User.findByIdAndDelete(id);

module.exports = { listUsers, getUser, createUser, updateUser, removeUser };
