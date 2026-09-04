const express = require('express');
const upload = require('../config/spreadsheetMulter');
const { protect, authorizeRoles, scopeToCampus } = require('../middleware/authMiddleware');
const controller = require('../controllers/spreadsheetController');

const router = express.Router();
router.use(protect, authorizeRoles('admin', 'campus_admin'), scopeToCampus);
router.get('/students/export', controller.adminExportStudents);
router.post('/students/import', upload.single('file'), controller.adminImportStudents);
router.get('/teachers/export', controller.adminExportTeachers);
router.post('/teachers/import', upload.single('file'), controller.adminImportTeachers);

module.exports = router;
