const express = require('express');
const controller = require('../controllers/studentController');
const { protect, authorizeRoles, scopeToCampus } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect, authorizeRoles('admin', 'campus_admin'), scopeToCampus);

router.route('/').get(controller.listStudents).post(controller.createStudent);
router.post('/:id/documents', controller.addDocument);
router.patch('/documents/:docId/status', controller.updateDocumentStatus);
router.delete('/documents/:docId', controller.removeDocument);
router.patch('/:id/status', controller.updateStudentStatus);
router.route('/:id').get(controller.getStudent).put(controller.updateStudent).delete(controller.removeStudent);

module.exports = router;
