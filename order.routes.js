const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrder,
  getOrderByNumber,
  cancelOrder,
  getAllOrders,
  getOrderAdmin,
  updateOrderStatus,
  addTracking,
  processRefund,
  updatePaymentStatus
} = require('../controllers/order.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { validateOrder, validateOrderStatus } = require('../middleware/validate.middleware');

// User routes
router.post('/', protect, validateOrder, createOrder);
router.get('/', protect, getOrders);
router.get('/number/:orderNumber', protect, getOrderByNumber);
router.get('/:id', protect, getOrder);
router.put('/:id/cancel', protect, cancelOrder);

// Admin routes
router.get('/admin/all', protect, adminOnly, getAllOrders);
router.get('/admin/:id', protect, adminOnly, getOrderAdmin);
router.put('/admin/:id/status', protect, adminOnly, validateOrderStatus, updateOrderStatus);
router.put('/admin/:id/tracking', protect, adminOnly, addTracking);
router.put('/admin/:id/refund', protect, adminOnly, processRefund);
router.put('/admin/:id/payment', protect, adminOnly, updatePaymentStatus);

module.exports = router;
