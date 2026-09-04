const express = require('express');
const controller = require('../controllers/interviewsController');
const { protect, authorizeRoles, scopeToCampus } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect, authorizeRoles('admin', 'campus_admin'), scopeToCampus);

router.route('/').get(controller.listInterviews);
router.route('/:id').get(controller.getInterview);
router.post('/:id/schedule', controller.scheduleInterview);
router.put('/:id/result', controller.recordInterviewResult);

module.exports = router;
