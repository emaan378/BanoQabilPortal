const User = require('../models/User');
const Registration = require('../models/Registration');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user / admin
// @route   POST /api/v1/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, campus } = req.body;

    // Public registration must never self-assign admin/campus_admin roles
    // those privileged accounts are only created by a super admin via /api/v1/users.
    const safeRole = ['teacher', 'student'].includes(role) ? role : 'student';

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: safeRole,
      campus,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        campus: user.campus,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token (Login)
// @route   POST /api/v1/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, identifier, password } = req.body;
    const loginIdentifier = String(email || identifier || '').trim();
    let user = await User.findOne({ email: loginIdentifier.toLowerCase() });

    // Student accounts may use roll number, registration ID, or CNIC as their identifier.
    if (!user && loginIdentifier) {
      const registration = await Registration.findOne({
        $or: [
          { rollNumber: loginIdentifier },
          { registrationId: loginIdentifier },
          { cnic: loginIdentifier },
        ],
      }).select('email').lean();
      if (registration?.email) user = await User.findOne({ email: registration.email.toLowerCase() });
    }

    // Check password match
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        campus: user.campus,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
};