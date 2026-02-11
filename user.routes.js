const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  updateUser,
  toggleUserBlock,
  deleteUser
} = require('../controllers/user.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { validateUpdateProfile, validateAddress } = require('../middleware/validate.middleware');

// Protected routes
router.get('/profile', protect, getUser);
router.put('/profile', protect, validateUpdateProfile, updateProfile);

// Address routes
router.post('/addresses', protect, validateAddress, addAddress);
router.put('/addresses/:id', protect, validateAddress, updateAddress);
router.delete('/addresses/:id', protect, deleteAddress);

// Wishlist routes
router.get('/wishlist', protect, getWishlist);
router.post('/wishlist', protect, addToWishlist);
router.delete('/wishlist/:productId', protect, removeFromWishlist);

// Admin routes
router.get('/', protect, adminOnly, getUsers);
router.get('/:id', protect, adminOnly, getUser);
router.put('/:id', protect, adminOnly, updateUser);
router.put('/:id/block', protect, adminOnly, toggleUserBlock);
router.delete('/:id', protect, adminOnly, deleteUser);

module.exports = router;
