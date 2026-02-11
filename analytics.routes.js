const express = require('express');
const router = express.Router();
const {
  getOverview,
  getDailySales,
  getCategoryPerformance,
  getCustomerAnalytics,
  getProductAnalytics,
  getTrafficAnalytics
} = require('../controllers/analytics.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

// All analytics routes require admin access
router.get('/overview', protect, adminOnly, getOverview);
router.get('/daily-sales', protect, adminOnly, getDailySales);
router.get('/category-performance', protect, adminOnly, getCategoryPerformance);
router.get('/customers', protect, adminOnly, getCustomerAnalytics);
router.get('/products', protect, adminOnly, getProductAnalytics);
router.get('/traffic', protect, adminOnly, getTrafficAnalytics);

module.exports = router;
