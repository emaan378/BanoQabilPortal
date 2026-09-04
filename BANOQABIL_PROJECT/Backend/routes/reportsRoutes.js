const express = require('express');
const router = express.Router();
const { getReportOverview } = require('../controllers/reportsController');
const { protect, authorizeRoles, scopeToCampus } = require('../middleware/authMiddleware');

router.use(protect, authorizeRoles('admin', 'campus_admin'), scopeToCampus);

router.get('/overview', getReportOverview);

module.exports = router;
