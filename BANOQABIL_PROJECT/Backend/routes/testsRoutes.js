const express = require('express');
const controller = require('../controllers/testsController');
const { protect, authorizeRoles, scopeToCampus } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect, authorizeRoles('admin', 'campus_admin'), scopeToCampus);

router.route('/').get(controller.listTests);
router.route('/:id').get(controller.getTest);
router.post('/:id/schedule', controller.scheduleTest);
router.put('/:id/result', controller.recordResult);

module.exports = router;
