const express = require('express');
const router = express.Router();
const { getDashboardStats, seedInitialData, resolveFlag } = require('../controllers/dashboardController');
const { protect, authorizeRoles, scopeToCampus } = require('../middleware/authMiddleware');

router.get('/stats', protect, authorizeRoles('admin', 'campus_admin'), scopeToCampus, getDashboardStats);
router.post('/seed', protect, authorizeRoles('admin'), seedInitialData);
router.patch('/flags/:id/resolve', protect, authorizeRoles('admin'), resolveFlag);

module.exports = router;