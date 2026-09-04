const express = require('express');
const controller = require('../controllers/financeController');
const { protect, authorizeRoles, scopeToCampus } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect, authorizeRoles('admin', 'campus_admin'), scopeToCampus);

router.get('/vouchers', controller.listVouchers);
router.post('/vouchers', controller.createVoucher);
router.patch('/vouchers/:id/paid', controller.markPaid);
router.get('/summary', controller.getSummary);

module.exports = router;
