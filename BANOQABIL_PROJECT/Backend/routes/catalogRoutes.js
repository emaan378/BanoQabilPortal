const express = require('express');
const controller = require('../controllers/catalogController');
const { protect, authorizeRoles, scopeToCampus } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);

// Campus Management & Website Content (testimonials) & the ops overview are super-admin only.
router.get('/overview', authorizeRoles('admin'), controller.overview);
router.post('/seed', authorizeRoles('admin'), controller.seedCatalog);

router.route('/campuses').get(authorizeRoles('admin'), controller.campuses.list).post(authorizeRoles('admin'), controller.campuses.create);
router.route('/campuses/:id').get(authorizeRoles('admin'), controller.campuses.get).put(authorizeRoles('admin'), controller.campuses.update).delete(authorizeRoles('admin'), controller.campuses.remove);

router.route('/testimonials').get(authorizeRoles('admin'), controller.testimonials.list).post(authorizeRoles('admin'), controller.testimonials.create);
router.route('/testimonials/:id').get(authorizeRoles('admin'), controller.testimonials.get).put(authorizeRoles('admin'), controller.testimonials.update).delete(authorizeRoles('admin'), controller.testimonials.remove);

// A campus admin may read (but not manage) courses — needed for the batch-creation dropdown.
router.get('/courses', authorizeRoles('admin', 'campus_admin'), scopeToCampus, controller.courses.list);
router.get('/courses/:id', authorizeRoles('admin', 'campus_admin'), scopeToCampus, controller.courses.get);
router.post('/courses', authorizeRoles('admin'), controller.courses.create);
router.route('/courses/:id').put(authorizeRoles('admin'), controller.courses.update).delete(authorizeRoles('admin'), controller.courses.remove);

// Batch Allocation is available to both, scoped to the campus admin's own campus.
router.use('/batches', authorizeRoles('admin', 'campus_admin'), scopeToCampus);
router.route('/batches').get(controller.batches.list).post(controller.batches.create);
router.route('/batches/:id').get(controller.batches.get).put(controller.batches.update).delete(controller.batches.remove);
router.get('/batches/:id/roster', controller.roster);
router.post('/batches/:id/allocate', controller.allocate);

module.exports = router;
