const express = require('express');
const controller = require('../controllers/teacherController');
const { protect, authorizeRoles, scopeToCampus } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect, authorizeRoles('admin', 'campus_admin'), scopeToCampus);

router.route('/').get(controller.listTeachers).post(controller.createTeacher);
router.post('/:id/documents', controller.addDocument);
router.patch('/documents/:docId/status', controller.updateDocumentStatus);
router.delete('/documents/:docId', controller.removeDocument);
router.route('/:id').get(controller.getTeacher).put(controller.updateTeacher).delete(controller.removeTeacher);

module.exports = router;
