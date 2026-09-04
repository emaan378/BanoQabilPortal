const express = require('express');
const controller = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();
// Only the super admin manages user accounts (including creating campus admins).
router.use(protect, authorizeRoles('admin'));

router.route('/').get(controller.listUsers).post(controller.createUser);
router.route('/:id').get(controller.getUser).put(controller.updateUser).delete(controller.removeUser);

module.exports = router;
