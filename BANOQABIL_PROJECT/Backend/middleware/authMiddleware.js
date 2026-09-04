const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ success: false, message: 'User no longer exists' });
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied for this role' });
  }
  next();
};

// Attaches req.campusScope: the campus a campus_admin is restricted to, or null
// for roles (like super admin) that can see every campus. Every service call
// that lists/filters data should respect this value.
const scopeToCampus = (req, res, next) => {
  req.campusScope = req.user && req.user.role === 'campus_admin' ? req.user.campus : null;
  next();
};

module.exports = { protect, authorizeRoles, scopeToCampus };
