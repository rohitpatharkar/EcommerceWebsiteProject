const express = require('express');
const router = express.Router();
const {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
  applyCoupon,
  removeCoupon,
  syncCart
} = require('../controllers/cart.controller');
const { protect } = require('../middleware/auth.middleware');
const { validateCartItem } = require('../middleware/validate.middleware');

// All cart routes are protected
router.get('/', protect, getCart);
router.post('/items', protect, validateCartItem, addItem);
router.put('/items/:itemId', protect, updateItemQuantity);
router.delete('/items/:itemId', protect, removeItem);
router.delete('/', protect, clearCart);
router.post('/coupon', protect, applyCoupon);
router.delete('/coupon', protect, removeCoupon);
router.post('/sync', protect, syncCart);

module.exports = router;
