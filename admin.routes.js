const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getSalesChart,
  getTopProducts,
  getTopCustomers,
  getInventoryReport,
  getRevenueReport,
  search
} = require('../controllers/admin.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

// All admin routes require admin access
router.get('/dashboard', protect, adminOnly, getDashboardStats);
router.get('/sales-chart', protect, adminOnly, getSalesChart);
router.get('/top-products', protect, adminOnly, getTopProducts);
router.get('/top-customers', protect, adminOnly, getTopCustomers);
router.get('/inventory-report', protect, adminOnly, getInventoryReport);
router.get('/revenue-report', protect, adminOnly, getRevenueReport);
router.get('/search', protect, adminOnly, search);

module.exports = router;
