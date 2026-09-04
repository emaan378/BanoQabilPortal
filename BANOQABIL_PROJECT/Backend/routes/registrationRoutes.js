const express = require('express');
const controller = require('../controllers/registrationController');
const { protect, authorizeRoles, scopeToCampus } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect, authorizeRoles('admin', 'campus_admin'), scopeToCampus);

router.route('/').get(controller.getRegistrations).post(controller.createRegistration);
router.route('/:id').get(controller.getRegistration).put(controller.updateRegistration).delete(controller.deleteRegistration);
router.patch('/:id/stage', controller.advanceStage);
router.post('/:id/test', controller.scheduleTest);
router.put('/:id/test/result', controller.recordTestResult);
router.post('/:id/interview', controller.scheduleInterview);
router.put('/:id/interview', controller.updateInterview);

module.exports = router;
