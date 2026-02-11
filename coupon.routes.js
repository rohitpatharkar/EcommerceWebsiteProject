const express = require('express');
const router = express.Router();
const {
  getCoupons,
  validateCoupon,
  getAllCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCouponStats
} = require('../controllers/coupon.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { validateCoupon: validateCouponMiddleware } = require('../middleware/validate.middleware');

// Public routes
router.get('/', getCoupons);

// Protected routes
router.post('/validate', protect, validateCoupon);

// Admin routes
router.get('/admin/all', protect, adminOnly, getAllCoupons);
router.get('/admin/:id', protect, adminOnly, getCoupon);
router.get('/admin/:id/stats', protect, adminOnly, getCouponStats);
router.post('/admin', protect, adminOnly, validateCouponMiddleware, createCoupon);
router.put('/admin/:id', protect, adminOnly, updateCoupon);
router.delete('/admin/:id', protect, adminOnly, deleteCoupon);

module.exports = router;
